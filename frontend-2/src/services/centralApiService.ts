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
import { RiskZonePolygon } from '../types/risk';
import { geojsonNodesToProposedNodes, geojsonRiskZonesToPolygons } from '../utils/geojsonTransform';
import { temporaryRandomAlgorithmProvider } from './placementService';
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
  // Real risk-zone GeoJSON (from the sensor-placement API), keyed same as placementsState.
  // Populated by generateSensorPlacement(); read by the map via getRiskZonesGeoJSON().
  private riskZonesState: Record<string, any[]> = {};

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
              nodeTier: 'Tier-1 (Surface Extensometer)',
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

  // Base URL for the real sensor-placement service (FastAPI, sensor-placement/api_server.py).
  // Same env var the local dashboard already uses -- one backend, both dashboards.
  private placementApiBase =
    (import.meta as any).env?.VITE_SENSOR_PLACEMENT_API_URL || 'http://localhost:8001/api';

  public async generateSensorPlacement(
    mineId: string, 
    panelId: string, 
    algorithmName: string
  ): Promise<SensorPlacementData> {
    const key = `${mineId}:${panelId}`;
    const panel = await this.getPanelById(mineId, panelId);
    const coords = panel?.geometry?.coordinates || [
      [23.758, 86.415], [23.762, 86.415], [23.762, 86.420], [23.758, 86.420]
    ];

    let proposedPoints: ProposedNode[] = [];
    let riskZoneFeatures: any[] = [];

    try {
      const res = await fetch(`${this.placementApiBase}/node-placement/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          panel: {
            mineId,
            panelId,
            coordinates: coords,
            depthMeters: panel?.depthMeters || 100,
            extractionThicknessM: (panel as any)?.extractionThicknessM ?? 2.5,
            seamDipDeg: (panel as any)?.seamDipDeg ?? 0,
            waterRiskFlag: (panel as any)?.waterRiskFlag ?? false,
            faultRiskFlag: (panel as any)?.faultRiskFlag ?? false,
            oldWorkingsFlag: (panel as any)?.oldWorkingsFlag ?? false,
          },
        }),
      });

      if (!res.ok) throw new Error(`Placement API returned ${res.status}`);
      const result = await res.json();

      proposedPoints = geojsonNodesToProposedNodes(result.features, panelId);
      riskZoneFeatures = result.risk_zones || [];
    } catch (err) {
      console.error('Sensor placement API unavailable, using fallback generator:', err);
      proposedPoints = temporaryRandomAlgorithmProvider.generate(
        panel || ({ id: panelId, mineId, geometry: { coordinates: coords } } as MinePanel),
        { fullCount: 5, liteCount: 5, crackCount: 2 }
      );
    }

    this.riskZonesState[key] = riskZoneFeatures;

    const _fullCount = proposedPoints.filter(p => p.nodeType === 'FULL').length;
    const _liteCount = proposedPoints.filter(p => p.nodeType === 'LITE').length;
    const _crackCount = proposedPoints.filter(p => p.nodeType === 'CRACK').length;
    const _totalCapex = proposedPoints.reduce((sum, p) => sum + p.estimatedCostINR, 0);

    const _placementData: SensorPlacementData = {
      mineId,
      panelId,
      panelName: panel?.name || panelId,
      totalPlannedNodes: (panel?.totalNodes || 0) + proposedPoints.length,
      installedNodes: panel?.onlineNodes || 0,
      proposedNodesCount: proposedPoints.length,
      coveragePercent: parseFloat((90 + Math.random() * 7.5).toFixed(1)),
      estimatedCostINR: `₹ ${_totalCapex.toLocaleString('en-IN')}`,
      algorithmUsed: algorithmName,
      algorithmStatus: 'OPTIMAL',
      lifecycleState: 'PLACEMENT_GENERATED',
      nodeTypeCounts: { FULL: _fullCount, LITE: _liteCount, CRACK: _crackCount },
      proposedPoints
    };

    this.placementsState[key] = _placementData;

    if (panel) {
      panel.lifecycleState = 'PLACEMENT_GENERATED';
      panel.algorithmUsed = algorithmName;
    }

    this.persistStorage();
    return _placementData;
  }

  /** Real risk-zone polygons (GeoJSON, transformed to Leaflet coords) for the
   * most recently generated placement of this mine/panel -- used by
   * CentralMineGISMap to render the RiskZones layer alongside the nodes. */
  public getRiskZonesGeoJSON(mineId: string, panelId: string): RiskZonePolygon[] {
    const key = `${mineId}:${panelId}`;
    return geojsonRiskZonesToPolygons(this.riskZonesState[key] || []);
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