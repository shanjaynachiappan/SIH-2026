import pandas as pd
import numpy as np
import datetime
import math

from stage2_feature_engineering import engineer_features
from stage3_coordinator import run_stage3
from stage4_coordinator import run_stage4
from stage5_forecasting import forecast_subsidence
from stage6_zone_fusion import calculate_node_current_risk, calculate_node_future_risk
from stage7_output_generation import generate_stage7_outputs

NODE_HISTORY = {}
MAX_BUFFER = 50

def preload_history():
    """
    Preloads the last (MAX_BUFFER - 1) historical readings from the CSV datasets
    into NODE_HISTORY so that the ML pipeline has context for anomalies and forecasts
    on the very first API call.
    """
    global NODE_HISTORY
    import os
    from stage1_ingestion import ingest_sensor_data
    
    base_path = os.path.join(os.path.dirname(__file__), 'dataset')
    files = [
        os.path.join(base_path, 'full_nodes_all_4_sensors_500_total.csv'),
        os.path.join(base_path, 'gnss_reference_tilt_500_total.csv'),
        os.path.join(base_path, 'lite_nodes_tilt_vibration_500_total.csv'),
        os.path.join(base_path, 'tilt_sensor_500_readings.csv')
    ]
    
    try:
        datasets = ingest_sensor_data(files)
        for tier, df in datasets.items():
            for node_id, group in df.groupby('node_id'):
                recent = group.sort_values('timestamp').tail(MAX_BUFFER - 1)
                NODE_HISTORY[node_id] = recent.copy()
        print(f"[INIT] Successfully preloaded historical context for {len(NODE_HISTORY)} nodes.")
    except Exception as e:
        print(f"[INIT] Skipping history preload (Datasets not found or error: {e})")

# Load history when the module is imported (e.g. when Flask starts)
preload_history()

def validate_payload(payload: dict) -> bool:
    """Validates that the incoming JSON payload has the required universal fields."""
    if not isinstance(payload, dict):
        return False
    if 'node_id' not in payload or 'timestamp' not in payload:
        return False
    try:
        pd.to_datetime(payload['timestamp'])
    except Exception:
        return False
    return True

def identify_tier(payload: dict) -> str:
    """Identifies node tier based on node_type or node_id prefix convention."""
    if 'node_type' in payload:
        return payload['node_type']
    node_id = payload.get('node_id', '')
    if node_id.startswith('N_FULL_'):
        return 'Full'
    elif node_id.startswith('N_LITE_'):
        return 'Lite'
    elif node_id.startswith('N_CRACK_'):
        return 'Crack'
    elif node_id.startswith('N_GNSS_'):
        return 'GNSS Reference'
    return None

def process_sensor_json(payload: dict) -> dict:
    """
    Main interface for live JSON ingestion.
    Validates, infers tier, builds history buffer, engineers missing features,
    and runs the applicable AI/ML pipeline stages.
    """
    if not validate_payload(payload):
        return {"error": "Invalid payload. Missing node_id, timestamp, or bad format."}
        
    tier = identify_tier(payload)
    if not tier:
        return {"error": "Could not identify node tier from node_id or node_type."}
        
    node_id = payload['node_id']
    provided_keys = set(payload.keys())
    
    # 1. Prepare row and manage history
    new_row = pd.DataFrame([payload])
    new_row['timestamp'] = pd.to_datetime(new_row['timestamp'])
    new_row['node_type'] = tier
    
    if node_id not in NODE_HISTORY:
        NODE_HISTORY[node_id] = pd.DataFrame()
        
    history = pd.concat([NODE_HISTORY[node_id], new_row], ignore_index=True)
    if len(history) > MAX_BUFFER:
        history = history.tail(MAX_BUFFER).reset_index(drop=True)
        
    # Calculate base magnitude features if missing but required by Stage 2
    if 'tilt_x_deg' in history.columns and 'tilt_y_deg' in history.columns and 'tilt_magnitude_deg' not in history.columns:
        history['tilt_magnitude_deg'] = np.sqrt(history['tilt_x_deg']**2 + history['tilt_y_deg']**2)
        
    if tier == 'GNSS Reference':
        if 'elevation_m' in history.columns and 'vertical_displacement_mm' not in history.columns:
            baseline_elevation = history['elevation_m'].iloc[0]
            history['vertical_displacement_mm'] = (history['elevation_m'] - baseline_elevation) * 1000.0
            
        lat_col = 'latitude' if 'latitude' in history.columns else 'latitude_deg' if 'latitude_deg' in history.columns else None
        lon_col = 'longitude' if 'longitude' in history.columns else 'longitude_deg' if 'longitude_deg' in history.columns else None
        
        if lat_col and lon_col and 'horizontal_displacement_mm' not in history.columns:
            baseline_lat = history[lat_col].iloc[0]
            baseline_lon = history[lon_col].iloc[0]
            
            def haversine_mm(lat1, lon1, lat2, lon2):
                R = 6371000.0
                phi1, phi2 = math.radians(lat1), math.radians(lat2)
                dphi = math.radians(lat2 - lat1)
                dlambda = math.radians(lon2 - lon1)
                a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
                return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a)) * 1000.0
                
            history['horizontal_displacement_mm'] = history.apply(
                lambda r: haversine_mm(baseline_lat, baseline_lon, r[lat_col], r[lon_col]), axis=1
            )
            
    NODE_HISTORY[node_id] = history
    
    # 2. Package for pipeline
    ds1 = {tier: history.copy()}
    
    # 3. Stage 2: Feature Engineering (Calculate missing features automatically)
    ds2 = engineer_features(ds1)
    
    # 4. Strict Conditional Preservation: Restore explicitly provided values
    last_idx = len(ds2[tier]) - 1
    for key in provided_keys:
        if key in ds2[tier].columns:
            # Overwrite the feature-engineered value with the raw provided value
            ds2[tier].at[last_idx, key] = payload[key]
            
    # Convert pd.NA to np.nan to prevent downstream astype(float) errors on first readings
    for col in ds2[tier].columns:
        ds2[tier][col] = ds2[tier][col].apply(lambda x: np.nan if pd.isna(x) else x)
            
    # 5. Run AI/ML stages
    ds3 = run_stage3(ds2)
    
    try:
        ds4 = run_stage4(ds3)
    except TypeError:
        # Bypasses pandas astype(float) bug on pure pd.NA columns for 1-row dataframes
        ds4 = ds3.copy()
        
    ds5 = {}
    if tier == 'Full':
        # forecast_subsidence explicitly designed for Full nodes
        ds5[tier] = forecast_subsidence(ds4[tier], tier)
    else:
        ds5[tier] = ds4[tier].copy()
        
    # 6. Stage 6: Current & Future Risk (node-level logic)
    ds6_c = calculate_node_current_risk(ds5)
    ds6_f = calculate_node_future_risk(ds6_c)
    
    final_df = ds6_f[tier].copy()
    
    def compute_composite(row):
        c = row.get('node_current_risk_score', pd.NA)
        f = row.get('node_future_risk_score', pd.NA)
        
        c_na = pd.isna(c)
        f_na = pd.isna(f)
        
        if c_na and f_na:
            return pd.NA
        elif c_na and not f_na:
            return f
        elif f_na and not c_na:
            return c
        else:
            return (0.70 * c) + (0.30 * f)
            
    final_df['node_composite_risk_score'] = final_df.apply(compute_composite, axis=1)
    
    # 7. Stage 7: Final Node-Level Output Generation
    # We pass None for final_zone_output because we are generating output for a single node, not a zone
    dash_df, gis_df = generate_stage7_outputs({tier: final_df}, None)
    
    # Inject the node_composite_risk_score back into the Stage 7 output (overriding the pd.NA default)
    dash_df['composite_risk_score'] = final_df['node_composite_risk_score'].values
    
    # 8. Extract the last row (the current live reading) as JSON
    final_record = dash_df.iloc[-1].replace({np.nan: None, pd.NA: None}).to_dict()
    if isinstance(final_record.get('timestamp'), pd.Timestamp):
        final_record['timestamp'] = final_record['timestamp'].isoformat()
        
    return final_record

