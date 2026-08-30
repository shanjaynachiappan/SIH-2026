export interface MineInfo {
  id: string;
  name: string;
  colliery: string;
  location: string;
  coordinates: [number, number];
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'ALERT';
  totalPanels: number;
  totalGateways: number;
  totalNodes: number;
  overallRisk: 'NORMAL' | 'WARNING' | 'CRITICAL';
  lastSyncTime: string;
}

export type PanelLifecycleState = 
  | 'NEW' 
  | 'COORDINATES_CONFIGURED' 
  | 'PLACEMENT_GENERATED' 
  | 'PLACEMENT_REVIEWED' 
  | 'PLACEMENT_APPROVED' 
  | 'ACTIVE_MONITORING';

export interface MinePanel {
  id: string;
  name: string;
  mineId: string;
  depthMeters: number;
  status: 'ACTIVE' | 'EXTRACTION_COMPLETED' | 'STANDBY' | 'HIGH_ATTENTION' | 'NEW';
  lifecycleState?: PanelLifecycleState;
  description?: string;
  centerLatitude?: number;
  centerLongitude?: number;
  riskLevel: 'NORMAL' | 'WARNING' | 'CRITICAL';
  riskScore: number;
  maxDeformationMm: number;
  gateways: string[];
  totalNodes: number;
  onlineNodes: number;
  warningCount: number;
  criticalCount: number;
  lastUpdated: string;
  geometry: {
    type: 'Polygon';
    coordinates: [number, number][];
  };
  algorithmUsed?: string;
  placementSavedAt?: string;
}

export type SyncStatusType = 'SYNCED' | 'DELAYED' | 'STALE' | 'OFFLINE';

export interface GatewayInfo {
  id: string;
  name: string;
  mineId: string;
  panelId: string;
  meshId: string;
  ipAddress: string;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  syncStatus: SyncStatusType;
  lastSyncTimestamp: string;
  lastSyncSecondsAgo: number;
  connectedNodes: number;
  totalNodes: number;
  meshHealth: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  signalStrengthDbm: number;
  batteryLevel?: number;
  currentRisk: 'NORMAL' | 'WARNING' | 'CRITICAL';
  firmwareVersion: string;
  latitude: number;
  longitude: number;
  packetSuccessRate?: number;
  latencyMs?: number;
}

export interface CentralAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  mineId: string;
  panelId: string;
  gatewayId: string;
  meshId?: string;
  nodeId?: string;
  recommendedAction: string;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
  confidencePercent?: number;
  type: 'displacement' | 'tilt' | 'vibration' | 'crack' | 'gateway_sync' | 'mesh_connectivity' | 'system';
}

export interface TrendMetricPoint {
  time: string;
  displacement: number;
  tilt: number;
  vibration: number;
  crackWidth: number;
  riskScore: number;
  predictedRiskScore?: number;
  predictedConfidence?: number;
}

export interface PredictedRiskData {
  currentRisk: 'NORMAL' | 'WARNING' | 'CRITICAL';
  currentScore: number;
  predictedRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidencePercent: number;
  trendDirection: 'INCREASING' | 'STABLE' | 'DECREASING';
  forecastWindowHours: number;
  recommendedActions: string[];
}

export interface ReportItem {
  id: string;
  title: string;
  category: 'Mine Risk Summary' | 'Panel Risk Summary' | 'Gateway Health' | 'Node Health' | 'Active Alerts' | 'Historical Deformation' | 'Risk Trend' | 'Compliance Audit';
  generatedAt: string;
  generatedBy: string;
  period: string;
  summaryText: string;
  metricsSummary: Record<string, any>;
  format: 'PDF' | 'CSV' | 'JSON';
  mineId?: string;
  panelId?: string;
}

export interface ProposedNode {
  id: string;
  nodeTier: 'Tier-1 (Surface Extensometer)' | 'Tier-2 (Sub-Surface MPBX)' | 'Tier-3 (In-Seam Multi-Param)';
  nodeType?: 'FULL' | 'LITE' | 'CRACK';
  latitude: number;
  longitude: number;
  confidence: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  purpose: string;
  estimatedCostINR: number;
}

export interface SensorPlacementData {
  mineId: string;
  panelId: string;
  panelName: string;
  totalPlannedNodes: number;
  installedNodes: number;
  proposedNodesCount: number;
  coveragePercent: number;
  estimatedCostINR: string;
  algorithmUsed?: string;
  algorithmStatus: 'OPTIMAL' | 'ANALYSIS_COMPLETE' | 'RUNNING' | 'NOT_GENERATED';
  lifecycleState?: PanelLifecycleState;
  savedAt?: string;
  nodeTypeCounts?: {
    FULL: number;
    LITE: number;
    CRACK: number;
  };
  proposedPoints: ProposedNode[];
}

export interface NodeRelocationItem {
  id: string;
  nodeId: string;
  mineId: string;
  panelId: string;
  currentZone: string;
  recommendedZone: string;
  currentCoordinates: [number, number];
  recommendedCoordinates: [number, number];
  distanceMeters: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  reason: string;
  extractionProgressionEffect: string;
}

export interface ComplianceItem {
  id: string;
  mineId: string;
  regulationCode: string;
  title: string;
  authority: string;
  status: 'COMPLIANT' | 'ACTION_REQUIRED' | 'UNDER_REVIEW';
  lastAuditDate: string;
  nextDueDate: string;
  responsibleOfficer: string;
  description: string;
  actionItem?: string;
}
