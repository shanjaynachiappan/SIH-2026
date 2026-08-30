import os
import pandas as pd
from typing import Dict, List

class DataIngestionError(Exception):
    """Custom exception for errors encountered during data ingestion."""
    pass

def ingest_sensor_data(file_paths: List[str]) -> Dict[str, pd.DataFrame]:
    """
    Loads tier-specific CSV datasets, validates structure, and returns a dictionary
    mapping the node_tier to its corresponding DataFrame.
    
    Args:
        file_paths: List of string paths to the CSV datasets.
        
    Returns:
        A dictionary mapping node_tier (e.g., 'Full', 'Lite') to its sorted DataFrame.
        
    Raises:
        DataIngestionError: If a file is missing, cannot be read, or is structurally invalid.
    """
    REQUIRED_COLUMNS = ['timestamp', 'node_id', 'node_tier']
    ingested_data = {}

    for path in file_paths:
        if not os.path.exists(path):
            raise DataIngestionError(f"Dataset file missing: {path}")

        try:
            # Read the dataset
            df = pd.read_csv(path)
        except pd.errors.EmptyDataError:
            raise DataIngestionError(f"Dataset file is empty: {path}")
        except Exception as e:
            raise DataIngestionError(f"Failed to read CSV dataset {path}: {str(e)}")

        # Validate required metadata columns
        missing_cols = [col for col in REQUIRED_COLUMNS if col not in df.columns]
        if missing_cols:
            raise DataIngestionError(
                f"Missing required metadata columns {missing_cols} in dataset: {path}"
            )

        if df.empty:
            # Handle the case where the dataframe has columns but no data rows
            continue

        # 1. Check for missing node_id or timestamp
        missing_metadata = df[['node_id', 'timestamp']].isnull().any(axis=1)
        if missing_metadata.any():
            print(f"[WARNING] {path}: Found {missing_metadata.sum()} rows with missing node_id or timestamp. Dropping them.")
            df = df[~missing_metadata].copy()

        # 2. Parse timestamps (coerce errors to NaT for detection)
        df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')

        # 3. Check for invalid timestamps (NaT)
        invalid_timestamps = df['timestamp'].isna()
        if invalid_timestamps.any():
            print(f"[WARNING] {path}: Found {invalid_timestamps.sum()} rows with unparseable/invalid timestamps. Dropping them.")
            df = df[~invalid_timestamps].copy()

        # 4. Sort values chronologically by node_id (maintains independent node histories)
        df.sort_values(by=['node_id', 'timestamp'], inplace=True, ignore_index=True)

        # 5. Check for duplicate node_id + timestamp combinations
        duplicates = df.duplicated(subset=['node_id', 'timestamp'], keep='first')
        if duplicates.any():
            print(f"[WARNING] {path}: Found {duplicates.sum()} duplicate records for the same node_id and timestamp.")
            print(f"          Handling strategy: Keeping the first occurrence and dropping duplicates.")
            df = df[~duplicates].copy()
            df.reset_index(drop=True, inplace=True)

        # Identify the node tier from the dataset contents
        # Assuming each dataset represents one tier. 
        # If a dataset somehow contains multiple, we group by node_tier.
        unique_tiers = df['node_tier'].unique()
        
        for tier in unique_tiers:
            # Filter the dataframe for this specific tier, just in case a file has multiple
            tier_df = df[df['node_tier'] == tier].copy()
            
            # If the tier already exists in our dictionary from another file, we can optionally merge or raise an error.
            # To adhere to "do not merge unnecessarily", we will just store it. If a tier appears in multiple files, 
            # we'll append it to keep all records for that tier together.
            if tier in ingested_data:
                ingested_data[tier] = pd.concat([ingested_data[tier], tier_df], ignore_index=True)
                ingested_data[tier].sort_values(by=['node_id', 'timestamp'], inplace=True, ignore_index=True)
            else:
                ingested_data[tier] = tier_df

    return ingested_data

def main():
    """Simple verification script to test the ingestion module."""
    base_path = "/home/deepak/Project/SIH/ML_Part/dataset"
    
    # We explicitly define the files we discovered during inspection
    files_to_load = [
        os.path.join(base_path, "full_nodes_all_4_sensors_500_total.csv"),
        os.path.join(base_path, "gnss_reference_tilt_500_total.csv"),
        os.path.join(base_path, "lite_nodes_tilt_vibration_500_total.csv"),
        os.path.join(base_path, "tilt_sensor_500_readings.csv") # This one actually contains 'Crack' tier
    ]
    
    print("Starting Stage 1 Data Ingestion...")
    try:
        datasets = ingest_sensor_data(files_to_load)
        print("Data Ingestion Successful!\n")
        
        for tier, df in datasets.items():
            print(f"Tier: {tier}")
            print(f"  Total Records: {len(df)}")
            print(f"  Columns ({len(df.columns)}): {list(df.columns)}")
            print("-" * 50)
            
    except DataIngestionError as e:
        print(f"Ingestion Failed: {e}")

if __name__ == "__main__":
    main()
