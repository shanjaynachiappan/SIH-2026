import { MonitoringNode } from '../types';
import { predictRisk } from './mockRiskModel';

export interface SimulationScenario {
  centerLat: number;
  centerLng: number;
  radiusDeg: number;
  maxDisplacement: number;
}

// Configurable scenario for realistic risk distribution
export let currentScenario: SimulationScenario = {
  centerLat: 23.758,
  centerLng: 86.415,
  radiusDeg: 0.0135, // Adjusted to allow LOW risk sensors at edges
  maxDisplacement: 60, // Peak deformation at center to generate CRITICAL risk
};

export function setSimulationScenario(scenario: Partial<SimulationScenario>) {
  currentScenario = { ...currentScenario, ...scenario };
}

export function initializeMockNodes(nodes: MonitoringNode[]): MonitoringNode[] {
  return nodes.map(n => updateNodeReading(n, true));
}

export function updateNodeReading(node: MonitoringNode, isInit: boolean = false): MonitoringNode {
  const dist = Math.sqrt(
    Math.pow(node.latitude - currentScenario.centerLat, 2) +
    Math.pow(node.longitude - currentScenario.centerLng, 2)
  );

  // Use a Gaussian bell curve so influence drops off naturally
  // This yields a better mix of LOW, MODERATE, HIGH, and CRITICAL nodes
  const sigma = currentScenario.radiusDeg / 3;
  let influence = Math.exp(-(dist * dist) / (2 * sigma * sigma));

  if (influence < 0.05) influence = 0;

  const baseDisp = influence * currentScenario.maxDisplacement;
  const newDisp = isInit ? baseDisp : Math.max(0, (node.displacement || 0) + (Math.random() * 0.5));

  // Add base noise for LOW risk nodes so they aren't totally zero
  const baseNoise = isInit ? Math.random() * 3 : 0;
  const finalDisp = isInit ? Math.max(baseNoise, newDisp) : newDisp;

  const newTilt = (finalDisp / 50) * 4.5 + (Math.random() * 0.2);
  const newVib = (finalDisp / 50) * 0.9 + (Math.random() * 0.1);

  const updatedNode = {
    ...node,
    displacement: node.displacement !== undefined ? Number(finalDisp.toFixed(2)) : undefined,
    tilt: node.tilt !== undefined ? Number(newTilt.toFixed(2)) : undefined,
    vibration: node.vibration !== undefined ? Number(newVib.toFixed(2)) : undefined,
    battery: isInit ? 100 : Math.max(0, node.battery - 0.01),
    lastUpdated: new Date().toISOString()
  };

  const risk = predictRisk(updatedNode);
  // @ts-ignore
  updatedNode.status = risk.riskLevel.toLowerCase();
  // @ts-ignore
  updatedNode.riskScore = risk.riskScore;
  // @ts-ignore
  updatedNode.riskConfidence = risk.confidence;

  return updatedNode;
}
