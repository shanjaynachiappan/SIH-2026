import { MonitoringNode, Alert, DeformationDataPoint, RiskDistributionData, EnvironmentalData, DashboardSummary } from '../types';

export const summaryData: DashboardSummary = {
  totalNodes: 24,
  onlineNodes: 22,
  activeWarnings: 2,
  overallRisk: 'HIGH',
  riskScore: 78
};

// Generate some mock nodes
export const mockNodes: MonitoringNode[] = Array.from({ length: 24 }).map((_, i) => {
  const id = `N${(i + 1).toString().padStart(2, '0')}`;
  // Center roughly around a mock mine panel
  const baseLat = -34.0200;
  const baseLng = 150.8100;
  
  // create some random distribution
  const lat = baseLat + (Math.random() - 0.5) * 0.005;
  const lng = baseLng + (Math.random() - 0.5) * 0.008;

  let status: MonitoringNode['status'] = 'normal';
  if (i === 16 || i === 20) status = 'warning';
  if (i === 5 || i === 10) status = 'high';
  if (i === 13) status = 'critical';
  if (i === 3 || i === 19) status = 'offline';

  let nodeType = 'Multi-Parameter Node';
  let tilt: number | undefined = parseFloat((Math.random() * 2).toFixed(2));
  let displacement: number | undefined = parseFloat((Math.random() * 15).toFixed(1));
  let vibration: number | undefined = parseFloat((Math.random()).toFixed(2));

  if (i % 3 === 1) {
    nodeType = 'Deformation Node';
    vibration = undefined;
  } else if (i % 3 === 2) {
    nodeType = 'Seismic Node';
    tilt = undefined;
    displacement = undefined;
  }

  return {
    id,
    latitude: lat,
    longitude: lng,
    nodeType,
    tilt,
    displacement,
    vibration,
    battery: Math.floor(Math.random() * 40) + 60,
    status,
    lastUpdated: new Date().toISOString(),
    gatewayId: 'GW-01',
    meshId: 'MESH-01',
    panelId: 'P-01'
  };
});

export const mockAlerts: Alert[] = [
  {
    id: 'A1',
    title: 'High Deformation Detected',
    description: 'Panel P-01 - MESH-01',
    timestamp: '2 minutes ago',
    severity: 'high',
    type: 'displacement',
    gatewayId: 'GW-01'
  },
  {
    id: 'A2',
    title: 'Abnormal Tilt Detected',
    description: 'Node N17',
    timestamp: '5 minutes ago',
    severity: 'medium',
    type: 'tilt',
    nodeId: 'N17',
    gatewayId: 'GW-01'
  },
  {
    id: 'A3',
    title: 'Vibration Threshold Exceeded',
    description: 'Node N21',
    timestamp: '8 minutes ago',
    severity: 'medium',
    type: 'vibration',
    nodeId: 'N21',
    gatewayId: 'GW-01'
  },
  {
    id: 'A4',
    title: 'Node Back Online',
    description: 'Node N08',
    timestamp: '12 minutes ago',
    severity: 'low',
    type: 'system',
    nodeId: 'N08',
    gatewayId: 'GW-01'
  }
];

export const deformationTrend: DeformationDataPoint[] = [
  { time: '10 AM', deformation: 8.5 },
  { time: '1 PM', deformation: 12.1 },
  { time: '4 PM', deformation: 14.8 },
  { time: '7 PM', deformation: 13.5 },
  { time: '10 PM', deformation: 19.2 },
  { time: '1 AM', deformation: 18.0 },
  { time: '4 AM', deformation: 22.4 },
  { time: '7 AM', deformation: 25.1 },
  { time: '10 AM', deformation: 32.6 },
];

export const riskDistribution: RiskDistributionData[] = [
  { name: 'Low (0-30%)', value: 12, color: '#22c55e' },
  { name: 'Moderate (30-60%)', value: 6, color: '#eab308' },
  { name: 'High (60-80%)', value: 4, color: '#f97316' },
  { name: 'Critical (80-100%)', value: 2, color: '#ef4444' },
];

export const sensorStatusData = [
  { name: 'Online', value: 22, color: '#22c55e' },
  { name: 'Offline', value: 2, color: '#94a3b8' },
  { name: 'Maintenance', value: 0, color: '#3b82f6' },
];

export const environmentalData: EnvironmentalData = {
  temperature: 28.5,
  humidity: 65,
  rainfall: 0.2,
  windSpeed: 12
};
