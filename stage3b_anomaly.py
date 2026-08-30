import pandas as pd
from sklearn.ensemble import IsolationForest

def detect_anomalies(df: pd.DataFrame, tier: str) -> pd.DataFrame:
    """
    Stage 3b / Stage 3 Anomaly Detection.
    Runs Isolation Forest on the tier-specific dataset to detect abnormalities.
    Returns the dataframe enriched with anomaly scores and flags.
    """
    if df.empty:
        return df
        
    df = df.copy()

    # Define the required features and output columns based on tier
    if tier == 'Full':
        features = [
            'calculated_tilt_rate_deg_per_time',
            'calculated_displacement_rate_mm_per_time',
            'calculated_crack_growth_rate_mm_per_time',
            'rms_acceleration_mps2'
        ]
        score_col = 'fusion_anomaly_score'
        flag_col = 'fusion_anomaly_flag'
        
    elif tier == 'Lite':
        features = [
            'calculated_tilt_rate_deg_per_time',
            'rms_acceleration_mps2'
        ]
        score_col = 'fusion_anomaly_score'
        flag_col = 'fusion_anomaly_flag'
        
    elif tier == 'Crack':
        features = [
            'calculated_crack_growth_rate_mm_per_time'
        ]
        score_col = 'crack_anomaly_score'
        flag_col = 'crack_anomaly_flag'
        
    elif tier == 'GNSS Reference':
        features = [
            'calculated_vertical_displacement_rate_mm_per_time',
            'calculated_horizontal_displacement_rate_mm_per_time',
            'calculated_tilt_rate_deg_per_time'
        ]
        score_col = 'position_anomaly_score'
        flag_col = 'position_anomaly_flag'
    else:
        return df

    # Check if all required features exist in the dataframe
    missing_features = [f for f in features if f not in df.columns]
    if missing_features:
        # If features are missing, we cannot run the anomaly detection for this tier safely
        print(f"[WARNING] Tier {tier} is missing features {missing_features}. Skipping anomaly detection.")
        df[score_col] = 0.0
        df[flag_col] = 0
        return df

    # We only fit the Isolation Forest on valid data without NaNs
    valid_mask = df[features].notna().all(axis=1)
    
    if valid_mask.any():
        # Initialize default safe values
        df[score_col] = 0.0
        df[flag_col] = 0
        
        # Fit Isolation Forest PER NODE to respect independent histories
        for node_id, group in df[valid_mask].groupby('node_id'):
            if group.empty:
                continue
                
            X = group[features]
            
            # For a prototype, contamination=0.05 is an assumption
            # In production, this might be adjusted or dynamic
            clf = IsolationForest(contamination=0.05, random_state=42)
            
            preds = clf.fit_predict(X)
            scores = -clf.decision_function(X)
            flags = (preds == -1).astype(int)
            
            # Map back to the specific rows for this node
            df.loc[X.index, score_col] = scores
            df.loc[X.index, flag_col] = flags

    return df
