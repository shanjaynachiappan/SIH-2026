import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

def estimate_progression(df: pd.DataFrame, tier: str) -> pd.DataFrame:
    """
    Stage 4: Severity & Progression Estimation
    Performs independent time-series Linear Regression per node_id 
    to calculate progression rates.
    """
    if df.empty:
        return df

    # Work on a copy to preserve Stage 3 outputs
    df = df.copy()

    # Determine the progression target variable based on the tier
    if tier == 'Full':
        target_col = 'calculated_displacement_from_baseline_mm'
        rate_col = 'displacement_progression_rate'
        pred_col = 'displacement_regression_predicted_value'
    elif tier == 'Lite':
        target_col = 'tilt_magnitude_deg'
        rate_col = 'tilt_progression_rate'
        pred_col = 'tilt_regression_predicted_value'
    elif tier == 'GNSS Reference':
        target_col = 'vertical_displacement_mm'
        rate_col = 'vertical_progression_rate'
        pred_col = 'vertical_regression_predicted_value'
    elif tier == 'Crack':
        # Crack nodes bypass Stage 4 for the MVP
        return df
    else:
        return df

    # Validate that the required target column exists
    if target_col not in df.columns:
        print(f"[ERROR] Stage 4: Required column '{target_col}' not found for tier '{tier}'.")
        return df

    # Ensure timestamp is datetime
    if not pd.api.types.is_datetime64_any_dtype(df['timestamp']):
        df['timestamp'] = pd.to_datetime(df['timestamp'])

    # Initialize output columns
    df[rate_col] = pd.NA
    df[pred_col] = pd.NA

    # Process each node independently
    for node_id, group in df.groupby('node_id'):
        if group.empty:
            continue
            
        # Ensure chronological sorting
        group = group.sort_values('timestamp')
        
        # Drop NaNs from the target variable to safely fit regression
        valid_mask = group[target_col].notna()
        valid_group = group[valid_mask]
        
        if len(valid_group) < 2:
            # Cannot run regression on less than 2 points
            continue

        # Calculate numerical elapsed time in hours relative to the node's first reading
        t0 = valid_group['timestamp'].iloc[0]
        elapsed_hours = (valid_group['timestamp'] - t0).dt.total_seconds() / 3600.0
        
        # Prepare regression inputs
        X = elapsed_hours.values.reshape(-1, 1)
        y = valid_group[target_col].values
        
        # Fit Linear Regression
        lr = LinearRegression()
        lr.fit(X, y)
        
        # Calculate progression rate (slope)
        slope = lr.coef_[0]
        
        # Calculate predicted regression line
        y_pred = lr.predict(X)
        
        # Map back to the dataframe
        df.loc[valid_group.index, rate_col] = slope
        df.loc[valid_group.index, pred_col] = y_pred

    # Step 2: Severity Classification
    # Initialize severity columns
    df['severity_label'] = pd.NA
    df['severity_rank'] = pd.NA

    if rate_col in df.columns:
        # Determine thresholds based on tier
        if tier == 'Full':
            low_thresh, high_thresh = 0.045, 0.11
        elif tier == 'Lite':
            low_thresh, high_thresh = 0.00007, 0.00025
        elif tier == 'GNSS Reference':
            low_thresh, high_thresh = 0.06, 0.18
        else:
            low_thresh, high_thresh = None, None

        if low_thresh is not None and high_thresh is not None:
            # Apply thresholds using the absolute magnitude of the progression rate
            # This ensures rapid negative movement (e.g. subsidence) triggers High severity
            rates_magnitude = df[rate_col].astype(float).abs()
            
            # High (3)
            high_mask = rates_magnitude > high_thresh
            df.loc[high_mask, 'severity_label'] = 'High'
            df.loc[high_mask, 'severity_rank'] = 3
            
            # Medium (2)
            med_mask = (rates_magnitude >= low_thresh) & (rates_magnitude <= high_thresh)
            df.loc[med_mask, 'severity_label'] = 'Medium'
            df.loc[med_mask, 'severity_rank'] = 2
            
            # Low (1)
            low_mask = rates_magnitude < low_thresh
            df.loc[low_mask, 'severity_label'] = 'Low'
            df.loc[low_mask, 'severity_rank'] = 1

    return df

if __name__ == '__main__':
    # Small isolated test
    import os
    import sys
    sys.path.append(os.path.abspath(os.path.dirname(__file__)))
    from stage1_ingestion import ingest_sensor_data
    from stage2_feature_engineering import engineer_features
    from stage3_coordinator import run_stage3

    base_path = 'dataset'
    files = [
        os.path.join(base_path, 'full_nodes_all_4_sensors_500_total.csv'),
        os.path.join(base_path, 'gnss_reference_tilt_500_total.csv'),
        os.path.join(base_path, 'lite_nodes_tilt_vibration_500_total.csv'),
        os.path.join(base_path, 'tilt_sensor_500_readings.csv')
    ]

    print("--- Simulating Stage 1 -> 2 -> 3 ---")
    ds1 = ingest_sensor_data(files)
    ds2 = engineer_features(ds1)
    ds3 = run_stage3(ds2)
    
    print("\n--- Running Isolated Stage 4 Progression Test ---")
    
    for tier, df in ds3.items():
        initial_rows = len(df)
        df_out = estimate_progression(df, tier)
        final_rows = len(df_out)
        
        print(f"==== TIER: {tier} ====")
        print(f"Row count preservation: {initial_rows} -> {final_rows} (Valid: {initial_rows == final_rows})")
        
        if tier == 'Crack':
            print("Action: Passed through unchanged.")
            continue
            
        rate_cols = [c for c in df_out.columns if 'progression_rate' in c]
        pred_cols = [c for c in df_out.columns if 'regression_predicted' in c]
        
        if rate_cols and pred_cols:
            r_col = rate_cols[0]
            p_col = pred_cols[0]
            
            nodes_processed = df_out['node_id'].nunique()
            print(f"Nodes Processed Independently: {nodes_processed}")
            
            # Show a sample of progression rates per node
            print("Sample Progression Rates (Slope per node):")
            sample_rates = df_out.groupby('node_id')[r_col].first()
            print(sample_rates)
        else:
            print("No progression columns found.")
        print("-" * 40)
