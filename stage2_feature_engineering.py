import pandas as pd
from typing import Dict

def engineer_features(datasets: Dict[str, pd.DataFrame]) -> Dict[str, pd.DataFrame]:
    """
    Stage 2: Feature Engineering
    Dynamically recalculates rate-of-change and cumulative features based on 
    chronological raw sensor measurements per node_id.
    
    Args:
        datasets: Dict of dataframes from Stage 1, keyed by node_tier.
        
    Returns:
        Dict of dataframes with engineered features calculated.
    """
    engineered_datasets = {}

    for tier, df in datasets.items():
        # Work on a copy to avoid SettingWithCopyWarning
        df = df.copy()

        # Group by node_id for independent histories
        grouped = df.groupby('node_id')

        # 1. Calculate Time Delta in Hours (to match the _per_time unit of the dataset)
        # Using shift to calculate difference between t and t-1 per node
        time_diff = grouped['timestamp'].diff()
        # Convert to hours. If time_diff is 0, we avoid division by zero by setting a tiny number or NA.
        # But for valid time series, it should be > 0.
        time_delta_hr = time_diff.dt.total_seconds() / 3600.0
        
        # We will replace 0 with NaN to avoid division by zero warnings, though ideally time advances.
        time_delta_hr = time_delta_hr.replace(0, pd.NA)

        # 2. Tilt Features (Full, GNSS, Lite)
        if 'tilt_magnitude_deg' in df.columns:
            df['calculated_tilt_change_deg'] = grouped['tilt_magnitude_deg'].diff()
            df['calculated_tilt_rate_deg_per_time'] = df['calculated_tilt_change_deg'] / time_delta_hr
            
            # Fill the first row (NaN) with 0.0 to match the clean dataset format
            df['calculated_tilt_change_deg'] = df['calculated_tilt_change_deg'].fillna(0.0)
            df['calculated_tilt_rate_deg_per_time'] = df['calculated_tilt_rate_deg_per_time'].fillna(0.0)

        # 3. Full Node Displacement Features
        if tier == 'Full' and 'displacement_mm' in df.columns:
            # Optionally rename the broken original dataset field so it isn't accidentally used
            if 'cumulative_displacement_mm' in df.columns:
                df.rename(columns={'cumulative_displacement_mm': 'original_broken_cumulative_displacement_mm'}, inplace=True)
                
            df['calculated_displacement_change_mm'] = grouped['displacement_mm'].diff()
            df['calculated_displacement_rate_mm_per_time'] = df['calculated_displacement_change_mm'] / time_delta_hr
            
            # 1. Baseline-relative displacement
            first_disp = grouped['displacement_mm'].transform('first')
            df['calculated_displacement_from_baseline_mm'] = df['displacement_mm'] - first_disp
            
            # 2. Cumulative absolute displacement change (movement activity path)
            df['calculated_cumulative_absolute_displacement_change_mm'] = df['calculated_displacement_change_mm'].abs().groupby(df['node_id']).cumsum().fillna(0.0)

            df['calculated_displacement_change_mm'] = df['calculated_displacement_change_mm'].fillna(0.0)
            df['calculated_displacement_rate_mm_per_time'] = df['calculated_displacement_rate_mm_per_time'].fillna(0.0)

        # 4. GNSS Displacement Features
        if tier == 'GNSS Reference':
            if 'vertical_displacement_mm' in df.columns:
                df['calculated_vertical_displacement_change_mm'] = grouped['vertical_displacement_mm'].diff()
                df['calculated_vertical_displacement_rate_mm_per_time'] = df['calculated_vertical_displacement_change_mm'] / time_delta_hr
                df['calculated_vertical_displacement_rate_mm_per_time'] = df['calculated_vertical_displacement_rate_mm_per_time'].fillna(0.0)
            
            if 'horizontal_displacement_mm' in df.columns:
                df['calculated_horizontal_displacement_change_mm'] = grouped['horizontal_displacement_mm'].diff()
                df['calculated_horizontal_displacement_rate_mm_per_time'] = df['calculated_horizontal_displacement_change_mm'] / time_delta_hr
                df['calculated_horizontal_displacement_rate_mm_per_time'] = df['calculated_horizontal_displacement_rate_mm_per_time'].fillna(0.0)

        # 5. Crack Features (Full, Crack)
        if 'crack_opening_mm' in df.columns:
            # Rename the broken original fields that logged 0.0 erroneously
            if 'crack_opening_change_mm' in df.columns:
                df.rename(columns={'crack_opening_change_mm': 'original_broken_crack_opening_change_mm'}, inplace=True)
            if 'crack_growth_rate_mm_per_time' in df.columns:
                df.rename(columns={'crack_growth_rate_mm_per_time': 'original_broken_crack_growth_rate_mm_per_time'}, inplace=True)

            df['calculated_crack_opening_change_mm'] = grouped['crack_opening_mm'].diff()
            df['calculated_crack_growth_rate_mm_per_time'] = df['calculated_crack_opening_change_mm'] / time_delta_hr
            
            df['calculated_crack_opening_change_mm'] = df['calculated_crack_opening_change_mm'].fillna(0.0)
            df['calculated_crack_growth_rate_mm_per_time'] = df['calculated_crack_growth_rate_mm_per_time'].fillna(0.0)

        engineered_datasets[tier] = df

    return engineered_datasets


def main():
    import os
    import sys
    
    # Import Stage 1
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from stage1_ingestion import ingest_sensor_data, DataIngestionError
    
    base_path = "/home/deepak/Project/SIH/ML_Part/dataset"
    files_to_load = [
        os.path.join(base_path, "full_nodes_all_4_sensors_500_total.csv"),
        os.path.join(base_path, "gnss_reference_tilt_500_total.csv"),
        os.path.join(base_path, "lite_nodes_tilt_vibration_500_total.csv"),
        os.path.join(base_path, "tilt_sensor_500_readings.csv")
    ]
    
    print("--- Running Stage 1 Ingestion ---")
    try:
        stage1_datasets = ingest_sensor_data(files_to_load)
    except DataIngestionError as e:
        print(f"Failed Stage 1: {e}")
        return

    print("--- Running Stage 2 Feature Engineering ---")
    stage2_datasets = engineer_features(stage1_datasets)
    
    print("Feature Engineering Successful!\n")
    
    # Verify the calculations against the original dataset for the 'Lite' tier as a quick check
    lite_df = stage2_datasets['Lite']
    print("Verification of calculated rates on Lite Node (First 3 rows of a node):")
    cols_to_compare = [
        'timestamp', 'node_id', 
        'tilt_change_deg', 'calculated_tilt_change_deg', 
        'tilt_rate_deg_per_time', 'calculated_tilt_rate_deg_per_time'
    ]
    print(lite_df[cols_to_compare].head(3).to_string(index=False))

if __name__ == "__main__":
    main()
