import os
import sys
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import joblib

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

# Define model identical to training script
class SubsidenceLSTM(nn.Module):
    def __init__(self, input_size=1, hidden_size=32, num_layers=1, output_size=3):
        super(SubsidenceLSTM, self).__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        out, _ = self.lstm(x)
        out = out[:, -1, :]
        out = self.fc(out)
        return out

def load_assets():
    model_path = os.path.join(os.path.dirname(__file__), 'subsidence_lstm.pth')
    scaler_path = os.path.join(os.path.dirname(__file__), 'subsidence_scaler.joblib')
    
    if not os.path.exists(model_path) or not os.path.exists(scaler_path):
        raise FileNotFoundError("Stage 5 assets not found. Train the model first.")
        
    scaler = joblib.load(scaler_path)
    
    # Load model architecture
    model = SubsidenceLSTM(input_size=1, hidden_size=32, num_layers=1, output_size=3)
    model.load_state_dict(torch.load(model_path))
    model.eval()
    
    return model, scaler

def forecast_subsidence(df: pd.DataFrame, tier: str) -> pd.DataFrame:
    """
    Stage 5 Inference:
    Generates rolling 3-step forecasts based on the previous 12 displacement readings.
    """
    if df.empty or tier != 'Full':
        return df
        
    df = df.copy()
    
    target_col = 'calculated_displacement_from_baseline_mm'
    
    # Initialize output columns safely
    df['forecast_displacement_step_1_mm'] = pd.NA
    df['forecast_displacement_step_2_mm'] = pd.NA
    df['forecast_displacement_step_3_mm'] = pd.NA
    
    if target_col not in df.columns:
        return df

    model, scaler = load_assets()
    lookback = 12

    # Process per node chronologically
    for node_id, group in df.groupby('node_id'):
        group = group.sort_values('timestamp')
        indices = group.index
        values = group[target_col].values
        
        # We need a rolling window to make predictions at each valid time step
        # A row 'i' can have a forecast if it has 12 valid readings up to and including 'i'
        for i in range(lookback - 1, len(values)):
            # The sequence is from i - 11 to i (inclusive, which is 12 elements)
            window = values[i - lookback + 1 : i + 1]
            
            if pd.isna(window).any():
                continue
                
            # Scale
            window_scaled = scaler.transform(window.reshape(-1, 1))
            
            # Prepare tensor (batch=1, seq=12, feat=1)
            X_t = torch.tensor(window_scaled, dtype=torch.float32).unsqueeze(0)
            
            # Predict
            with torch.no_grad():
                pred_scaled = model(X_t).numpy()
                
            # Inverse scale
            pred = scaler.inverse_transform(pred_scaled).flatten()
            
            # Map back to the exact row that represents the END of the 12-step input
            # So the forecast at row 'i' is the prediction for i+1, i+2, i+3
            current_idx = indices[i]
            df.loc[current_idx, 'forecast_displacement_step_1_mm'] = pred[0]
            df.loc[current_idx, 'forecast_displacement_step_2_mm'] = pred[1]
            df.loc[current_idx, 'forecast_displacement_step_3_mm'] = pred[2]

    return df
