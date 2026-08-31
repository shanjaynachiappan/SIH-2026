import os
import pandas as pd

from stage1_ingestion import ingest_sensor_data
from stage2_feature_engineering import engineer_features
from stage3_coordinator import run_stage3
from stage4_coordinator import run_stage4
from stage5_forecasting import forecast_subsidence
from stage6_zone_fusion import (
    prepare_node_zones,
    calculate_node_current_risk,
    calculate_node_future_risk,
    calculate_zone_risk
)

from stage7_output_generation import generate_stage7_outputs, export_stage7_files

def run_full_pipeline():
    print("🚀 Starting MineGuard ML Pipeline...")

    # 1. Ingestion
    print("\n[1/7] Ingesting Sensor Data...")
    base_path = 'dataset'
    files = [
        os.path.join(base_path, 'full_nodes_all_4_sensors_500_total.csv'),
        os.path.join(base_path, 'gnss_reference_tilt_500_total.csv'),
        os.path.join(base_path, 'lite_nodes_tilt_vibration_500_total.csv'),
        os.path.join(base_path, 'tilt_sensor_500_readings.csv') # Crack
    ]
    ds1 = ingest_sensor_data(files)

    # 2. Feature Engineering
    print("[2/7] Engineering Physical Features...")
    ds2 = engineer_features(ds1)

    # 3. Hazard & Anomaly Classification
    print("[3/7] Running Stage 3 (Vibration Hazard & Isolation Forest)...")
    ds3 = run_stage3(ds2)

    # 4. Severity & Progression
    print("[4/7] Running Stage 4 (Linear Regression & Severity)...")
    ds4 = run_stage4(ds3)

    # 5. LSTM Forecasting
    print("[5/7] Running Stage 5 (LSTM Subsidence Forecasting)...")
    ds5 = {}
    for tier, df in ds4.items():
        ds5[tier] = forecast_subsidence(df, tier)

    # 6. Zone Risk Fusion
    print("[6/7] Running Stage 6 (Zone Risk Fusion)...")
    ds6_zones = prepare_node_zones(ds5)
    ds6_current = calculate_node_current_risk(ds6_zones)
    ds6_future = calculate_node_future_risk(ds6_current)
    final_zone_output = calculate_zone_risk(ds6_future)
    
    # 7. Final Node-Level Output Generation
    print("[7/7] Running Stage 7 (Final Node-Level Output Generation)...")
    dash_df, gis_df = generate_stage7_outputs(ds6_future, final_zone_output)
    export_stage7_files(dash_df, gis_df)

    print("\n✅ Pipeline Execution Complete!")
    print("\n--- FINAL NODE-LEVEL OUTPUT PREVIEW (DASHBOARD) ---")
    print(dash_df.head(10))
    
    # Save output to CSV
    output_file = "final_zone_risk_output.csv"
    final_zone_output.to_csv(output_file, index=False)
    print(f"\n📁 Saved zone-level output to: {output_file}")
    print(f"📁 Saved node-level dashboard output to: mineguard_dashboard_output.csv")
    print(f"📁 Saved node-level GIS output to: mineguard_gis_node_output.csv")
    print(f"📁 Saved node-level JSON output to: mineguard_node_output.json")

if __name__ == "__main__":
    run_full_pipeline()
