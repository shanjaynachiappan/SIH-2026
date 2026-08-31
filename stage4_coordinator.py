import pandas as pd
from typing import Dict
import os
import sys

# Ensure modules in current directory can be imported
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from stage4_progression import estimate_progression

def process_tier_stage4(df: pd.DataFrame, tier: str) -> pd.DataFrame:
    """
    Process a single tier through Stage 4: Severity and Progression Estimation.
    """
    if df.empty:
        return df
        
    # Run the core regression and severity logic
    # The estimate_progression module natively handles skipping the Crack tier.
    result_df = estimate_progression(df, tier)
    
    return result_df

def run_stage4(datasets: Dict[str, pd.DataFrame]) -> Dict[str, pd.DataFrame]:
    """
    Coordinator for Stage 4.
    Iterates safely over all heterogeneous datasets.
    """
    processed_datasets = {}
    
    for tier, df in datasets.items():
        if df.empty:
            processed_datasets[tier] = df
            continue
            
        print(f"[Stage 4] Processing {tier} nodes...")
        processed_datasets[tier] = process_tier_stage4(df, tier)
        
    return processed_datasets

if __name__ == "__main__":
    # Integration test block
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

    print("--- Running Stage 1 Ingestion ---")
    ds1 = ingest_sensor_data(files)
    
    print("--- Running Stage 2 Feature Engineering ---")
    ds2 = engineer_features(ds1)
    
    print("--- Running Stage 3 Models ---")
    ds3 = run_stage3(ds2)
    
    print("--- Running Stage 4 Progression & Severity ---")
    ds4 = run_stage4(ds3)
    
    print("\n--- Integration Validation ---")
    for tier, df in ds4.items():
        print(f"==== TIER: {tier} ====")
        print(f"Row count: {len(df)}")
        print(f"Timestamp preserved: {'timestamp' in df.columns}")
        print(f"Node ID preserved: {'node_id' in df.columns}")
        print(f"Chronological sort valid: {df['timestamp'].is_monotonic_increasing or df.groupby('node_id')['timestamp'].is_monotonic_increasing.all()}")
        
        # Verify specific columns
        if tier == 'Crack':
            prog_cols = [c for c in df.columns if 'progression' in c or 'severity' in c]
            print(f"Crack nodes remained untouched (0 progression columns): {len(prog_cols) == 0}")
        else:
            print(f"Severity Label assigned: {'severity_label' in df.columns}")
            print(f"Severity Rank assigned: {'severity_rank' in df.columns}")
            if tier == 'Full':
                print(f"Target: {'displacement_progression_rate' in df.columns}")
            elif tier == 'Lite':
                print(f"Target: {'tilt_progression_rate' in df.columns}")
            elif tier == 'GNSS Reference':
                print(f"Target: {'vertical_progression_rate' in df.columns}")
                
        # Stage 3 validations
        if tier in ['Full', 'Lite']:
            print(f"Stage 3a (vibration) intact: {'vibration_hazard_score' in df.columns}")
        if tier != 'Crack':
            # Crack anomaly flag is different from fusion/position, but we just check presence
            anomaly_flag = [c for c in df.columns if 'anomaly_flag' in c]
            print(f"Stage 3b (anomaly) intact: {len(anomaly_flag) > 0}")
        print("-" * 40)
