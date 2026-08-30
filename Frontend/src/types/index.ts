export type NodeStatus = 'normal' | 'warning' | 'high' | 'critical' | 'offline';

export interface MonitoringNode {
  id: string;
  name?: string;
  latitude: number;
  longitude: number;
  nodeType?: string;
  tilt?: number;
  displacement?: number;
  vibration?: number;
  crackDetected?: boolean;
  battery: number;
  status: NodeStatus | string;
  riskScore?: number;
  riskConfidence?: number;
  lastUpdated: string;
  finalRisk?: string;
  lstmRisk?: string;
  lstmProbabilities?: Record<string, number>;
  rfRisk?: string;
  rfProbabilities?: Record<string, number>;
  zoneId?: string;
  zoneName?: string;
  gatewayId?: string;
  meshId?: string;
  panelId?: string;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'displacement' | 'tilt' | 'vibration' | 'system';
  nodeId?: string;
  gatewayId?: string;
}

export interface DeformationDataPoint {
  time: string;
  deformation: number;
}

export interface RiskDistributionData {
  name: string;
  value: number;
  color: string;
}

export interface EnvironmentalData {
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
}

export interface DashboardSummary {
  totalNodes: number;
  onlineNodes: number;
  activeWarnings: number;
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
}

export type UserRole = 'MINE_CONTROLLER' | 'PLANNER' | 'REGULATOR' | 'ADMIN' | 'CENTRAL_ADMIN' | 'GEOTECH_ENGINEER' | 'VIEWER';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  gateway_id: string;
  panel_id: string;
  mesh_id?: string;
}

