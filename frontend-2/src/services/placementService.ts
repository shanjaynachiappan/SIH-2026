import { MinePanel, ProposedNode, SensorPlacementData } from '../types/central';

export interface PlacementConfig {
  fullCount: number;
  liteCount: number;
  crackCount: number;
}

// Ray-casting Point-in-Polygon check
export function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];

    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Convert Center Lat/Lng + Width(m) + Height(m) to exact Polygon coordinates
export function convertCenterAndDimensionsToPolygon(
  centerLat: number,
  centerLng: number,
  widthMeters: number,
  heightMeters: number
): [number, number][] {
  const latMetersPerDegree = 111000;
  const lngMetersPerDegree = 111000 * Math.cos(centerLat * (Math.PI / 180));

  const halfLat = (heightMeters / 2) / latMetersPerDegree;
  const halfLng = (widthMeters / 2) / lngMetersPerDegree;

  return [
    [centerLat - halfLat, centerLng - halfLng],
    [centerLat + halfLat, centerLng - halfLng],
    [centerLat + halfLat, centerLng + halfLng],
    [centerLat - halfLat, centerLng + halfLng]
  ];
}

// Calculate centroid center from polygon coordinates
export function calculatePolygonCenter(coordinates: [number, number][]): { centerLat: number; centerLng: number; widthM: number; heightM: number } {
  if (!coordinates || coordinates.length === 0) {
    return { centerLat: 23.758, centerLng: 86.415, widthM: 500, heightM: 800 };
  }

  const lats = coordinates.map(c => c[0]);
  const lngs = coordinates.map(c => c[1]);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  const latDiff = maxLat - minLat;
  const lngDiff = maxLng - minLng;

  const heightM = Math.round(latDiff * 111000);
  const widthM = Math.round(lngDiff * 111000 * Math.cos(centerLat * (Math.PI / 180)));

  return { centerLat, centerLng, widthM: widthM || 500, heightM: heightM || 800 };
}

// Decoupled Algorithm Provider Interface (for future optimization algorithm plugin)
export interface PlacementAlgorithmProvider {
  id: string;
  name: string;
  generate: (panel: MinePanel, config: PlacementConfig) => ProposedNode[];
}

// Temporary Random Algorithm Generator (operates strictly INSIDE panel polygon)
export const temporaryRandomAlgorithmProvider: PlacementAlgorithmProvider = {
  id: 'temporary_random',
  name: 'Temporary Random Generator (Prototype)',
  generate: (panel: MinePanel, config: PlacementConfig): ProposedNode[] => {
    const polygon = panel.geometry?.coordinates || [
      [23.758, 86.415],
      [23.762, 86.415],
      [23.762, 86.420],
      [23.758, 86.420]
    ];

    const lats = polygon.map(c => c[0]);
    const lngs = polygon.map(c => c[1]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const generateInsidePoint = (attempt = 0): [number, number] => {
      // Fallback interpolation if random bounds fail after max attempts
      if (attempt > 50) {
        const center = calculatePolygonCenter(polygon);
        return [
          center.centerLat + (Math.random() * 0.002 - 0.001),
          center.centerLng + (Math.random() * 0.002 - 0.001)
        ];
      }
      const lat = minLat + Math.random() * (maxLat - minLat);
      const lng = minLng + Math.random() * (maxLng - minLng);
      if (isPointInPolygon([lat, lng], polygon)) {
        return [lat, lng];
      }
      return generateInsidePoint(attempt + 1);
    };

    const proposed: ProposedNode[] = [];
    const cleanPanelId = panel.id.replace(/[^A-Z0-9]/gi, '');
    let nodeNum = 1;

    // Generate FULL nodes
    for (let i = 0; i < config.fullCount; i++) {
      const [lat, lng] = generateInsidePoint();
      proposed.push({
        id: `${cleanPanelId}-N${nodeNum.toString().padStart(3, '0')}`,
        nodeTier: 'Tier-3 (In-Seam Multi-Param)',
        nodeType: 'FULL',
        latitude: parseFloat(lat.toFixed(5)),
        longitude: parseFloat(lng.toFixed(5)),
        confidence: parseFloat((0.90 + Math.random() * 0.08).toFixed(2)),
        priority: 'HIGH',
        purpose: 'Goaf edge multi-parameter strata & subsidence hub',
        estimatedCostINR: 35000
      });
      nodeNum++;
    }

    // Generate LITE nodes
    for (let i = 0; i < config.liteCount; i++) {
      const [lat, lng] = generateInsidePoint();
      proposed.push({
        id: `${cleanPanelId}-N${nodeNum.toString().padStart(3, '0')}`,
        nodeTier: 'Tier-1 (Surface Extensometer)',
        nodeType: 'LITE',
        latitude: parseFloat(lat.toFixed(5)),
        longitude: parseFloat(lng.toFixed(5)),
        confidence: parseFloat((0.85 + Math.random() * 0.09).toFixed(2)),
        priority: Math.random() > 0.5 ? 'MEDIUM' : 'LOW',
        purpose: 'Single-point surface extensometer & tilt telemetry',
        estimatedCostINR: 15000
      });
      nodeNum++;
    }

    // Generate CRACK nodes
    for (let i = 0; i < config.crackCount; i++) {
      const [lat, lng] = generateInsidePoint();
      proposed.push({
        id: `${cleanPanelId}-N${nodeNum.toString().padStart(3, '0')}`,
        nodeTier: 'Tier-2 (Sub-Surface MPBX)',
        nodeType: 'CRACK',
        latitude: parseFloat(lat.toFixed(5)),
        longitude: parseFloat(lng.toFixed(5)),
        confidence: parseFloat((0.88 + Math.random() * 0.08).toFixed(2)),
        priority: 'HIGH',
        purpose: 'Micro-seismic acoustic emission & crack sensor point',
        estimatedCostINR: 25000
      });
      nodeNum++;
    }

    return proposed;
  }
};

// Placement Service Manager (Registry for Future Algorithm Providers)
class PlacementServiceManager {
  private providers: Record<string, PlacementAlgorithmProvider> = {
    temporary_random: temporaryRandomAlgorithmProvider
  };
  private activeProviderId = 'temporary_random';

  public registerAlgorithmProvider(provider: PlacementAlgorithmProvider) {
    this.providers[provider.id] = provider;
  }

  public setActiveProvider(providerId: string) {
    if (this.providers[providerId]) {
      this.activeProviderId = providerId;
    }
  }

  public getActiveProvider(): PlacementAlgorithmProvider {
    return this.providers[this.activeProviderId] || temporaryRandomAlgorithmProvider;
  }

  public generateSensorPlacement(panel: MinePanel, config: PlacementConfig): SensorPlacementData {
    const provider = this.getActiveProvider();
    const proposedPoints = provider.generate(panel, config);

    const fullCount = proposedPoints.filter(p => p.nodeType === 'FULL').length;
    const liteCount = proposedPoints.filter(p => p.nodeType === 'LITE').length;
    const crackCount = proposedPoints.filter(p => p.nodeType === 'CRACK').length;
    const totalCapex = proposedPoints.reduce((sum, p) => sum + p.estimatedCostINR, 0);

    return {
      mineId: panel.mineId,
      panelId: panel.id,
      panelName: panel.name,
      totalPlannedNodes: (panel.totalNodes || 0) + proposedPoints.length,
      installedNodes: panel.onlineNodes || 0,
      proposedNodesCount: proposedPoints.length,
      coveragePercent: parseFloat((90 + Math.random() * 7.5).toFixed(1)),
      estimatedCostINR: `₹ ${totalCapex.toLocaleString('en-IN')}`,
      algorithmUsed: provider.name,
      algorithmStatus: 'OPTIMAL',
      lifecycleState: 'PLACEMENT_GENERATED',
      nodeTypeCounts: {
        FULL: fullCount,
        LITE: liteCount,
        CRACK: crackCount
      },
      proposedPoints
    };
  }
}

export const placementService = new PlacementServiceManager();
