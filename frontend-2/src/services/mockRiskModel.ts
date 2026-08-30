import { MonitoringNode } from '../types';
import { RiskScore, RiskCategory } from '../types/risk';

export function predictRisk(node: MonitoringNode): RiskScore {
  const tiltRisk = node.tilt !== undefined ? Math.min(node.tilt / 5, 1) : 0;
  const dispRisk = node.displacement !== undefined ? Math.min(node.displacement / 50, 1) : 0;
  const vibRisk = node.vibration !== undefined ? Math.min(node.vibration / 1, 1) : 0;
  
  let score = 0;
  let weightSum = 0;
  if (node.tilt !== undefined) { score += tiltRisk * 0.3; weightSum += 0.3; }
  if (node.displacement !== undefined) { score += dispRisk * 0.5; weightSum += 0.5; }
  if (node.vibration !== undefined) { score += vibRisk * 0.2; weightSum += 0.2; }

  if (weightSum > 0) {
    score = score / weightSum; // Normalize
  }
  
  let category: RiskCategory = 'LOW';
  if (score > 0.8) category = 'CRITICAL';
  else if (score > 0.6) category = 'HIGH';
  else if (score > 0.3) category = 'MODERATE';
  
  return {
    riskScore: score,
    riskLevel: category,
    confidence: 0.85 + (Math.random() * 0.1)
  };
}
