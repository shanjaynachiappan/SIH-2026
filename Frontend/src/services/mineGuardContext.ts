import { MonitoringNode } from '../types';
import { RiskZonePolygon } from '../types/risk';
import { GridCell } from './deformationService';

interface AppState {
  nodes: MonitoringNode[];
  deformationGrid: GridCell[];
  riskZones: RiskZonePolygon[];
  isSimulating: boolean;
  panelId: string;
}

class MineGuardContextBuilder {
  private currentState: AppState = {
    nodes: [],
    deformationGrid: [],
    riskZones: [],
    isSimulating: false,
    panelId: 'Panel A'
  };

  public updateState(partialState: Partial<AppState>) {
    this.currentState = { ...this.currentState, ...partialState };
  }

  public getContextSnapshot(): string {
    const { nodes, riskZones, isSimulating, panelId } = this.currentState;

    // Summarize nodes
    const onlineNodes = nodes.filter(n => n.status !== 'offline');
    const offlineNodes = nodes.filter(n => n.status === 'offline');
    const highRiskNodes = nodes.filter(n => n.status === 'high' || n.status === 'critical');
    
    // Find max deformation
    let maxDeformation = 0;
    const validDispNodes = nodes.filter(n => n.displacement !== undefined);
    if (validDispNodes.length > 0) {
      maxDeformation = Math.max(...validDispNodes.map(n => n.displacement!));
    }

    const nodeSummary = nodes.map(n => ({
      id: n.id,
      status: n.status,
      displacement: n.displacement,
      tilt: n.tilt,
      vibration: n.vibration,
      battery: n.battery,
      riskScore: n.riskScore,
    }));

    const zoneSummary = riskZones.map((z, idx) => ({
      id: `zone-${idx}`,
      riskLevel: z.category,
    }));

    // Mock an alert derived from critical nodes
    const alerts = highRiskNodes.map(n => ({
      alertId: `ALT-${n.id}-${Date.now()}`,
      severity: n.status,
      nodeId: n.id,
      description: `Node ${n.id} is showing ${n.status} risk level with displacement of ${n.displacement !== undefined ? n.displacement : 'N/A'}mm.`,
      timestamp: new Date().toISOString()
    }));

    const contextObject = {
      systemHealth: {
        isSimulating,
        totalNodes: nodes.length,
        onlineCount: onlineNodes.length,
        offlineCount: offlineNodes.length,
      },
      panelInfo: {
        panelId,
        maxDeformation,
        criticalZonesCount: riskZones.filter(z => z.category === 'CRITICAL').length,
        highZonesCount: riskZones.filter(z => z.category === 'HIGH').length,
      },
      alerts,
      riskZones: zoneSummary,
      nodes: nodeSummary
    };

    return JSON.stringify(contextObject, null, 2);
  }

  public getRawState(): AppState {
    return this.currentState;
  }
}

export const mineGuardContext = new MineGuardContextBuilder();
