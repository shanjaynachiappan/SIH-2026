import os
import sys
import pandas as pd
from typing import Dict
from concurrent.futures import ThreadPoolExecutor

sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from stage1_ingestion import ingest_sensor_data, DataIngestionError
from stage2_feature_engineering import engineer_features
from stage3a_vibration import classify_vibration_hazard
from stage3b_anomaly import detect_anomalies

def process_tier_stage3(df: pd.DataFrame, tier: str) -> pd.DataFrame:
    """
    Process a single tier through Stage 3.
    Executes Stage 3a and Stage 3b completely independently, 
    then merges their outputs.
    """
    if df.empty:
        return df

    # Step 10: Run Stage 3a and Stage 3b independently on the incoming dataframe
    # Stage 3a: Vibration Hazard (Only applies to Full, Lite)
    df_3a = classify_vibration_hazard(df, tier)
    
    # Stage 3b: Fusion/Sensor Anomaly
    df_3b = detect_anomalies(df, tier)
    
    # Extract only the newly added columns to avoid duplicating baseline columns during merge
    cols_3a = [c for c in df_3a.columns if c not in df.columns]
    cols_3b = [c for c in df_3b.columns if c not in df.columns]
    
    # Start with the original dataframe
    result_df = df.copy()
    
    # Merge outputs back
    if cols_3a:
        # Re-attach Stage 3a columns using the original index
        result_df = pd.concat([result_df, df_3a[cols_3a]], axis=1)
        
    if cols_3b:
        # Re-attach Stage 3b columns using the original index
        result_df = pd.concat([result_df, df_3b[cols_3b]], axis=1)
        
    return result_df

def run_stage3(datasets: Dict[str, pd.DataFrame]) -> Dict[str, pd.DataFrame]:
    """
    Orchestrates Stage 3 execution across all tiers in parallel.
    """
    final_datasets = {}
    
    with ThreadPoolExecutor() as executor:
        # Submit all tiers for processing
        future_to_tier = {executor.submit(process_tier_stage3, df, tier): tier for tier, df in datasets.items()}
        
        for future in future_to_tier:
            tier = future_to_tier[future]
            try:
                final_datasets[tier] = future.result()
            except Exception as exc:
                print(f"[ERROR] Tier {tier} generated an exception during Stage 3: {exc}")
                
    return final_datasets

def main():
    base_path = os.path.join(os.path.dirname(__file__), "dataset")
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
    
    print("--- Running Stage 3 Models ---")
    stage3_datasets = run_stage3(stage2_datasets)
    
    print("Stage 3 Execution Successful!\n")
    
    # Verify outputs
    for tier, df in stage3_datasets.items():
        print(f"==== Tier: {tier} ====")
        # Print the newly added Stage 3 columns
        cols = [c for c in df.columns if 'score' in c or 'flag' in c or 'label' in c]
        if cols:
            print(f"Added Columns: {cols}")
            print(f"Sample anomalies detected: {df[df[cols[-1]] == 1].shape[0]} rows (flagged as 1)")
        else:
            print("No Stage 3 columns added.")
        print("-" * 40)

if __name__ == "__main__":
    main()
