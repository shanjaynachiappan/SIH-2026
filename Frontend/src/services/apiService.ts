import { MonitoringNode } from '../types';
import { RiskZonePolygon, RiskCategory } from '../types/risk';

const API_BASE = 'http://localhost:8000/api';

export async function fetchLiveNodes(): Promise<MonitoringNode[]> {
  try {
    const res = await fetch(`${API_BASE}/nodes`);
    if (!res.ok) return [];
    const data = await res.json();
    
    // We also need to fetch detailed risk for each to get probabilities if needed, 
    // but the backend /api/nodes can be updated to return the full node details.
    // Let's assume the backend /api/nodes returns full node state.
    // Wait, the backend currently returns: {"node_id": n.node_id, "risk": n.current_risk, "last_update": n.last_update}
    // We should fetch each node to get full data.
    const fullNodes = await Promise.all(
      data.map(async (n: any) => {
        const detailRes = await fetch(`${API_BASE}/nodes/${n.node_id}`);
        if (!detailRes.ok) return null;
        const detail = await detailRes.json();
        
        const idNum = parseInt(n.node_id.split('_').pop() || '1');
        const statusStr = detail.final_risk ? detail.final_risk.toLowerCase() : 'normal';
        const latestData = detail.latest_sensor_data || {};
        
        return {
          id: n.node_id,
          name: `Sensor Node ${idNum}`,
          // Pseudo-random organic scatter within the panel bounds using sine/cosine of the ID
          latitude: 23.752 + Math.abs(Math.sin(idNum * 12.9898)) * 0.009,
          longitude: 86.411 + Math.abs(Math.cos(idNum * 4.1415)) * 0.011,
          status: statusStr,
          riskScore: detail.lstm_probabilities ? detail.lstm_probabilities.CRITICAL * 100 : 0,
          riskConfidence: detail.lstm_probabilities ? Math.max(detail.lstm_probabilities.NORMAL, detail.lstm_probabilities.WARNING, detail.lstm_probabilities.CRITICAL) * 100 : 0,
          battery: latestData.battery_level !== undefined ? latestData.battery_level : 95,
          lastUpdated: detail.timestamp || detail.last_update,
          displacement: latestData.displacement_mm,
          tilt: latestData.tilt_magnitude_deg,
          vibration: latestData.acceleration_mps2,
          crackDetected: latestData.crack_detected === 1,
          finalRisk: detail.final_risk,
          lstmRisk: detail.lstm_risk,
          lstmProbabilities: detail.lstm_probabilities,
          rfRisk: detail.rf_risk,
          rfProbabilities: detail.rf_probabilities,
          zoneId: detail.zone_id,
          zoneName: detail.zone_name
        } as MonitoringNode;
      })
    );
    
    return fullNodes.filter(n => n !== null) as MonitoringNode[];
  } catch (error) {
    console.error("Error fetching live nodes:", error);
    return [];
  }
}

export async function fetchLiveZones(): Promise<RiskZonePolygon[]> {
  try {
    const res = await fetch(`${API_BASE}/risk-zones`);
    if (!res.ok) return [];
    const data = await res.json();
    
    return data.map((z: any) => {
      const halfSize = 0.003; 
      const coords: [number, number][][] = [[
        [z.latitude - halfSize, z.longitude - halfSize],
        [z.latitude + halfSize, z.longitude - halfSize],
        [z.latitude + halfSize, z.longitude + halfSize],
        [z.latitude - halfSize, z.longitude + halfSize],
        [z.latitude - halfSize, z.longitude - halfSize]
      ]];
      
      return {
        id: z.zone_id,
        name: z.zone_name,
        category: z.zone_risk as RiskCategory,
        coordinates: coords
      };
    });
  } catch (error) {
    console.error("Error fetching live zones:", error);
    return [];
  }
}

export async function fetchLiveAlerts(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/alerts`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error fetching live alerts:", error);
    return [];
  }
}
