import os
import sys
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.preprocessing import MinMaxScaler
import joblib

sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from stage1_ingestion import ingest_sensor_data
from stage2_feature_engineering import engineer_features
from stage3_coordinator import run_stage3
from stage4_coordinator import run_stage4

# Hyperparameters
LOOKBACK = 12
FORECAST = 3
HIDDEN_SIZE = 32
EPOCHS = 100
BATCH_SIZE = 16
LEARNING_RATE = 0.005

class SubsidenceLSTM(nn.Module):
    def __init__(self, input_size=1, hidden_size=32, num_layers=1, output_size=3):
        super(SubsidenceLSTM, self).__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        # x shape: (batch_size, seq_len, input_size)
        out, _ = self.lstm(x)
        # We only want the last time step output
        out = out[:, -1, :] 
        out = self.fc(out)
        return out

def create_sequences(data, lookback, forecast):
    X, y = [], []
    for i in range(len(data) - lookback - forecast + 1):
        X.append(data[i:(i + lookback)])
        y.append(data[(i + lookback):(i + lookback + forecast)])
    return np.array(X), np.array(y)

def main():
    print("--- Loading Pipeline Data ---")
    base_path = 'dataset'
    files = [
        os.path.join(base_path, 'full_nodes_all_4_sensors_500_total.csv'),
        os.path.join(base_path, 'gnss_reference_tilt_500_total.csv'),
        os.path.join(base_path, 'lite_nodes_tilt_vibration_500_total.csv'),
        os.path.join(base_path, 'tilt_sensor_500_readings.csv')
    ]
    ds1 = ingest_sensor_data(files)
    ds2 = engineer_features(ds1)
    ds3 = run_stage3(ds2)
    ds4 = run_stage4(ds3)

    df_full = ds4['Full'].copy()
    
    target_col = 'calculated_displacement_from_baseline_mm'
    
    # We will accumulate train and test series per node
    train_series = []
    test_series = []
    
    for node_id, group in df_full.groupby('node_id'):
        group = group.sort_values('timestamp').dropna(subset=[target_col])
        values = group[target_col].values.reshape(-1, 1)
        
        n_total = len(values)
        if n_total < (LOOKBACK + FORECAST):
            continue
            
        split_idx = int(n_total * 0.8)
        
        train_series.append(values[:split_idx])
        test_series.append(values[split_idx:])

    # Fit scaler ONLY on training data
    scaler = MinMaxScaler(feature_range=(-1, 1))
    all_train_data = np.vstack(train_series)
    scaler.fit(all_train_data)
    
    X_train_list, y_train_list = [], []
    X_test_list, y_test_list = [], []
    
    # Generate sequences per node
    for t_series, test_s in zip(train_series, test_series):
        # Scale
        t_scaled = scaler.transform(t_series)
        test_scaled = scaler.transform(test_s)
        
        # We need sufficient length to create sequences
        if len(t_scaled) >= LOOKBACK + FORECAST:
            X, y = create_sequences(t_scaled, LOOKBACK, FORECAST)
            X_train_list.append(X)
            y_train_list.append(y)
            
        if len(test_scaled) >= LOOKBACK + FORECAST:
            X, y = create_sequences(test_scaled, LOOKBACK, FORECAST)
            X_test_list.append(X)
            y_test_list.append(y)

    X_train = np.vstack(X_train_list)
    y_train = np.vstack(y_train_list)
    y_train = y_train.squeeze(-1) # shape (batch, 3)

    X_test = np.vstack(X_test_list) if X_test_list else np.array([])
    if X_test.size > 0:
        y_test = np.vstack(y_test_list)
        y_test = y_test.squeeze(-1)
    else:
        y_test = np.array([])

    print(f"Total Train Sequences: {len(X_train)}")
    print(f"Total Test Sequences: {len(X_test)}")
    
    # PyTorch Setup
    torch.manual_seed(42)
    model = SubsidenceLSTM(input_size=1, hidden_size=HIDDEN_SIZE, num_layers=1, output_size=FORECAST)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    
    X_train_t = torch.tensor(X_train, dtype=torch.float32)
    y_train_t = torch.tensor(y_train, dtype=torch.float32)
    
    print("--- Training LSTM ---")
    for epoch in range(EPOCHS):
        model.train()
        optimizer.zero_grad()
        out = model(X_train_t)
        loss = criterion(out, y_train_t)
        loss.backward()
        optimizer.step()
        
        if (epoch + 1) % 20 == 0:
            print(f"Epoch [{epoch+1}/{EPOCHS}], Loss: {loss.item():.6f}")

    # Evaluate
    if X_test.size > 0:
        print("--- Evaluating Model ---")
        model.eval()
        with torch.no_grad():
            X_test_t = torch.tensor(X_test, dtype=torch.float32)
            y_pred_t = model(X_test_t)
            
            y_pred = y_pred_t.numpy()
            
            # Inverse transform (requires reshaping)
            y_pred_inv = scaler.inverse_transform(y_pred)
            y_test_inv = scaler.inverse_transform(y_test)
            
            mae = np.mean(np.abs(y_pred_inv - y_test_inv))
            rmse = np.sqrt(np.mean((y_pred_inv - y_test_inv)**2))
            
            print(f"Test MAE (mm): {mae:.4f}")
            print(f"Test RMSE (mm): {rmse:.4f}")

    # Save assets
    print("--- Saving Assets ---")
    torch.save(model.state_dict(), 'subsidence_lstm.pth')
    joblib.dump(scaler, 'subsidence_scaler.joblib')
    print("Saved 'subsidence_lstm.pth' and 'subsidence_scaler.joblib'")

if __name__ == '__main__':
    main()
