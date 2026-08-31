# MineGuard AI/ML System

## 1. Project Overview
**What the project does:** MineGuard is a comprehensive, real-time safety and structural integrity monitoring system for deep underground mines. It leverages heterogeneous sensor arrays, edge gateways, and advanced Machine Learning models to predict hazards before they occur.
**Overall objective:** To prevent catastrophic mine collapses, subsidence events, and fatal accidents by transforming raw sensor telemetry into actionable, predictive alerts for mine administrators.

---

## 2. Complete System Architecture
The MineGuard system is built on a robust, multi-tier architecture spanning from deep underground to central command centers:
- **ESP32 Sensor Nodes**: Deployed across mine walls and pillars, collecting raw physical data (tilt, vibration, displacement).
- **Mesh Network**: Underground nodes communicate with each other via a resilient mesh network, overcoming the lack of standard connectivity.
- **ESP32 Gateway**: Acts as the master node aggregating all mesh traffic.
- **Wi-Fi Communication**: The Gateway bridges the mesh network to the local intranet via Wi-Fi.
- **Raspberry Pi (Edge Server)**: Positioned safely at the surface/base station, receiving all gateway data.
- **Python Backend & ML Pipeline**: Running on the Raspberry Pi, it processes raw telemetry through 7 rigorous ML stages in milliseconds.
- **Local Dashboard**: A React application for the local mine operator, showing instantaneous real-time metrics for their specific mine.
- **Central Dashboard**: A React application for regional administrators, aggregating data across multiple mines and panels.

---

## 3. Complete End-to-End Data Flow
```text
Sensor (Physical Measurement) 
  → ESP32 Node 
    → Mesh Network 
      → ESP32 Gateway 
        → Wi-Fi (HTTP POST) 
          → Raspberry Pi (Port 5000) 
            → Backend API (/api/telemetry) 
              → 7-Stage ML Pipeline 
                → Risk Prediction & Models 
                  → Dashboards (REST/WebSocket GET)
```

---

## 4. Hardware-to-Backend Integration
The **ESP32 Gateway** acts as an HTTP Client. Once it aggregates data from the mesh nodes, it crafts a JSON payload and sends an **HTTP POST request** over Wi-Fi directly to the Raspberry Pi. 
- **Raspberry Pi IP Address**: The ESP32 Gateway must be hardcoded or dynamically configured with the exact IPv4 address of the Raspberry Pi on the local Wi-Fi network (e.g., `192.168.1.100`).
- **Backend Port**: `5000` (Default Flask port).

*(Note: `localhost` or `127.0.0.1` cannot be used on the ESP32 code because that refers to the ESP32 itself. It must be the Pi's actual network IP).*

---

## 5. Telemetry API Contract
**Endpoint:** `POST /api/telemetry`

**Required JSON Payload:**
```json
{
  "node_id": "N_FULL_01",
  "timestamp": "2026-08-31T12:00:00",
  "tilt_x_deg": 0.034,
  "tilt_y_deg": -0.018,
  "acceleration_mps2": 0.42,
  "peak_acceleration_mps2": 1.85,
  "rms_acceleration_mps2": 0.033,
  "dominant_frequency_hz": 18.05,
  "displacement_mm": -12.5,
  "crack_opening_mm": 0.8
}
```
*Note: The node type (Full, Lite, etc.) is automatically inferred by the backend based on the prefix of the `node_id`.*

---

## 6. Raspberry Pi Backend Setup
To deploy this system onto the Raspberry Pi edge server:

1. **Clone the repository:**
   `git clone <repo-url> && cd SIH-2026/ML_Part`
2. **Required Python version:** Python 3.9+
3. **Virtual environment:**
   `python3 -m venv venv && source venv/bin/activate`
4. **Installing dependencies:**
   `pip install -r requirements.txt`
5. **Model files required (must be present in the directory):**
   - `vibration_rf_model.joblib`
   - `subsidence_lstm.pth`
   - `subsidence_scaler.joblib`
6. **Starting the backend:**
   `python3 server.py` (Ensure it binds to `0.0.0.0`)

---

## 7. ML Pipeline Flow & 8. Machine Learning Models Used

The data processing logic is broken into a highly deterministic 7-stage sequence. This section details exactly what happens in each stage, which ML models are involved, and how the output of one stage feeds the next.

### Stage 1 — Data Ingestion (`stage1_ingestion.py`)
- **Process**: The system accepts the raw JSON payload. It first validates the existence of mandatory fields (`node_id`, `timestamp`). It dynamically assigns the Node Tier (e.g., `N_FULL_01` -> `Full`) based on the ID prefix. 
- **Models Used**: None. (Pure data validation).
- **Hand-off**: The cleaned, typed data is passed to Stage 2 as a structured Pandas DataFrame. Missing values are flagged.

### Stage 2 — Feature Engineering (`stage2_feature_engineering.py`)
- **Process**: Raw sensor readings (e.g., current tilt, current displacement) are insufficient for predictive AI. This stage pulls the previous reading from the in-memory buffer (`NODE_HISTORY`) and computes **velocities**. It calculates `time_delta` (hours since last reading) to generate `tilt_rate_deg_per_time`, `displacement_rate_mm_per_time`, and `crack_opening_rate`.
- **Models Used**: None. (Mathematical transformations).
- **Hand-off**: The mathematically enriched dataset, now containing both absolute values and rates of change, is passed to Stage 3.

### Stage 3 — Vibration & Anomaly Analysis (`stage3_coordinator.py`)
This stage forks the data into two parallel ML evaluations (3a and 3b), then merges the results.
- **Process 3a (Vibration Hazard)**: Analyzes the `rms_acceleration_mps2` and `dominant_frequency_hz` against structural hazard boundaries.
- **Model Used**: **Random Forest Classifier (`vibration_rf_model.joblib`)**. A scikit-learn model trained on structural failure datasets. It categorizes the vibration into a discrete `rf_risk` class (Normal, Warning, Critical) and outputs a `classification_confidence` score.
- **Process 3b (Anomaly Detection)**: Looks for multivariate outliers across tilt, displacement, and crack rates simultaneously (things that don't fit normal operational bounds).
- **Model Used**: **Isolation Forest (Unsupervised ML)**. It generates an `anomaly_score` (-1.0 to 1.0) and an `anomaly_flag` (1 for anomaly, 0 for normal).
- **Hand-off**: The dataset, now appended with Random Forest risk classes and Isolation Forest anomaly flags, is passed to Stage 4.

### Stage 4 — Progression & Severity Analysis (`stage4_progression.py`)
- **Process**: The system looks at the recent historical window (buffer) of the node to determine if the structural hazard is actively worsening over time. It performs a **Linear Regression** over the engineered velocity features.
- **Models Used**: Ordinary Least Squares (OLS) Regression.
- **Output Generated**: A strictly mathematical `severity_slope`. A negative slope on displacement implies active, accelerating subsidence. 
- **Hand-off**: The `severity_slope` acts as a crucial context multiplier for Stage 6, but first, the data is sent to Stage 5.

### Stage 5 — Forecasting (`stage5_forecasting.py`)
- **Process**: The system attempts to see into the future. It extracts a strictly ordered time-series sequence (the last 12 chronological readings) of the node.
- **Model Used**: **PyTorch LSTM Neural Network (`subsidence_lstm.pth`)**. This deep learning model is coupled with a **StandardScaler (`subsidence_scaler.joblib`)** to normalize the 12-step input. The LSTM utilizes its memory cells to predict non-linear patterns in structural deformation.
- **Output Generated**: The model outputs exactly 3 continuous values: `forecast_displacement_step_1_mm`, `step_2`, and `step_3`.
- **Hand-off**: The predicted future displacements are passed to Stage 6 for risk fusion.

### Stage 6 — Zone Risk Fusion (`stage6_zone_fusion.py`)
- **Process**: This is the culmination stage. It calculates two distinct scores:
  1. **Current Risk**: An average of the normalized instantaneous sensor values (tilt, vibration, crack) and the Stage 3 Random Forest risk class.
  2. **Future Risk**: A calculation heavily weighted by the Stage 5 LSTM forecast trajectory and the Stage 4 `severity_slope`.
- **Model Used**: Weighted Mathematical Fusion.
- **Output Generated**: The `composite_risk_score` (0.0 to 1.0). This is the definitive safety metric of the node.
- **Hand-off**: The unified risk score, along with all ML intermediate outputs, is sent to Stage 7.

### Stage 7 — Final Output Generation (`stage7_output_generation.py`)
- **Process**: Translates the dense, multi-layered Pandas ML arrays into clean, structured JSON schemas. It maps the numerical `severity_slope` into a UI-friendly `trend_direction` (INCREASING, DECREASING, STABLE).
- **Hand-off**: The final JSON object is returned to `server.py`, which immediately replies to the ESP32 Gateway (HTTP 201) and caches the object for Dashboard GET requests.

---

## 9. Node Types and Sensor Configuration
1. **Full Node (`N_FULL_*`)**
   - **Sensors:** Tilt, Vibration, Displacement, Crack.
   - **ML Processing:** Full suite (RF Vibration, IF Anomaly, LSTM Forecasting, Progression).
2. **Lite Node (`N_LITE_*`)**
   - **Sensors:** Tilt, Vibration.
   - **ML Processing:** RF Vibration, IF Anomaly, Progression (Forecast skipped).
3. **Crack Node (`N_CRACK_*`)**
   - **Sensors:** Crack Width.
   - **ML Processing:** Crack thresholding and progression rates.
4. **GNSS Reference Node (`N_GNSS_*`)**
   - **Sensors:** GPS Latitude, Longitude, Elevation.
   - **ML Processing:** Differential absolute positioning analysis.

---

## 10. Backend API Endpoints
- **Telemetry Ingestion:** `POST /api/telemetry` (Used by ESP32 Gateway)
- **Node List:** `GET /api/ml/nodes` (Returns all nodes with current risk statuses)
- **Node Details:** `GET /api/ml/nodes/{node_id}` (Returns full historical ML predictions & raw data for a specific node)
- **Alerts:** `GET /api/ml/alerts` (Returns active warnings/critical alerts based on composite risk)
- **Risk Zones:** `GET /api/ml/risk-zones` (Returns aggregated risk geometries for the GIS map)
- **Telemetry History:** `GET /api/telemetry/history` (Returns historical arrays for time-series charts)

---

## 11. ML Output Format
When the dashboards query the backend, the ML pipeline provides highly enriched fields:
- `hazard_class`: (0 = Normal, 1 = Warning, 2 = Critical) Discrete RF output.
- `composite_risk_score`: (0.0 to 1.0) The master safety score fusing current and future risks.
- `classification_confidence`: (0.0 to 1.0) Model certainty.
- `anomaly_score`: Isolation Forest outlier score.
- `trend_direction`: INCREASING, DECREASING, STABLE (derived from severity slope).
- `forecast_displacement_step_X_mm`: Expected displacement in the future (LSTM output).
- `latitude` / `longitude`: Spatial coordinates for the GIS map.

---

## 12. Risk Classification
The `composite_risk_score` dictates system behavior:
- **NORMAL (< 0.5)**: Safe conditions. Dashboard stays green.
- **WARNING (0.5 to 0.74)**: Emerging hazards detected. Dashboard turns orange. Operators notified.
- **CRITICAL (>= 0.75)**: Imminent collapse or severe structural failure predicted. Dashboard turns red, alarms triggered, GIS maps highlight zones in red.

---

## 13. Dashboard Integration
### Local Dashboard
- **Folder:** `Frontend/`
- **Backend connection:** `http://<pi-ip>:5000/api`
- **Replaced Mock Data:** Live Maps, active alerts, total nodes, dynamic risk score distributions, and time-series charts are directly wired to the ML API.

### Central Dashboard
- **Folder:** `frontend-2/`
- **Backend connection:** `http://<pi-ip>:5000/api`
- **Replaced Mock Data:** Same as local, but capable of aggregating multiple gateways.

---

## 14. Mock Data vs Real Data Integration
**Currently Replaced with REAL Backend/ML Data:**
- Node definitions, counts, and statuses.
- Live sensor values mapped to cards and charts.
- Overall Risk scores and Alert lists.
- Dynamic trend histories on the deformation chart.

**Still Mock/Static:**
- GIS mine boundaries and polygons (hardcoded coordinates).
- Authentication and Login flows.
- PDF Reports.
- Administrative Gateway settings.

---

## 15. How Hardware Data Reaches the Dashboard
1. **ESP32 Gateway** fires an `HTTP POST` request containing sensor JSON.
2. The **Raspberry Pi** receives it at `/api/telemetry`.
3. `server.py` immediately forwards the JSON to `live_inference.py`.
4. The **ML Pipeline** processes it, appending it to the historical buffer and calculating the latest `composite_risk_score`.
5. The Prediction is **Stored** in the Pi's memory.
6. The Dashboards periodically fire **GET APIs** (`/api/ml/nodes`).
7. The **Local + Central Dashboard** updates its UI to reflect the new state.

---

## 16. Running the Complete System
Open three separate terminals:

**Terminal 1 — Raspberry Pi Backend**
```bash
cd SIH-2026/ML_Part
source venv/bin/activate
python3 server.py
```

**Terminal 2 — Local Dashboard**
```bash
cd SIH-2026/ML_Part/Frontend
npm install
npm run dev
```

**Terminal 3 — Central Dashboard**
```bash
cd SIH-2026/ML_Part/frontend-2
npm install
npm run dev
```

---

## 17. Testing the Integration
1. **Test backend health:** Visit `http://localhost:5000/` in a browser.
2. **Send sample telemetry:** Use the `curl` command (from section 5).
3. **Check ML result:** The `curl` command will print the immediate ML response.
4. **Check node API:** Visit `http://localhost:5000/api/ml/nodes`.
5. **Verify dashboard update:** The Local Dashboard (Port 5173/5174) will automatically spike its charts and alert lists within 2 seconds.

---

## 18. Network Configuration
**(Crucial for Hardware Teams)**
- **Raspberry Pi IP address:** Must be static or known (e.g., `192.168.1.100`).
- **ESP3, Gateway endpoint:** `http://192.168.1.100:5000/api/telemetry`.
- **Laptop/dashboard connection:** Laptops must be on the same Wi-Fi network and access `http://192.168.1.100:5173`.
- **Why localhost cannot be used:** `localhost` on the ESP32 points to the ESP32 itself. It does not magically resolve to the Raspberry Pi. Hardcode the IPv4 address.

---

## 19. Project Folder Structure
```text
SIH-2026/ML_Part/
│
├── server.py                        # Main Flask API Server
├── live_inference.py                # Wrapper connecting Flask to ML Pipeline
│
├── stage1_ingestion.py              # ML Stage 1: Validation
├── stage2_feature_engineering.py    # ML Stage 2: Velocity maths
├── stage3_coordinator.py            # ML Stage 3: RF and IF models
├── stage4_coordinator.py            # ML Stage 4: Progression slopes
├── stage5_forecasting.py            # ML Stage 5: LSTM execution
├── stage6_zone_fusion.py            # ML Stage 6: Risk score calculation
├── stage7_output_generation.py      # ML Stage 7: JSON formatting
│
├── vibration_rf_model.joblib        # Pre-trained Random Forest model
├── subsidence_lstm.pth              # Pre-trained PyTorch LSTM model
├── subsidence_scaler.joblib         # LSTM Data Scaler
│
├── Frontend/                        # Local Mine Operator Dashboard (React/Vite)
│
├── frontend-2/                      # Central Admin Dashboard (React/Vite)
│
└── backend/                         # Original Mock/Simulator Code
    └── simulator.py                 
```

---

## 20. Current Integration Status
- ✅ **ML pipeline completed**: All 7 stages fully functional with live memory buffers.
- ✅ **Backend integration completed**: `server.py` is actively routing and serving APIs.
- ✅ **Local Dashboard connected**: Replacing mock data with live REST endpoints.
- ✅ **Central Dashboard connected**: Fetching data identically.
- ⏳ **ESP32 Gateway → Raspberry Pi live connection**: Pending hardware team flashing and field test.
- ⏳ **Deployment on Raspberry Pi**: Final deployment to Linux hardware pending.
- ⏳ **Remaining mock/static infrastructure**: Auth, PDFs, and static GIS maps to be migrated.

---

## 21. Troubleshooting
- **Port already in use**: If `5000` is taken, run `kill -9 $(lsof -t -i:5000)` or change the port in `server.py`.
- **Backend unreachable**: Ensure the Pi's firewall allows port `5000` (`sudo ufw allow 5000`).
- **Raspberry Pi IP changed**: Check `ifconfig` or `ip a` on the Pi and update the ESP32 C++ code.
- **ESP32 cannot reach Pi**: Ensure they are on the exact same Wi-Fi SSID and band (2.4GHz vs 5GHz matters for ESP32).
- **Python dependency issues**: Ensure you are in the `venv` and ran `pip install -r requirements.txt`.
- **ML model file not found**: Make sure you run `server.py` from inside the `ML_Part` directory so relative paths resolve correctly.
- **Dashboard showing fallback/mock data**: The backend is likely dead. Check the terminal running `server.py` for Python crashes.
