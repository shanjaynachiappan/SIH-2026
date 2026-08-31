import traceback
import math
import datetime
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

from live_inference import process_sensor_json

app = Flask(__name__)
# Enable CORS for cross-origin requests from the React frontends
CORS(app)

# --- In-Memory Stores ---
telemetry_store = []
nodes_store = {} # node_id -> { 'ml_result': dict, 'payload': dict }

def make_json_safe(obj):
    if isinstance(obj, dict):
        return {k: make_json_safe(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [make_json_safe(i) for i in obj]
    elif pd.isna(obj):
        return None
    elif isinstance(obj, (np.integer, int)):
        return int(obj)
    elif isinstance(obj, (np.floating, float)):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return make_json_safe(obj.tolist())
    else:
        return obj

def map_hazard_class(ml_result):
    risk_score = ml_result.get("composite_risk_score")
    if risk_score is None:
        return "NORMAL"
    if risk_score >= 0.75:
        return "CRITICAL"
    if risk_score >= 0.5:
        return "WARNING"
    return "NORMAL"

@app.route('/api/telemetry', methods=['POST'])
def api_telemetry():
    """Hardware endpoint: runs ML pipeline and stores result"""
    if not request.is_json:
        return jsonify({"error": "Request body must contain valid JSON."}), 400
        
    payload = request.get_json(silent=True)
    if payload is None or not payload.get("node_id"):
        return jsonify({"error": "Missing node_id in request payload."}), 400
        
    try:
        # Run ML Pipeline
        ml_result = process_sensor_json(payload)
        
        if ml_result and "error" in ml_result:
            return jsonify(ml_result), 400
            
        safe_result = make_json_safe(ml_result)
        
        # Store in memory
        node_id = safe_result['node_id']
        record = {
            "ml_result": safe_result,
            "payload": payload,
            "received_at": datetime.datetime.utcnow().isoformat() + "Z"
        }
        nodes_store[node_id] = record
        telemetry_store.append(record)
        
        return jsonify({
            "success": True, 
            "message": "Telemetry processed successfully", 
            "data": safe_result
        }), 201
        
    except Exception as e:
        print("--- INFERENCE EXCEPTION ---")
        traceback.print_exc()
        return jsonify({"error": "Inference processing failed.", "detail": str(e)}), 500

# ==========================================
# ENDPOINTS FOR LOCAL DASHBOARD
# ==========================================

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "MineGuard backend is running (Unified ML)"})

@app.route('/api/telemetry/latest', methods=['GET'])
def get_latest_telemetry():
    node_id = request.args.get('node_id', 'N_LITE_01')
    if node_id in nodes_store:
        return jsonify({"success": True, "data": nodes_store[node_id]['payload']})
    
    if telemetry_store:
        return jsonify({"success": True, "data": telemetry_store[-1]['payload']})
        
    return jsonify({"success": False, "message": "No telemetry data found"}), 404

@app.route('/api/telemetry/history', methods=['GET'])
def get_telemetry_history():
    node_id = request.args.get('node_id')
    limit_str = request.args.get('limit')
    
    records = [r['payload'] for r in telemetry_store if not node_id or r['payload'].get('node_id') == node_id]
    records.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    
    if limit_str and limit_str.isdigit():
        records = records[:int(limit_str)]
        
    return jsonify({"success": True, "count": len(records), "data": records})

# ==========================================
# ENDPOINTS FOR CENTRAL DASHBOARD
# ==========================================

@app.route('/api/nodes', methods=['GET'])
@app.route('/api/ml/nodes', methods=['GET'])
def get_nodes():
    res = []
    for node_id, data in nodes_store.items():
        ml = data['ml_result']
        res.append({
            "node_id": node_id,
            "current_risk": map_hazard_class(ml),
            "last_update": ml.get("timestamp")
        })
    return jsonify(res), 200

@app.route('/api/nodes/<node_id>', methods=['GET'])
@app.route('/api/ml/nodes/<node_id>', methods=['GET'])
def get_node_detail(node_id):
    if node_id not in nodes_store:
        return jsonify({"error": "Not found"}), 404
        
    data = nodes_store[node_id]
    ml = data['ml_result']
    payload = data['payload']
    
    risk_score = ml.get("composite_risk_score")
    if risk_score is None:
        risk_score = 0.0
        
    final_risk = map_hazard_class(ml)
    
    return jsonify({
        "node_id": node_id,
        "timestamp": ml.get("timestamp"),
        "final_risk": final_risk,
        "lstm_risk": final_risk,
        "lstm_probabilities": {
            "NORMAL": max(0.0, 1.0 - risk_score) if final_risk == "NORMAL" else 0.1,
            "WARNING": risk_score if final_risk == "WARNING" else 0.1,
            "CRITICAL": risk_score if final_risk == "CRITICAL" else 0.0
        },
        "latest_sensor_data": payload,
        "latitude": ml.get("latitude") or payload.get("latitude"),
        "longitude": ml.get("longitude") or payload.get("longitude"),
        "zone_id": ml.get("zone_id", "ZONE_A"),
        "zone_name": "Main Panel"
    }), 200

@app.route('/api/risk-zones', methods=['GET'])
@app.route('/api/ml/risk-zones', methods=['GET'])
def get_risk_zones():
    return jsonify([
        {"zone_id": "ZONE_A", "zone_name": "Northern Panel", "zone_risk": "WARNING", "latitude": 23.755, "longitude": 86.415},
        {"zone_id": "ZONE_B", "zone_name": "Southern Panel", "zone_risk": "CRITICAL", "latitude": 23.750, "longitude": 86.410}
    ]), 200

@app.route('/api/alerts', methods=['GET'])
@app.route('/api/ml/alerts', methods=['GET'])
def get_alerts():
    alerts = []
    for node_id, data in nodes_store.items():
        ml = data['ml_result']
        hazard = map_hazard_class(ml)
        if hazard in ["WARNING", "CRITICAL"]:
            alerts.append({
                "id": f"ALT-{node_id}-{ml.get('timestamp', '')}",
                "title": f"{hazard} Alert on {node_id}",
                "description": f"Node {node_id} reported {hazard} risk state based on ML predictions.",
                "timestamp": ml.get("timestamp"),
                "severity": hazard.lower(),
                "type": "system",
                "nodeId": node_id
            })
    return jsonify(alerts), 200

if __name__ == '__main__':
    # Run locally on 0.0.0.0:5000 so both frontends and hardware can reach it
    app.run(host='0.0.0.0', port=5000, debug=False)
