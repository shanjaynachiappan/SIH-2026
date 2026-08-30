"""
Mine Subsidence AI/ML Pipeline — runs directly on the 4 uploaded simulated
sensor CSVs. Covers all 5 PS requirements in one script:

  1) identify abnormal deformation patterns   -> detect_anomalies()
  2) predict possible subsidence zones        -> predict_zones()
  3) estimate severity and progression        -> severity_progression()
  4) generate automated early warning alerts  -> generate_alerts()
  5) support timely operational decisions     -> recommend_actions()

USAGE (run from the folder containing the 4 CSVs):
    python subsidence_ai_pipeline.py

Inputs expected in the same folder:
    full_nodes_all_4_sensors_500_total.csv
    lite_nodes_tilt_vibration_500_total.csv
    tilt_sensor_500_readings.csv           (this is actually the CRACK-only node data)
    gnss_reference_tilt_500_total.csv

Outputs written to the same folder:
    alerts.csv
    risk_zones.csv
    severity_progression.csv
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LinearRegression

FULL_CSV = "full_nodes_all_4_sensors_500_total.csv"
LITE_CSV = "lite_nodes_tilt_vibration_500_total.csv"
CRACK_CSV = "tilt_sensor_500_readings.csv"     # crack-only node tier
GNSS_CSV = "gnss_reference_tilt_500_total.csv"


# ---------- 0. LOAD ----------
def load_data():
    full = pd.read_csv(FULL_CSV, parse_dates=["timestamp"])
    lite = pd.read_csv(LITE_CSV, parse_dates=["timestamp"])
    crack = pd.read_csv(CRACK_CSV, parse_dates=["timestamp"])
    gnss = pd.read_csv(GNSS_CSV, parse_dates=["timestamp"])
    return full, lite, crack, gnss


# ---------- 1. IDENTIFY ABNORMAL DEFORMATION PATTERNS ----------
def detect_anomalies(df, feature_cols, contamination=0.05, tier_name=""):
    """Isolation Forest on rate-of-change features (already provided in the
    dataset as *_rate_*/*_change_* columns -- these matter more than raw
    values, since raw values drift naturally during normal subsidence)."""
    X = df[feature_cols].fillna(0).values
    model = IsolationForest(n_estimators=200, contamination=contamination, random_state=42)
    raw_pred = model.fit_predict(X)
    df = df.copy()
    df["is_anomaly"] = (raw_pred == -1).astype(int)
    df["anomaly_score"] = -model.decision_function(X)  # higher = more anomalous
    df["node_tier"] = df.get("node_tier", tier_name)
    return df


# ---------- 3. ESTIMATE SEVERITY AND PROGRESSION ----------
def severity_progression(df, value_col, time_col="timestamp", node_col="node_id"):
    """Per-node linear trend (progression rate) + severity bucket from
    quantile thresholds across all nodes in this tier."""
    rows = []
    for node_id, g in df.groupby(node_col):
        g = g.sort_values(time_col)
        if g[value_col].notna().sum() < 3:
            continue
        t_hours = (g[time_col] - g[time_col].iloc[0]).dt.total_seconds() / 3600.0
        y = g[value_col].fillna(0).values
        reg = LinearRegression().fit(t_hours.values.reshape(-1, 1), y)
        rate = reg.coef_[0]           # progression rate, units/hour
        latest = y[-1]
        rows.append({"node_id": node_id, "latest_value": latest, "progression_rate_per_hr": rate})
    out = pd.DataFrame(rows)
    if len(out) == 0:
        return out
    q_low, q_high = out["progression_rate_per_hr"].abs().quantile([0.5, 0.85])
    def bucket(r):
        r = abs(r)
        if r >= q_high: return "High"
        if r >= q_low: return "Medium"
        return "Low"
    out["severity"] = out["progression_rate_per_hr"].apply(bucket)
    return out


# ---------- 2. PREDICT POSSIBLE SUBSIDENCE ZONES ----------
def predict_zones(anomaly_dfs, sev_dfs):
    """Combine anomaly frequency + severity across all tiers, per node_id,
    into a zone risk ranking. node_id stands in for physical location."""
    frames = []
    for name, adf in anomaly_dfs.items():
        agg = adf.groupby("node_id")["is_anomaly"].agg(["sum", "count"]).reset_index()
        agg["anomaly_rate"] = agg["sum"] / agg["count"]
        agg["tier"] = name
        frames.append(agg[["node_id", "tier", "anomaly_rate"]])
    anomaly_all = pd.concat(frames, ignore_index=True)

    sev_all = pd.concat(
        [df.assign(tier=name) for name, df in sev_dfs.items() if len(df)],
        ignore_index=True
    )[["node_id", "tier", "severity", "progression_rate_per_hr"]]

    zones = anomaly_all.merge(sev_all, on=["node_id", "tier"], how="left")
    sev_rank = {"Low": 1, "Medium": 2, "High": 3}
    zones["severity_rank"] = zones["severity"].map(sev_rank).fillna(0)
    zones["zone_risk_score"] = zones["anomaly_rate"] * 2 + zones["severity_rank"]

    def zone_label(score):
        if score >= 3.0: return "High-risk zone"
        if score >= 1.5: return "Medium-risk zone"
        return "Low-risk zone"
    zones["zone_risk_level"] = zones["zone_risk_score"].apply(zone_label)
    return zones.sort_values("zone_risk_score", ascending=False)


# ---------- 4. GENERATE AUTOMATED EARLY WARNING ALERTS ----------
def generate_alerts(anomaly_dfs, zones):
    high_risk_nodes = set(zones.loc[zones["zone_risk_level"] == "High-risk zone", "node_id"])
    alerts = []
    for tier_name, adf in anomaly_dfs.items():
        flagged = adf[adf["is_anomaly"] == 1]
        for _, row in flagged.iterrows():
            level = "CRITICAL" if row["node_id"] in high_risk_nodes else "WARNING"
            alerts.append({
                "timestamp": row["timestamp"], "node_id": row["node_id"],
                "tier": tier_name, "anomaly_score": round(row["anomaly_score"], 3),
                "alert_level": level,
                "message": f"Abnormal deformation pattern detected at {row['node_id']} ({tier_name} tier)."
            })
    return pd.DataFrame(alerts).sort_values("timestamp") if alerts else pd.DataFrame(
        columns=["timestamp", "node_id", "tier", "anomaly_score", "alert_level", "message"])


# ---------- 5. SUPPORT TIMELY OPERATIONAL DECISIONS ----------
def recommend_actions(zones):
    action_map = {
        "High-risk zone": "Dispatch inspection team + increase sampling rate + prepare evacuation advisory for nearby assets",
        "Medium-risk zone": "Increase monitoring frequency at this node; schedule full-node upgrade if trend continues",
        "Low-risk zone": "Continue routine baseline monitoring",
    }
    zones = zones.copy()
    zones["recommended_action"] = zones["zone_risk_level"].map(action_map)
    return zones


def main():
    full, lite, crack, gnss = load_data()

    # --- Step 1: anomaly detection per tier (using rate/change features already in the data) ---
    full_a = detect_anomalies(full,
        ["tilt_rate_deg_per_time", "rms_acceleration_mps2", "displacement_rate_mm_per_time", "crack_growth_rate_mm_per_time"],
        contamination=0.08, tier_name="Full")
    lite_a = detect_anomalies(lite,
        ["tilt_rate_deg_per_time", "rms_acceleration_mps2"],
        contamination=0.08, tier_name="Lite")
    crack_a = detect_anomalies(crack,
        ["crack_growth_rate_mm_per_time"],
        contamination=0.1, tier_name="Crack")
    gnss_a = detect_anomalies(gnss,
        ["vertical_displacement_rate_mm_per_time", "horizontal_displacement_rate_mm_per_time", "tilt_rate_deg_per_time"],
        contamination=0.08, tier_name="GNSS")

    anomaly_dfs = {"Full": full_a, "Lite": lite_a, "Crack": crack_a, "GNSS": gnss_a}

    # --- Step 3: severity + progression per tier ---
    sev_dfs = {
        "Full": severity_progression(full, "cumulative_displacement_mm"),
        "Lite": severity_progression(lite, "tilt_magnitude_deg"),
        "Crack": severity_progression(crack, "crack_opening_mm"),
        "GNSS": severity_progression(gnss, "vertical_displacement_mm"),
    }

    # --- Step 2: subsidence zone prediction ---
    zones = predict_zones(anomaly_dfs, sev_dfs)

    # --- Step 4: alerts ---
    alerts = generate_alerts(anomaly_dfs, zones)

    # --- Step 5: operational recommendations ---
    zones_with_actions = recommend_actions(zones)

    # ---- OUTPUT ----
    print("\n================ RISK ZONES (per node) ================")
    print(zones_with_actions[["node_id", "tier", "anomaly_rate", "severity",
                               "progression_rate_per_hr", "zone_risk_level"]].to_string(index=False))

    print(f"\n================ ALERTS GENERATED: {len(alerts)} ================")
    if len(alerts):
        print(alerts.head(15).to_string(index=False))

    zones_with_actions.to_csv("risk_zones.csv", index=False)
    alerts.to_csv("alerts.csv", index=False)
    pd.concat([df.assign(tier=k) for k, df in sev_dfs.items() if len(df)]).to_csv(
        "severity_progression.csv", index=False)

    print("\nSaved: risk_zones.csv, alerts.csv, severity_progression.csv")


if __name__ == "__main__":
    main()
