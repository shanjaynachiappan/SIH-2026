import os
import pandas as pd
import joblib

# Load the model at module level to avoid reloading it for every function call
# Assumes the joblib file is in the same directory as this script
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'vibration_rf_model.joblib')
try:
    RF_MODEL = joblib.load(MODEL_PATH)
except Exception as e:
    RF_MODEL = None
    print(f"[WARNING] Failed to load vibration model from {MODEL_PATH}: {e}")

def classify_vibration_hazard(df: pd.DataFrame, tier: str) -> pd.DataFrame:
    """
    Stage 3a: Vibration Hazard Classification.
    Applies ONLY to 'Full' and 'Lite' tiers.
    Predicts hazard probability and class using the trained Random Forest.
    """
    if df.empty:
        return df

    # We must explicitly return a copy so we don't accidentally modify Stage 2 upstream
    df = df.copy()

    # Step 9: Heterogeneous Tier Compatibility
    if tier not in ['Full', 'Lite']:
        # Do not run Stage 3a on Crack or GNSS. Do not create fake predictions.
        # Returning unmodified.
        return df

    features = [
        "rms_acceleration_mps2",
        "dominant_frequency_hz",
        "peak_acceleration_mps2"
    ]

    # Validate that required columns exist
    missing_cols = [f for f in features if f not in df.columns]
    if missing_cols:
        print(f"[ERROR] Tier {tier} is missing required Stage 3a columns: {missing_cols}")
        df['vibration_hazard_score'] = pd.NA
        df['vibration_hazard_label'] = pd.NA
        return df

    if RF_MODEL is None:
        print(f"[ERROR] Stage 3a RF Model is not loaded. Cannot run inference on tier {tier}.")
        df['vibration_hazard_score'] = pd.NA
        df['vibration_hazard_label'] = pd.NA
        return df

    # Ensure valid inputs (drop NaNs from prediction explicitly)
    valid_mask = df[features].notna().all(axis=1)

    # Initialize columns with pd.NA
    df['vibration_hazard_score'] = pd.NA
    df['vibration_hazard_label'] = pd.NA

    if valid_mask.any():
        X = df.loc[valid_mask, features]
        
        # Step 8: Inference
        # predict_proba returns [prob_0, prob_1]. We want prob_1 (hazard).
        hazard_probs = RF_MODEL.predict_proba(X)[:, 1]
        hazard_labels = RF_MODEL.predict(X)
        
        df.loc[valid_mask, 'vibration_hazard_score'] = hazard_probs
        df.loc[valid_mask, 'vibration_hazard_label'] = hazard_labels

    return df
