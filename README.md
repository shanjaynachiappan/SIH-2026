# MineGuard.ai — Real-Time Strata Surveillance & Collapse Warning System

MineGuard.ai is a state-of-the-art, multi-layered Artificial Intelligence and Geographic Information System (GIS) solution designed for underground mines. The system monitors strata movement, convergence, vibration, and crack extension to predict potential roof collapses and land subsidence hours before they occur.

---

## 🏗️ Architecture Overview

The system is structured as an end-to-end data pipeline from raw physical sensors to the centralized dashboard:

```
[Physical Sensors / IoT Nodes]
           │
           ▼  (POST /api/telemetry JSON payload)
┌──────────────────────────────────────────────┐
│                  server.py                   │  <─── (Flask API & Cache Manager)
└──────┬───────────────────────────────────────┘
       │
       ▼  (In-Memory Queue)
┌──────────────────────────────────────────────┐
│              live_inference.py               │  <─── (Live AI Scoring Pipeline)
└──────┬───────────────────────────────────────┘
       │
       ▼
 ┌───────────── Ingestion (Stage 1)
 ┌───────────── Feature Engineering (Stage 2)
 ├───────────── Random Forest Vibration Classifier (Stage 3a)
 ├───────────── Isolation Forest Anomaly Detection (Stage 3b)
 ├───────────── Displacement Progression Rate Analysis (Stage 4)
 ├───────────── LSTM 3-Step Displacment Forecasting (Stage 5)
 ├───────────── Multi-Sensor Spatial Risk Fusion (Stage 6)
 └───────────── Unified Dashboard Payloads (Stage 7)
       │
       ▼
┌──────────────────────────────────────────────┐
│             In-Memory Store                  │
└──────┬───────────────────────────────────────┘
       │
       ├───────────────────────────────────────┐
       ▼ (GET /api/ml/nodes)                  ▼ (GET /api/ml/alerts)
┌──────────────────────────────┐       ┌──────────────────────────────┐
│      Local Dashboard         │       │      Central Dashboard       │
│  (Frontend/ - Local Gateway) │       │ (frontend-2/ - Mine Command) │
└──────────────────────────────┘       └──────────────────────────────┘
```

---

## 🧠 The 7-Stage ML Pipeline

The pipeline is split into modular execution stages to isolate tasks, optimize computing, and allow clean scaling:

1. **`stage1_ingestion.py`**
   Ingests raw JSON/CSV sensor inputs (representing accelerometers, tilt sensors, crack gauges, and GNSS receivers) into normalized Pandas DataFrames.
2. **`stage2_feature_engineering.py`**
   Calculates time-series derivatives such as velocity, displacement rates, 3D tilt magnitudes, cumulative displacement, and changes from baselines.
3. **`stage3a_vibration.py`**
   Uses a pre-trained **Random Forest Classifier** to analyze high-frequency vibration signals (RMS, peak acceleration, dominant frequency) to isolate blasting events from structurally hazardous vibrations.
4. **`stage3b_anomaly.py`**
   Utilizes an **Isolation Forest** unsupervised algorithm to tag spatial anomalies and abnormal sensor deviations.
5. **`stage4_progression.py`**
   Maps regression lines across historical windows to identify whether roof convergence rate is accelerating (representing an impending roof fall).
6. **`stage5_forecasting.py`**
   Runs a deep learning **LSTM (Long Short-Term Memory)** model to project displacement coordinates 3 steps (hours) into the future.
7. **`stage6_zone_fusion.py`**
   Blends features from all sensors in a physical panel to calculate a unified **`composite_risk_score`** (between 0.0 and 1.0) and triggers warning thresholds.
8. **`stage7_output_generation.py`**
   Formats the final dataframes into standard JSON payloads optimized for Leaflet GIS rendering.

---

## ⚡ Server & API Integration (`server.py`)

`server.py` hosts a lightweight, multi-threaded Flask server handling integration between frontends and the ML backend:

### Key Endpoints

* **`POST /api/telemetry`**
  Receives live sensor telemetry payloads from IoT nodes, parses them, runs the full `live_inference.py` pipeline, updates the cache, and returns the real-time classification.
* **`GET /api/ml/nodes`**
  Returns a list of all active sensor nodes, their current coordinates, and their immediate risk levels (`NORMAL`, `WARNING`, `CRITICAL`).
* **`GET /api/ml/nodes/<node_id>`**
  Returns high-fidelity details of a single node, including its predicted displacement forecasting curve, battery levels, raw telemetry details, and class probabilities.
* **`GET /api/ml/alerts`**
  Returns a chronological list of warning or critical anomalies that have occurred in the mine.
* **`GET /api/ml/risk-zones`**
  Returns spatial polygon geometries representing stress warning areas across mine panels.

---

## 📊 Dashboards & GIS Integration

The project includes two modern, responsive React + TypeScript + Vite dashboards:

### 1. Local Gateway Dashboard (`Frontend/`)
* **Purpose:** Running locally at a gateway station inside a specific mine tunnel.
* **Features:** Low-latency sensor mesh rendering, live telemetry trackers, and immediate warning buzzers.

### 2. Central Command Dashboard (`frontend-2/`)
* **Purpose:** Running in a remote headquarters, managing multiple mines and hundreds of gateway grids.
* **Features:** Comprehensive statistics across multiple mines, multi-tier node status listings, and cross-mine warning systems.

### 🗺️ GIS Mapping & IDW Heatmap
* Both dashboards utilize **Leaflet** for interactive mapping.
* They implement an **IDW (Inverse Distance Weighting)** spatial interpolation algorithm (`deformationService.ts`). 
* The IDW engine takes the real-time displacement values (in mm) from the active sensors and dynamically overlays a red/orange **Deformation Heatmap** indicating exactly where the ceiling is sagging the most, allowing commanders to deploy safety supports before structural failure.

---

## 🚀 Setup & Execution Guide

### Prerequisites
* **Python 3.8+**
* **Node.js v18+ & npm**

### 1. Running the ML Backend
First, set up your Python virtual environment and run the Flask server:

```bash
# Go to workspace directory
cd ML_Part

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Start the server (will bind to port 5000)
python3 server.py
```

### 2. Launching the Dashboards
Open separate terminals for the dashboards:

#### Local Dashboard:
```bash
cd ML_Part/Frontend
npm install
npm run dev
```

#### Central Dashboard:
```bash
cd ML_Part/frontend-2
npm install
npm run dev
```

---

## 🧪 Testing Telemetry Integration (Live curl payloads)

Use the following cURL payloads to inject live data and verify the dashboards update:

#### A. Stable Node (NORMAL state - Green marker, no alert)
```bash
curl -X POST http://localhost:5000/api/telemetry \
-H "Content-Type: application/json" \
-d '\''{
  "node_id": "N_FULL_110",
  "timestamp": "2026-08-30T13:00:00Z",
  "latitude": 23.765,
  "longitude": 86.425,
  "battery_level": 99,
  "tilt_x_deg": 0.0,
  "tilt_y_deg": 0.0,
  "tilt_magnitude_deg": 0.0,
  "acceleration_mps2": 0.01,
  "peak_acceleration_mps2": 0.02,
  "rms_acceleration_mps2": 0.01,
  "dominant_frequency_hz": 1.0,
  "vibration_duration_s": 0.0,
  "displacement_mm": 0.0,
  "cumulative_displacement_mm": 0.0,
  "crack_detected": 0,
  "crack_opening_mm": 0.0,
  "elevation_m": 250.0
}'\''
```

#### B. Heavy Vibration Node (WARNING state - Orange marker, warning alert)
```bash
curl -X POST http://localhost:5000/api/telemetry \
-H "Content-Type: application/json" \
-d '\''{
  "node_id": "N_FULL_111",
  "timestamp": "2026-08-30T13:05:00Z",
  "latitude": 23.750,
  "longitude": 86.435,
  "battery_level": 85,
  "tilt_x_deg": 0.5,
  "tilt_y_deg": 0.3,
  "tilt_magnitude_deg": 0.58,
  "acceleration_mps2": 8.5,
  "peak_acceleration_mps2": 15.2,
  "rms_acceleration_mps2": 6.1,
  "dominant_frequency_hz": 85.0,
  "vibration_duration_s": 3.2,
  "displacement_mm": 2.5,
  "cumulative_displacement_mm": 2.5,
  "crack_detected": 0,
  "crack_opening_mm": 0.0,
  "elevation_m": 248.0
}'\''
```

#### C. Roof Failure Node (CRITICAL state - Red marker, red alert, red deformation heatmap)
```bash
curl -X POST http://localhost:5000/api/telemetry \
-H "Content-Type: application/json" \
-d '\''{
  "node_id": "N_FULL_114",
  "timestamp": "2026-08-30T13:20:00Z",
  "latitude": 23.758,
  "longitude": 86.400,
  "battery_level": 12,
  "tilt_x_deg": 22.5,
  "tilt_y_deg": -18.2,
  "tilt_magnitude_deg": 28.9,
  "acceleration_mps2": 28.5,
  "peak_acceleration_mps2": 45.0,
  "rms_acceleration_mps2": 22.5,
  "dominant_frequency_hz": 110.0,
  "vibration_duration_s": 15.5,
  "displacement_mm": 210.0,
  "cumulative_displacement_mm": 210.0,
  "crack_detected": 1,
  "crack_opening_mm": 25.5,
  "elevation_m": 242.0
}'\''
```
