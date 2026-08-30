import pandas as pd
from typing import Dict

def get_zone_id(node_id: str) -> str:
    """
    Deterministically extracts the numerical suffix from the node_id
    and maps it to a logical monitoring zone.
    
    Example: 'N_FULL_03' -> 'ZONE_03'
    """
    if not isinstance(node_id, str):
        return None
        
    # Split by underscore and take the last part (e.g., '01', '02')
    parts = node_id.split('_')
    if len(parts) >= 3:
        suffix = parts[-1]
        return f"ZONE_{suffix}"
    
    return None

def prepare_node_zones(outputs: Dict[str, pd.DataFrame]) -> Dict[str, pd.DataFrame]:
    """
    Processes the heterogeneous outputs and adds a deterministic 'zone_id'
    to every applicable dataframe without modifying existing columns.
    """
    mapped_outputs = {}
    
    for tier, df in outputs.items():
        if df.empty:
            mapped_outputs[tier] = df
            continue
            
        # Create a deep copy to strictly preserve the original dataframe state
        df_copy = df.copy()
        
        if 'node_id' in df_copy.columns:
            # Map the zone_id using the deterministic helper
            df_copy['zone_id'] = df_copy['node_id'].apply(get_zone_id)
            
        mapped_outputs[tier] = df_copy
        
    return mapped_outputs

import numpy as np

def sigmoid_normalize(score, k=10):
    """
    Deterministically normalizes a score to [0, 1] using a sigmoid function.
    Safely handles numeric values and pandas Series.
    Missing values remain unchanged (NA).
    """
    if pd.isna(score) if np.isscalar(score) else score.isna().all():
        return score
    return 1 / (1 + np.exp(-k * score))

def severity_to_risk(rank):
    """
    Maps ordinal severity_rank (1, 2, 3) to risk scores (0.0, 0.5, 1.0).
    Missing values remain NA.
    """
    if pd.isna(rank) if np.isscalar(rank) else rank.isna().all():
        return rank
        
    mapping = {1: 0.0, 2: 0.5, 3: 1.0}
    
    if isinstance(rank, pd.Series):
        return rank.map(mapping)
    return mapping.get(rank, pd.NA)

def calculate_node_current_risk(outputs: Dict[str, pd.DataFrame]) -> Dict[str, pd.DataFrame]:
    """
    Calculates the 'node_current_risk_score' by averaging available normalized 
    signals per tier, preserving all original columns.
    """
    processed_outputs = {}
    
    for tier, df in outputs.items():
        if df.empty:
            processed_outputs[tier] = df
            continue
            
        df_out = df.copy()
        
        signals = []
        
        if tier == 'Full' or tier == 'Lite':
            if 'vibration_hazard_score' in df_out:
                signals.append(df_out['vibration_hazard_score'])
            if 'fusion_anomaly_score' in df_out:
                signals.append(sigmoid_normalize(df_out['fusion_anomaly_score']))
            if 'severity_rank' in df_out:
                signals.append(severity_to_risk(df_out['severity_rank']))
                
        elif tier == 'GNSS Reference':
            if 'position_anomaly_score' in df_out:
                signals.append(sigmoid_normalize(df_out['position_anomaly_score']))
            if 'severity_rank' in df_out:
                signals.append(severity_to_risk(df_out['severity_rank']))
                
        elif tier == 'Crack':
            if 'crack_anomaly_score' in df_out:
                signals.append(sigmoid_normalize(df_out['crack_anomaly_score']))
                
        # Calculate mean of available signals row-wise
        if signals:
            # Concatenate horizontally
            signal_df = pd.concat(signals, axis=1)
            # Calculate mean ignoring NaNs
            df_out['node_current_risk_score'] = signal_df.mean(axis=1, skipna=True)
        else:
            df_out['node_current_risk_score'] = pd.NA
            
        processed_outputs[tier] = df_out
        
    return processed_outputs

def calculate_node_future_risk(outputs: Dict[str, pd.DataFrame]) -> Dict[str, pd.DataFrame]:
    """
    Calculates the 'node_future_risk_score' and 'future_change_mm' only for 
    Full nodes using the Stage 5 LSTM forecast.
    """
    processed_outputs = {}
    FORECAST_WARNING_CHANGE_MM = 5.0
    
    for tier, df in outputs.items():
        if df.empty:
            processed_outputs[tier] = df
            continue
            
        df_out = df.copy()
        
        if tier == 'Full':
            if 'forecast_displacement_step_3_mm' in df_out and 'calculated_displacement_from_baseline_mm' in df_out:
                # Calculate absolute predicted displacement change
                df_out['future_change_mm'] = (
                    df_out['forecast_displacement_step_3_mm'] - 
                    df_out['calculated_displacement_from_baseline_mm']
                ).abs()
                
                # Normalize risk score using a static threshold
                df_out['node_future_risk_score'] = (
                    df_out['future_change_mm'] / FORECAST_WARNING_CHANGE_MM
                ).clip(0.0, 1.0)
                
        # For non-Full tiers, or if columns are missing, we intentionally do not
        # add the future risk columns to maintain the heterogeneous architecture.
        # Alternatively, we could add them as all NA, but omitting them is cleaner
        # unless specifically requested. We will omit them for non-Full tiers.
                
        processed_outputs[tier] = df_out
        
    return processed_outputs

def calculate_zone_risk(outputs: Dict[str, pd.DataFrame]) -> pd.DataFrame:
    """
    Aggregates node-level risk scores into zone-level risk scores.
    Returns a new DataFrame containing: zone_id, timestamp, 
    zone_current_risk_score, zone_future_risk_score.
    """
    all_dfs = []
    
    for tier, df in outputs.items():
        if df.empty or 'zone_id' not in df.columns:
            continue
            
        # Select the necessary columns
        cols_to_keep = ['zone_id', 'timestamp', 'node_current_risk_score']
        
        # Check if future risk exists (mostly for Full tier)
        if 'node_future_risk_score' in df.columns:
            cols_to_keep.append('node_future_risk_score')
            
        # Ensure all requested columns exist in this df
        valid_cols = [c for c in cols_to_keep if c in df.columns]
        
        # Append subset
        all_dfs.append(df[valid_cols])
        
    if not all_dfs:
        return pd.DataFrame(columns=['zone_id', 'timestamp', 'zone_current_risk_score', 'zone_future_risk_score'])
        
    # Combine all tiers vertically
    combined = pd.concat(all_dfs, ignore_index=True)
    
    # Ensure missing columns (like node_future_risk_score for Lite) are created as NaN during concat
    if 'node_future_risk_score' not in combined.columns:
        combined['node_future_risk_score'] = pd.NA
        
    # Aggregate using mean, automatically skipping NaNs
    zone_agg = combined.groupby(['zone_id', 'timestamp'], as_index=False).agg({
        'node_current_risk_score': 'mean',
        'node_future_risk_score': 'mean'
    })
    
    # Rename columns to match requirement
    zone_agg = zone_agg.rename(columns={
        'node_current_risk_score': 'zone_current_risk_score',
        'node_future_risk_score': 'zone_future_risk_score'
    })
    
    # Sort chronologically and by zone
    zone_agg = zone_agg.sort_values(by=['zone_id', 'timestamp']).reset_index(drop=True)
    
    return calculate_zone_composite_risk(zone_agg)

def calculate_zone_composite_risk(zone_agg: pd.DataFrame) -> pd.DataFrame:
    """
    Applies the composite risk formula and calculates the categorical zone_risk_level.
    """
    if zone_agg.empty:
        return zone_agg
        
    df = zone_agg.copy()
    
    def compute_composite(row):
        c = row.get('zone_current_risk_score', pd.NA)
        f = row.get('zone_future_risk_score', pd.NA)
        
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
            
    df['zone_composite_risk_score'] = df.apply(compute_composite, axis=1)
    
    def get_risk_level(score):
        if pd.isna(score):
            return pd.NA
        elif score < 0.33:
            return "SAFE"
        elif score < 0.66:
            return "WARNING"
        else:
            return "CRITICAL"
            
    df['zone_risk_level'] = df['zone_composite_risk_score'].apply(get_risk_level)
    
    return df
