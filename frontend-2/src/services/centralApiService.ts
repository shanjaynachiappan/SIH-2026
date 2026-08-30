import { 
  MineInfo, 
  MinePanel, 
  GatewayInfo, 
  CentralAlert, 
  TrendMetricPoint, 
  PredictedRiskData, 
  ReportItem,
  SensorPlacementData,
  NodeRelocationItem,
  ComplianceItem,
  ProposedNode
} from '../types/central';
import { MonitoringNode } from '../types';
import { 
  centralMinesList, 
  centralPanels, 
  centralGateways, 
  centralNodes, 
  centralAlerts, 
  centralHistoricalTrends, 
  centralPredictedRisk, 
  centralReportsList,
  panelSensorPlacementData,
  panelNodeRelocations,
  complianceAuditRecords
} from '../data/centralMockData';

const STORAGE_KEY_PANELS = 'mineguard_panels_v3';
const STORAGE_KEY_PLACEMENTS = 'mineguard_placements_v3';

const API_BASE = 'http://localhost:5000/api';

class CentralApiService {
  private minesState: MineInfo[] = [...centralMinesList];
  private panelsState: MinePanel[] = [];
  private gatewaysState: GatewayInfo[] = [...centralGateways];
  private nodesState: MonitoringNode[] = [...centralNodes];
  private alertsState: CentralAlert[] = [...centralAlerts];
  private placementsState: Record<string, SensorPlacementData> = {};

  constructor() {
    this.initFromStorage();
  }

  private initFromStorage() {
    try {
      const savedPanels = localStorage.getItem(STORAGE_KEY_PANELS);
      if (savedPanels) {
        this.panelsState = JSON.parse(savedPanels);
      } else {
        this.panelsState = [...centralPanels];
      }

      const savedPlacements = localStorage.getItem(STORAGE_KEY_PLACEMENTS);
      if (savedPlacements) {
        this.placementsState = JSON.parse(savedPlacements);
      } else {
        this.placementsState = { ...panelSensorPlacementData };
      }
    } catch {
      this.panelsState = [...centralPanels];
      this.placementsState = { ...panelSensorPlacementData };
    }
  }

  private persistStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_PANELS, JSON.stringify(this.panelsState));
      localStorage.setItem(STORAGE_KEY_PLACEMENTS, JSON.stringify(this.placementsState));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  // ===================== MINES =====================
  public async getMines(): Promise<MineInfo[]> {
    return this.minesState;
  }

  public async getMineById(id: string): Promise<MineInfo | undefined> {
    return this.minesState.find(m => m.id.toLowerCase() === id.toLowerCase());
  }

  // ===================== PANELS =====================
  public async getPanels(mineId?: string): Promise<MinePanel[]> {
    if (mineId && mineId !== 'ALL') {
      return this.panelsState.filter(p => p.mineId.toLowerCase() === mineId.toLowerCase());
    }
    return this.panelsState;
  }

  public async getPanelById(mineId: string, panelId: string): Promise<MinePanel | undefined> {
    return this.panelsState.find(
      p => p.mineId.toLowerCase() === mineId.toLowerCase() && p.id.toLowerCase() === panelId.toLowerCase()
    );
  }

  public async addPanel(data: {
    id: string;
    name: string;
    mineId: string;
    depthMeters?: number;
    status?: MinePanel['status'];
    description?: string;
    geometry?: { type: 'Polygon'; coordinates: [number, number][] };
  }): Promise<MinePanel> {
    // Check if ID already exists under mineId
    const existing = this.panelsState.find(
      p => p.mineId.toLowerCase() === data.mineId.toLowerCase() && p.id.toLowerCase() === data.id.toLowerCase()
    );
    if (existing) {
      throw new Error(`Panel ID "${data.id}" already exists under ${data.mineId}. Panel IDs must be unique within a mine.`);
    }

    // Default polygon geometry around mine center if none provided
    const mine = this.minesState.find(m => m.id === data.mineId) || this.minesState[0];
    const baseLat = mine.coordinates[0];
    const baseLng = mine.coordinates[1];
    
    // Offset slightly for each panel
    const pCount = this.panelsState.filter(p => p.mineId === data.mineId).length;
    const offsetLat = (pCount * 0.005);
    const offsetLng = (pCount * 0.005);

    const defaultGeometry = data.geometry || {
      type: 'Polygon' as const,
      coordinates: [
        [baseLat + offsetLat, baseLng + offsetLng],
        [baseLat + offsetLat + 0.004, baseLng + offsetLng + 0.002],
        [baseLat + offsetLat + 0.003, baseLng + offsetLng + 0.006],
        [baseLat + offsetLat - 0.001, baseLng + offsetLng + 0.004]
      ] as [number, number][]
    };

    const newPanel: MinePanel = {
      id: data.id.toUpperCase(),
      name: data.name,
      mineId: data.mineId,
      depthMeters: data.depthMeters || 240,
      status: data.status || 'NEW',
      lifecycleState: 'NEW',
      description: data.description || 'Newly added underground extraction panel',
      riskLevel: 'NORMAL',
      riskScore: 12,
      maxDeformationMm: 1.5,
      gateways: [],
      totalNodes: 0,
      onlineNodes: 0,
      warningCount: 0,
      criticalCount: 0,
      lastUpdated: 'Just now',
      geometry: defaultGeometry
    };

    this.panelsState.push(newPanel);

    // Update mine's panel count
    if (mine) {
      mine.totalPanels = this.panelsState.filter(p => p.mineId === mine.id).length;
    }

    this.persistStorage();
    return newPanel;
  }

  public async updatePanelGeometry(
    mineId: string, 
    panelId: string, 
    coordinates: [number, number][]
  ): Promise<MinePanel | undefined> {
    const panel = this.panelsState.find(
      p => p.mineId.toLowerCase() === mineId.toLowerCase() && p.id.toLowerCase() === panelId.toLowerCase()
    );

    if (!panel) return undefined;

    panel.geometry = {
      type: 'Polygon',
      coordinates: coordinates
    };

    if (!panel.lifecycleState || panel.lifecycleState === 'NEW') {
      panel.lifecycleState = 'COORDINATES_CONFIGURED';
    }

    this.persistStorage();
    return panel;
  }

  // ===================== GATEWAYS =====================
  public async getGateways(mineId?: string, panelId?: string): Promise<GatewayInfo[]> {
    let result = [...this.gatewaysState];
    if (mineId && mineId !== 'ALL') {
      result = result.filter(g => g.mineId.toLowerCase() === mineId.toLowerCase());
    }
    if (panelId && panelId !== 'ALL') {
      result = result.filter(g => g.panelId.toLowerCase() === panelId.toLowerCase());
    }
    return result;
  }

  public async getGatewayById(mineId: string, gatewayId: string): Promise<GatewayInfo | undefined> {
    return this.gatewaysState.find(
      g => g.mineId.toLowerCase() === mineId.toLowerCase() && g.id.toLowerCase() === gatewayId.toLowerCase()
    );
  }

  // ===================== NODES =====================
  public async getCentralNodes(filters?: {
    mineId?: string;
    panelId?: string;
    gatewayId?: string;
    nodeTier?: string;
    status?: string;
    risk?: string;
    search?: string;
  }): Promise<MonitoringNode[]> {
    let result: MonitoringNode[] = [];
    try {
      const res = await fetch(`${API_BASE}/ml/nodes`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const fullNodes = await Promise.all(
          data.map(async (n: any) => {
            const detailRes = await fetch(`${API_BASE}/ml/nodes/${n.node_id}`, { cache: 'no-store' });
            if (!detailRes.ok) return null;
            const detail = await detailRes.json();
            const statusStr = detail.final_risk ? detail.final_risk.toLowerCase() : 'normal';
            const latestData = detail.latest_sensor_data || {};
            
            return {
              id: n.node_id,
              name: n.node_id,
              mineId: 'MINE-01',
              panelId: 'P-01',
              gatewayId: 'GW-01',
              nodeType: 'FULL',
              nodeTier: 'Tier-1',
              latitude: detail.latitude || 23.752,
              longitude: detail.longitude || 86.411,
              status: statusStr,
              riskScore: detail.lstm_probabilities ? detail.lstm_probabilities.CRITICAL : 0,
              riskConfidence: detail.lstm_probabilities ? Math.max(detail.lstm_probabilities.NORMAL, detail.lstm_probabilities.WARNING, detail.lstm_probabilities.CRITICAL) : 0,
              battery: latestData.battery_level !== undefined ? latestData.battery_level : 95,
              lastUpdated: detail.timestamp || detail.last_update,
              displacement: latestData.displacement_mm,
              tilt: latestData.tilt_magnitude_deg,
              vibration: latestData.acceleration_mps2,
              crackDetected: latestData.crack_detected === 1,
              finalRisk: detail.final_risk,
            } as MonitoringNode;
          })
        );
        result = fullNodes.filter(n => n !== null) as MonitoringNode[];
      }
    } catch (e) {
      console.warn("Could not fetch real nodes from backend, falling back to mock", e);
      result = [...this.nodesState];
    }

    if (filters) {
      if (filters.mineId && filters.mineId !== 'ALL') {
        result = result.filter(n => n.mineId?.toLowerCase() === filters.mineId?.toLowerCase());
      }
      if (filters.panelId && filters.panelId !== 'ALL') {
        result = result.filter(n => n.panelId?.toLowerCase() === filters.panelId?.toLowerCase());
      }
      if (filters.gatewayId && filters.gatewayId !== 'ALL') {
        result = result.filter(n => n.gatewayId?.toLowerCase() === filters.gatewayId?.toLowerCase());
      }
      if (filters.nodeTier && filters.nodeTier !== 'ALL') {
        result = result.filter(n => n.nodeTier?.toLowerCase().includes(filters.nodeTier?.toLowerCase() || ''));
      }
      if (filters.status && filters.status !== 'ALL') {
        if (filters.status === 'ONLINE') {
          result = result.filter(n => n.status !== 'offline');
        } else if (filters.status === 'OFFLINE') {
          result = result.filter(n => n.status === 'offline');
        }
      }
      if (filters.risk && filters.risk !== 'ALL') {
        result = result.filter(n => n.status?.toLowerCase() === filters.risk?.toLowerCase());
      }
      if (filters.search) {
        const query = filters.search.toLowerCase();
        result = result.filter(n => 
          n.id.toLowerCase().includes(query) || 
          n.panelId?.toLowerCase().includes(query) ||
          n.gatewayId?.toLowerCase().includes(query) ||
          n.nodeType?.toLowerCase().includes(query)
        );
      }
    }

    return result;
  }

  // ===================== SENSOR PLACEMENT =====================
  public async getSensorPlacement(mineId: string, panelId: string): Promise<SensorPlacementData | undefined> {
    const key = `${mineId}:${panelId}`;
    if (this.placementsState[key]) {
      return this.placementsState[key];
    }
    
    const panel = await this.getPanelById(mineId, panelId);
    if (!panel) return undefined;

    // Return ungenerated default structure for panels without placement
    return {
      mineId,
      panelId,
      panelName: panel.name,
      totalPlannedNodes: panel.totalNodes || 12,
      installedNodes: panel.onlineNodes || 0,
      proposedNodesCount: 0,
      coveragePercent: 0,
      estimatedCostINR: '₹ 0',
      algorithmStatus: 'NOT_GENERATED',
      lifecycleState: panel.lifecycleState || 'NEW',
      nodeTypeCounts: { FULL: 0, LITE: 0, CRACK: 0 },
      proposedPoints: []
    };
  }

  public async generateSensorPlacement(
    mineId: string, 
    panelId: string, 
    algorithmName: string
  ): Promise<SensorPlacementData> {
    const panel = await this.getPanelById(mineId, panelId);
    const key = `${mineId}:${panelId}`;

    const baseLat = panel?.geometry?.coordinates?.[0]?.[0] || 23.760;
    const baseLng = panel?.geometry?.coordinates?.[0]?.[1] || 86.415;

    // Generate 12 proposed points around geometry centroid with FULL, LITE, and CRACK node types
    const proposedPoints: ProposedNode[] = [
      {
        id: `PROP-${panelId}-01`,
        nodeTier: 'Tier-3 (In-Seam Multi-Param)',
        nodeType: 'FULL',
        latitude: baseLat + 0.0012,
        longitude: baseLng + 0.0008,
        confidence: 0.96,
        priority: 'HIGH',
        purpose: 'Goaf edge multi-param stress & convergence hub',
        estimatedCostINR: 35000
      },
      {
        id: `PROP-${panelId}-02`,
        nodeTier: 'Tier-1 (Surface Extensometer)',
        nodeType: 'FULL',
        latitude: baseLat + 0.0022,
        longitude: baseLng + 0.0018,
        confidence: 0.94,
        priority: 'HIGH',
        purpose: 'Surface extensometer & pillar stress point',
        estimatedCostINR: 35000
      },
      {
        id: `PROP-${panelId}-03`,
        nodeTier: 'Tier-2 (Sub-Surface MPBX)',
        nodeType: 'FULL',
        latitude: baseLat + 0.0005,
        longitude: baseLng + 0.0032,
        confidence: 0.92,
        priority: 'HIGH',
        purpose: 'Sub-surface MPBX borehole anchor point',
        estimatedCostINR: 35000
      },
      {
        id: `PROP-${panelId}-04`,
        nodeTier: 'Tier-3 (In-Seam Multi-Param)',
        nodeType: 'FULL',
        latitude: baseLat - 0.0008,
        longitude: baseLng + 0.0021,
        confidence: 0.91,
        priority: 'HIGH',
        purpose: 'Longwall face advance barrier monitor',
        estimatedCostINR: 35000
      },
      {
        id: `PROP-${panelId}-05`,
        nodeTier: 'Tier-1 (Surface Extensometer)',
        nodeType: 'FULL',
        latitude: baseLat + 0.0031,
        longitude: baseLng + 0.0004,
        confidence: 0.89,
        priority: 'HIGH',
        purpose: 'Surface displacement & elevation tilt array',
        estimatedCostINR: 35000
      },
      {
        id: `PROP-${panelId}-06`,
        nodeTier: 'Tier-2 (Sub-Surface MPBX)',
        nodeType: 'LITE',
        latitude: baseLat + 0.0018,
        longitude: baseLng - 0.0010,
        confidence: 0.88,
        priority: 'MEDIUM',
        purpose: 'Low-power mesh node for rib convergence',
        estimatedCostINR: 15000
      },
      {
        id: `PROP-${panelId}-07`,
        nodeTier: 'Tier-1 (Surface Extensometer)',
        nodeType: 'LITE',
        latitude: baseLat - 0.0015,
        longitude: baseLng + 0.0042,
        confidence: 0.87,
        priority: 'MEDIUM',
        purpose: 'Surface tilt & temperature telemetry node',
        estimatedCostINR: 15000
      },
      {
        id: `PROP-${panelId}-08`,
        nodeTier: 'Tier-2 (Sub-Surface MPBX)',
        nodeType: 'LITE',
        latitude: baseLat + 0.0002,
        longitude: baseLng - 0.0018,
        confidence: 0.86,
        priority: 'MEDIUM',
        purpose: 'Secondary pillar deformation monitor',
        estimatedCostINR: 15000
      },
      {
        id: `PROP-${panelId}-09`,
        nodeTier: 'Tier-1 (Surface Extensometer)',
        nodeType: 'LITE',
        latitude: baseLat + 0.0028,
        longitude: baseLng + 0.0038,
        confidence: 0.84,
        priority: 'MEDIUM',
        purpose: 'Roof sag & extensional strain point',
        estimatedCostINR: 15000
      },
      {
        id: `PROP-${panelId}-10`,
        nodeTier: 'Tier-3 (In-Seam Multi-Param)',
        nodeType: 'CRACK',
        latitude: baseLat + 0.0015,
        longitude: baseLng + 0.0045,
        confidence: 0.95,
        priority: 'HIGH',
        purpose: 'Acoustic micro-seismic & crack displacement sensor',
        estimatedCostINR: 25000
      },
      {
        id: `PROP-${panelId}-11`,
        nodeTier: 'Tier-3 (In-Seam Multi-Param)',
        nodeType: 'CRACK',
        latitude: baseLat - 0.0002,
        longitude: baseLng + 0.0009,
        confidence: 0.93,
        priority: 'HIGH',
        purpose: 'High-speed fracture & vibration sensor',
        estimatedCostINR: 25000
      },
      {
        id: `PROP-${panelId}-12`,
        nodeTier: 'Tier-3 (In-Seam Multi-Param)',
        nodeType: 'CRACK',
        latitude: baseLat + 0.0035,
        longitude: baseLng + 0.0025,
        confidence: 0.90,
        priority: 'MEDIUM',
        purpose: 'Goaf boundary shear strain & crack monitor',
        estimatedCostINR: 25000
      }
    ];

    const fullCount = proposedPoints.filter(p => p.nodeType === 'FULL').length;
    const liteCount = proposedPoints.filter(p => p.nodeType === 'LITE').length;
    const crackCount = proposedPoints.filter(p => p.nodeType === 'CRACK').length;
    const totalCapex = proposedPoints.reduce((sum, p) => sum + p.estimatedCostINR, 0);

    const placementData: SensorPlacementData = {
      mineId,
      panelId,
      panelName: panel?.name || panelId,
      totalPlannedNodes: (panel?.totalNodes || 0) + proposedPoints.length,
      installedNodes: panel?.onlineNodes || 0,
      proposedNodesCount: proposedPoints.length,
      coveragePercent: 96.5,
      estimatedCostINR: `₹ ${totalCapex.toLocaleString('en-IN')}`,
      algorithmUsed: algorithmName,
      algorithmStatus: 'OPTIMAL',
      lifecycleState: 'PLACEMENT_GENERATED',
      nodeTypeCounts: {
        FULL: fullCount,
        LITE: liteCount,
        CRACK: crackCount
      },
      proposedPoints
    };

    this.placementsState[key] = placementData;

    if (panel) {
      panel.lifecycleState = 'PLACEMENT_GENERATED';
      panel.algorithmUsed = algorithmName;
    }

    this.persistStorage();
    return placementData;
  }

  public async saveSensorPlacement(
    mineId: string, 
    panelId: string, 
    placementData: SensorPlacementData
  ): Promise<SensorPlacementData> {
    const key = `${mineId}:${panelId}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedPlacement: SensorPlacementData = {
      ...placementData,
      lifecycleState: 'PLACEMENT_APPROVED',
      savedAt: timestamp
    };

    this.placementsState[key] = updatedPlacement;

    const panel = this.panelsState.find(
      p => p.mineId.toLowerCase() === mineId.toLowerCase() && p.id.toLowerCase() === panelId.toLowerCase()
    );

    if (panel) {
      panel.lifecycleState = 'PLACEMENT_APPROVED';
      panel.placementSavedAt = timestamp;
    }

    this.persistStorage();
    return updatedPlacement;
  }

  // ===================== NODE RELOCATION =====================
  public async getNodeRelocations(mineId: string, panelId: string): Promise<NodeRelocationItem[]> {
    const key = `${mineId}:${panelId}`;
    return panelNodeRelocations[key] || [];
  }

  // ===================== COMPLIANCE =====================
  public async getComplianceRecords(mineId?: string): Promise<ComplianceItem[]> {
    if (mineId && mineId !== 'ALL') {
      return complianceAuditRecords.filter(c => c.mineId.toLowerCase() === mineId.toLowerCase());
    }
    return complianceAuditRecords;
  }

  // ===================== ALERTS =====================
  public async getCentralAlerts(filters?: {
    mineId?: string;
    panelId?: string;
    gatewayId?: string;
    severity?: string;
    status?: string;
    search?: string;
  }): Promise<CentralAlert[]> {
    let result: CentralAlert[] = [];
    try {
      const res = await fetch(`${API_BASE}/ml/alerts`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        result = data.map((a: any) => {
           return {
             id: a.id,
             severity: a.severity,
             title: a.title,
             message: a.description,
             mineId: 'MINE-01',
             panelId: 'P-01',
             gatewayId: 'GW-01',
             nodeId: a.nodeId,
             recommendedAction: 'Inspect node immediately based on ML risk scores.',
             timestamp: a.timestamp,
             status: 'active',
             type: 'system'
           } as CentralAlert;
        });
      } else {
        result = [...this.alertsState];
      }
    } catch (e) {
      console.warn("Could not fetch real alerts from backend, falling back to mock", e);
      result = [...this.alertsState];
    }

    if (filters) {
      if (filters.mineId && filters.mineId !== 'all') {
        result = result.filter(a => a.mineId.toLowerCase() === filters.mineId?.toLowerCase());
      }
      if (filters.panelId && filters.panelId !== 'all') {
        result = result.filter(a => a.panelId.toLowerCase() === filters.panelId?.toLowerCase());
      }
      if (filters.gatewayId && filters.gatewayId !== 'all') {
        result = result.filter(a => a.gatewayId.toLowerCase() === filters.gatewayId?.toLowerCase());
      }
      if (filters.severity && filters.severity !== 'all') {
        const sev = filters.severity.toLowerCase();
        result = result.filter(a => a.severity.toLowerCase() === sev);
      }
      if (filters.status && filters.status !== 'all') {
        const st = filters.status.toLowerCase();
        result = result.filter(a => a.status.toLowerCase() === st);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(a => 
          a.title.toLowerCase().includes(q) || 
          a.message.toLowerCase().includes(q) ||
          (a.nodeId || '').toLowerCase().includes(q) ||
          a.panelId.toLowerCase().includes(q)
        );
      }
    }

    return result;
  }

  public async acknowledgeAlert(id: string): Promise<boolean> {
    const alert = this.alertsState.find(a => a.id === id);
    if (alert) {
      alert.status = 'acknowledged';
      return true;
    }
    return false;
  }

  public async resolveAlert(id: string): Promise<boolean> {
    const alert = this.alertsState.find(a => a.id === id);
    if (alert) {
      alert.status = 'resolved';
      return true;
    }
    return false;
  }

  // ===================== TRENDS =====================
  public async getHistoricalTrends(
    timeRange: '24h' | '7d' | '30d' = '24h', 
    mineId?: string, 
    panelId?: string, 
    gatewayId?: string
  ): Promise<TrendMetricPoint[]> {
    let base = centralHistoricalTrends[timeRange] || centralHistoricalTrends['24h'];
    
    if (panelId === 'P-02' || gatewayId === 'GW-03') {
      base = base.map(p => ({
        ...p,
        displacement: parseFloat((p.displacement * 0.25).toFixed(1)),
        tilt: parseFloat((p.tilt * 0.2).toFixed(2)),
        riskScore: Math.round(p.riskScore * 0.3)
      }));
    } else if (panelId === 'P-01' || gatewayId === 'GW-01' || gatewayId === 'GW-02') {
      base = base.map(p => ({
        ...p,
        displacement: parseFloat((p.displacement * 0.55).toFixed(1)),
        tilt: parseFloat((p.tilt * 0.5).toFixed(2)),
        riskScore: Math.round(p.riskScore * 0.7)
      }));
    } else if (mineId === 'MINE-02') {
      base = base.map(p => ({
        ...p,
        displacement: parseFloat((p.displacement * 0.4).toFixed(1)),
        tilt: parseFloat((p.tilt * 0.3).toFixed(2)),
        riskScore: Math.round(p.riskScore * 0.5)
      }));
    }

    return base;
  }

  // ===================== PREDICTED RISK =====================
  public async getPredictedRisk(mineId?: string, panelId?: string): Promise<PredictedRiskData> {
    if (panelId === 'P-02' || panelId === 'P-04' || mineId === 'MINE-02') {
      return {
        currentRisk: 'NORMAL',
        currentScore: 22,
        predictedRisk: 'LOW',
        confidencePercent: 94.2,
        trendDirection: 'STABLE',
        forecastWindowHours: 48,
        recommendedActions: [
          'Routine monitoring on schedule.',
          'Next statutory surface geodetic survey in 14 days.'
        ]
      };
    }
    return centralPredictedRisk;
  }

  // ===================== REPORTS =====================
  public async getReports(mineId?: string, panelId?: string): Promise<ReportItem[]> {
    let list = [...centralReportsList];
    if (mineId && mineId !== 'ALL') {
      list = list.filter(r => !r.mineId || r.mineId === mineId);
    }
    if (panelId && panelId !== 'ALL') {
      list = list.filter(r => !r.panelId || r.panelId === panelId);
    }
    return list;
  }

  public exportReport(reportId: string, format: 'PDF' | 'CSV'): void {
    const report = centralReportsList.find(r => r.id === reportId);
    if (!report) return;

    if (format === 'CSV') {
      const headers = ['ReportID', 'Title', 'Category', 'GeneratedAt', 'Period', 'Summary'];
      const row = [
        `"${report.id}"`,
        `"${report.title}"`,
        `"${report.category}"`,
        `"${report.generatedAt}"`,
        `"${report.period}"`,
        `"${report.summaryText.replace(/"/g, '""')}"`
      ];
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), row.join(',')].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${report.id}_Export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`Exporting ${report.title} (${report.id}) as official signed PDF... Download ready.`);
    }
  }
}

export const centralApiService = new CentralApiService();
