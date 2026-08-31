import pandas as pd
import numpy as np
from typing import Dict, Tuple

def generate_trend_direction(slope):
    """
    Derives trend direction strictly from numerical slope without modifying the slope value.
    """
    if pd.isna(slope):
        return pd.NA
        
    # Standard math check for physical trend direction
    if slope > 0:
        return "INCREASING"
    elif slope < 0:
        return "DECREASING"
    else:
        return "STABLE"

def generate_stage7_outputs(outputs: Dict[str, pd.DataFrame], final_zone_output: pd.DataFrame = None) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Stage 7: Final Node-Level Output Generation
    Converts raw heterogeneous ML pipeline outputs into clean, unified Dashboard and GIS datasets.
    No zone aggregation. No node grouping.
    """
    all_dash = []
    all_gis = []

    for tier, df in outputs.items():
        if df.empty:
            continue
            
        dash_df = pd.DataFrame()
        dash_df['node_id'] = df['node_id']
        dash_df['node_type'] = tier
        dash_df['timestamp'] = df['timestamp']
        if 'zone_id' in df.columns:
            dash_df['zone_id'] = df['zone_id']
        
        gis_df = dash_df.copy()
        
        # Determine coordinates if present in the source dataframe (they aren't simulated in earlier stages but we handle robustly)
        if 'latitude' in df.columns:
            gis_df['latitude'] = df['latitude']
        else:
            gis_df['latitude'] = pd.NA
            
        if 'longitude' in df.columns:
            gis_df['longitude'] = df['longitude']
        else:
            gis_df['longitude'] = pd.NA

        # Pre-fill all required columns with NaN (null isolation)
        dash_cols = [
            'anomaly_score', 'anomaly_flag', 
            'forecast_displacement_step_1_mm', 'forecast_displacement_step_2_mm', 'forecast_displacement_step_3_mm',
            'trend_direction', 'hazard_class', 'classification_confidence', 'severity_slope'
        ]
        
        for col in dash_cols:
            dash_df[col] = pd.NA
            
        gis_cols = [
            'anomaly_score', 'anomaly_flag', 'classification_confidence', 
            'severity_slope', 'trend_direction', 'forecast_displacement_step_3_mm'
        ]
        for col in gis_cols:
            gis_df[col] = pd.NA
            
        # 1. FULL NODE MAPPING
        if tier == 'Full':
            dash_df['anomaly_score'] = df.get('fusion_anomaly_score', pd.NA)
            dash_df['anomaly_flag'] = df.get('fusion_anomaly_flag', pd.NA)
            dash_df['forecast_displacement_step_1_mm'] = df.get('forecast_displacement_step_1_mm', pd.NA)
            dash_df['forecast_displacement_step_2_mm'] = df.get('forecast_displacement_step_2_mm', pd.NA)
            dash_df['forecast_displacement_step_3_mm'] = df.get('forecast_displacement_step_3_mm', pd.NA)
            dash_df['severity_slope'] = df.get('displacement_progression_rate', pd.NA)
            dash_df['trend_direction'] = dash_df['severity_slope'].apply(generate_trend_direction)
            dash_df['hazard_class'] = df.get('vibration_hazard_label', pd.NA)
            dash_df['classification_confidence'] = df.get('vibration_hazard_score', pd.NA)
            
        # 2. LITE NODE MAPPING
        elif tier == 'Lite':
            dash_df['anomaly_score'] = df.get('fusion_anomaly_score', pd.NA)
            dash_df['anomaly_flag'] = df.get('fusion_anomaly_flag', pd.NA)
            dash_df['severity_slope'] = df.get('tilt_progression_rate', pd.NA)
            dash_df['trend_direction'] = dash_df['severity_slope'].apply(generate_trend_direction)
            dash_df['hazard_class'] = df.get('vibration_hazard_label', pd.NA)
            dash_df['classification_confidence'] = df.get('vibration_hazard_score', pd.NA)
            
        # 3. CRACK NODE MAPPING
        elif tier == 'Crack':
            dash_df['anomaly_score'] = df.get('crack_anomaly_score', pd.NA)
            dash_df['anomaly_flag'] = df.get('crack_anomaly_flag', pd.NA)
            
        # 4. GNSS REFERENCE NODE MAPPING
        elif tier == 'GNSS Reference':
            dash_df['anomaly_score'] = df.get('position_anomaly_score', pd.NA)
            dash_df['anomaly_flag'] = df.get('position_anomaly_flag', pd.NA)
            dash_df['severity_slope'] = df.get('vertical_progression_rate', pd.NA)
            dash_df['trend_direction'] = dash_df['severity_slope'].apply(generate_trend_direction)
            
        # Sync mapped values to GIS output
        for col in ['anomaly_score', 'anomaly_flag', 'classification_confidence', 'severity_slope', 'trend_direction']:
            gis_df[col] = dash_df[col]
            
        if tier == 'Full':
            gis_df['forecast_displacement_step_3_mm'] = dash_df['forecast_displacement_step_3_mm']
            
        all_dash.append(dash_df)
        all_gis.append(gis_df)
        
    final_dash = pd.concat(all_dash, ignore_index=True)
    final_gis = pd.concat(all_gis, ignore_index=True)
    
    if final_zone_output is not None and 'zone_id' in final_dash.columns:
        zone_scores = final_zone_output[['zone_id', 'timestamp', 'zone_composite_risk_score']].rename(
            columns={'zone_composite_risk_score': 'composite_risk_score'}
        )
        final_dash = final_dash.merge(zone_scores, on=['zone_id', 'timestamp'], how='left')
        final_gis = final_gis.merge(zone_scores, on=['zone_id', 'timestamp'], how='left')
        
        final_dash.drop(columns=['zone_id'], inplace=True)
        final_gis.drop(columns=['zone_id'], inplace=True)
    else:
        final_dash['composite_risk_score'] = pd.NA
        final_gis['composite_risk_score'] = pd.NA
        if 'zone_id' in final_dash.columns:
            final_dash.drop(columns=['zone_id'], inplace=True)
            final_gis.drop(columns=['zone_id'], inplace=True)
    
    # Sort chronologically per node
    final_dash = final_dash.sort_values(['node_id', 'timestamp']).reset_index(drop=True)
    final_gis = final_gis.sort_values(['node_id', 'timestamp']).reset_index(drop=True)
    
    return final_dash, final_gis

def export_stage7_files(dashboard_df: pd.DataFrame, gis_df: pd.DataFrame):
    """
    Exports the generated DataFrames into standard CSV and JSON.
    """
    dashboard_df.to_csv("mineguard_dashboard_output.csv", index=False)
    gis_df.to_csv("mineguard_gis_node_output.csv", index=False)
    
    # Export JSON as independent records per user requirements
    # dropna handles cases but user wants independent records, pandas to_json will map NA to null cleanly
    dashboard_df.to_json("mineguard_node_output.json", orient="records", indent=4)
