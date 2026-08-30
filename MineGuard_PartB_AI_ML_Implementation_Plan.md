# MineGuard – Part B AI/ML Pipeline
## End-to-End Implementation Plan

> **Scope:** This document covers the AI/ML work from **Stage 1 to Stage 7**.  
> **Stage 8 (GIS integration) is handled by the GIS member.**

---

# 1. Overall Flow

```text
Sensor / Simulator Data
        ↓
Stage 1 — Data Ingestion
        ↓
Stage 2 — Feature Engineering
        ↓
 ┌────────────┬────────────┬────────────┬────────────┐
 ↓            ↓            ↓            ↓
Stage 3      Stage 4      Stage 5      Stage 6
Isolation    Linear       LSTM         RF / XGBoost
Forest       Regression
 ↓            ↓            ↓            ↓
Anomaly      Severity     Forecast     Vibration Hazard
 └────────────┴────────────┘
              ↓
       Stage 7 — Risk Fusion
              ↓
        zone_risk_score
              ↓
       Handover to GIS
```

## Core Principle

Node tiers do **not** create separate complete AI pipelines.

```text
Node Tier
    ↓
Available Sensors
    ↓
Available Measurements
    ↓
Applicable Features / Analysis
```

---

# 2. Stage 1 — Data Ingestion

## Objective
Receive and organize chronological sensor measurements.

## Inputs

```text
timestamp
node_id
node_tier

tilt_x
tilt_y
tilt_magnitude
displacement

crack_detected
crack_opening

acceleration
peak_acceleration
rms_acceleration
dominant_frequency
vibration_duration
```

The exact available fields depend on the node's sensors.

## Process

```text
Sensor / Simulator Reading
        ↓
Validate node_id and timestamp
        ↓
Organize records chronologically
        ↓
Group readings by node_id
```

## Technology

- Python
- FastAPI
- Pandas

## Output

Clean chronological sensor records.

```text
node_id + timestamp + sensor measurements
```

## Next

```text
Stage 1 → Stage 2
```

---

# 3. Stage 2 — Feature Engineering

## Objective
Convert raw measurements into useful ML features.

## Inputs

Raw chronological measurements from Stage 1.

## Main Features

```text
tilt_rate
displacement_rate
crack_growth_rate
```

## Process

```text
Historical Node Readings
        ↓
Sort by timestamp
        ↓
Compare consecutive readings
        ↓
Calculate changes
        ↓
Calculate rate-of-change features
```

## Technology

- Python
- Pandas
- NumPy

## Output

Feature-enriched records.

## Next Routing

```text
Rate-of-change features → Stage 3
Deformation history     → Stage 4
Displacement history    → Stage 5
Vibration features      → Stage 6
```

---

# 4. Stage 3 — Abnormal Deformation Detection

## Model

### Isolation Forest

**Framework:** scikit-learn

## Objective

Detect unusual deformation behaviour.

## Inputs

```text
tilt_rate
displacement_rate
crack_growth_rate
```

Feature availability can differ according to node configuration.

## Process

```text
Rate-of-change Features
        ↓
Feature Preparation
        ↓
Isolation Forest
        ↓
Anomaly Detection
```

The methodology specifies this analysis **per node tier** so that the model input structure matches the measurements available for that tier.

## Output

```text
node_id
timestamp
anomaly_status
anomaly_score / anomaly_rate
```

## Next

```text
Stage 3 anomaly output → Stage 7 Risk Fusion
```

---

# 5. Stage 4 — Severity & Progression Estimation

## Model

### Linear Regression

**Framework:** scikit-learn

## Objective

Measure how deformation is progressing and estimate severity.

## Inputs

Chronological cumulative deformation information such as:

```text
cumulative_displacement
and/or
tilt behaviour over time
```

## Process

```text
Historical Deformation
        ↓
Time Index
        ↓
Linear Regression
        ↓
Slope / Progression Rate
        ↓
Severity Bucket
```

## Output

```text
node_id
progression_rate
severity_bucket
```

## Next

```text
Stage 4 severity output → Stage 7 Risk Fusion
```

---

# 6. Stage 5 — Subsidence Trend Forecasting

## Model

### LSTM — Long Short-Term Memory

**Framework:** PyTorch

## Objective

Forecast the future subsidence/deformation trend.

## Inputs

Chronological displacement time-series.

```text
t1 → displacement
t2 → displacement
t3 → displacement
...
tn → displacement
```

## Process

```text
Displacement History
        ↓
Sequence Preparation
        ↓
Scaling / Normalization
        ↓
LSTM
        ↓
Forecasted Trend
```

## Output

```text
node_id
forecasted_displacement
forecasted_trend
```

## Technology

- PyTorch
- Python
- Pandas
- NumPy

> Stage 5 is a specialised forecasting branch. The documented Stage 7 formula does not automatically include this output.

---

# 7. Stage 6 — Vibration Hazard Classification

## Model

### Random Forest or XGBoost

**Framework:**

- scikit-learn → Random Forest
- XGBoost → XGBoost

The final choice should follow the existing project implementation/model.

## Objective

Classify whether the observed vibration pattern represents a hazard.

## Inputs

```text
acceleration
peak_acceleration
rms_acceleration
dominant_frequency
vibration_duration
```

## Process

```text
Vibration Measurements
        ↓
Feature Preparation
        ↓
Feature Compatibility Check
        ↓
Random Forest / XGBoost
        ↓
Vibration Hazard Classification
```

## Important Check

Before connecting project features directly to an existing trained model:

```text
MineGuard vibration features
            vs
Model training features
```

must be verified.

## Output

```text
node_id
timestamp
vibration_hazard_class
vibration_hazard_probability
```

> Stage 6 is a specialised analysis branch. The current documented Stage 7 formula does not automatically include its output.

---

# 8. Stage 7 — Zone Risk Fusion

## Model

### No separate ML model

This stage uses a **risk fusion formula / decision logic**.

## Inputs

According to the project methodology:

```text
Stage 3 → Anomaly Rate
          +
Stage 4 → Severity / Progression
```

## Process

```text
Anomaly Information
        +
Severity Information
        ↓
Risk Fusion Logic
        ↓
zone_risk_score
```

## Output

```text
node_id
timestamp
zone_risk_score
```

Optional configured risk levels:

```text
Low
Moderate
High
Critical
```

## Handover

The Part B output provided to the GIS member is:

```text
node_id
timestamp
zone_risk_score
```

---

# 9. Technology Stack

## Pipeline

```text
Python
FastAPI
Pandas
NumPy
```

## AI / ML

```text
Stage 3 → Isolation Forest → scikit-learn
Stage 4 → Linear Regression → scikit-learn
Stage 5 → LSTM → PyTorch
Stage 6 → Random Forest / XGBoost
Stage 7 → Risk Fusion Logic
```

## Supporting

```text
scikit-learn
XGBoost (if selected)
joblib / model persistence
Python virtual environment
```

---

# 10. Final Responsibility Boundary

```text
YOUR RESPONSIBILITY

Stage 1 → Data Ingestion
Stage 2 → Feature Engineering
Stage 3 → Isolation Forest
Stage 4 → Linear Regression
Stage 5 → LSTM
Stage 6 → RF / XGBoost
Stage 7 → Risk Fusion

            ↓

HANDOVER

node_id
timestamp
zone_risk_score

            ↓

OTHER MEMBER

Stage 8 → GIS / Map Integration
```

---

# 11. Final Model Summary

| Stage | Model / Technology | Purpose |
|---|---|---|
| Stage 1 | FastAPI / Python | Data ingestion |
| Stage 2 | Pandas | Feature engineering |
| Stage 3 | Isolation Forest | Abnormal deformation detection |
| Stage 4 | Linear Regression | Progression and severity |
| Stage 5 | LSTM | Subsidence trend forecasting |
| Stage 6 | Random Forest / XGBoost | Vibration hazard classification |
| Stage 7 | Fusion logic | Final zone risk score |

---

# Final Outcome

The AI/ML pipeline ultimately produces:

```text
node_id
timestamp
zone_risk_score
```

This is the final handover output from the AI/ML component to the GIS component.
