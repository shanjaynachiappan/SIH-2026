/**
 * Transforms the real sensor-placement API's GeoJSON output into the
 * frontend's existing type shapes (ProposedNode[], RiskZonePolygon[]).
 * Keeps centralApiService.ts thin -- one place to adjust if the API's
 * property names ever change.
 */
import { ProposedNode } from '../types/central';
import { RiskZonePolygon, RiskCategory } from '../types/risk';

const TIER_LABELS: Record<string, ProposedNode['nodeTier']> = {
  Full: 'Tier-3 (In-Seam Multi-Param)',
  Lite: 'Tier-1 (Surface Extensometer)',
  Crack: 'Tier-2 (Sub-Surface MPBX)',
};

const TIER_COST: Record<string, number> = {
  Full: 35000,
  Lite: 15000,
  Crack: 25000,
};

const TIER_PURPOSE: Record<string, string> = {
  Full: 'Goaf edge multi-parameter subsidence hub (tilt+vibration+displacement+crack)',
  Lite: 'Wide-coverage tilt+vibration early-warning node',
  Crack: 'Tensile-strain zone crack initiation sensor',
};

function riskLevelToPriority(riskLevel?: string): ProposedNode['priority'] {
  if (riskLevel === 'High') return 'HIGH';
  if (riskLevel === 'Medium') return 'MEDIUM';
  return 'LOW';
}

/** GeoJSON node-placement features -> ProposedNode[] for the central UI table/KPIs. */
export function geojsonNodesToProposedNodes(
  features: any[],
  panelId: string
): ProposedNode[] {
  return (features || []).map((f, idx) => {
    const props = f.properties || {};
    const [lon, lat] = f.geometry.coordinates;
    const tier: string = props.node_tier || 'Lite';
    return {
      id: props.node_id || `${panelId}-N${(idx + 1).toString().padStart(3, '0')}`,
      nodeTier: TIER_LABELS[tier] || TIER_LABELS.Lite,
      nodeType: (tier.toUpperCase() as 'FULL' | 'LITE' | 'CRACK'),
      latitude: lat,
      longitude: lon,
      confidence:
        props.confidence_tier === 'High' ? 0.92 :
        props.confidence_tier === 'Medium' ? 0.75 : 0.55,
      priority: riskLevelToPriority(props.risk_level),
      purpose: TIER_PURPOSE[tier] || TIER_PURPOSE.Lite,
      estimatedCostINR: TIER_COST[tier] || TIER_COST.Lite,
    };
  });
}

/** GeoJSON risk-zone polygon features -> RiskZonePolygon[] for the map's
 * RiskZones layer. Converts GeoJSON [lng,lat] ring coordinates to the
 * [lat,lng] pairs react-leaflet's <Polygon> expects. Handles both Polygon
 * and MultiPolygon geometries (zone_polygons.js can emit either). */
export function geojsonRiskZonesToPolygons(features: any[]): RiskZonePolygon[] {
  const zones: RiskZonePolygon[] = [];

  (features || []).forEach((f, idx) => {
    const props = f.properties || {};
    const category = (props.risk_level?.toUpperCase() || 'LOW') as RiskCategory;
    const geom = f.geometry;

    const ringsToLatLng = (rings: number[][][]) =>
      rings.map((ring) => ring.map(([lng, lat]) => [lat, lng] as [number, number]));

    if (geom.type === 'Polygon') {
      zones.push({
        id: `zone-${idx}`,
        category,
        coordinates: ringsToLatLng(geom.coordinates),
        maxDeformation: props.point_count,
      });
    } else if (geom.type === 'MultiPolygon') {
      geom.coordinates.forEach((polyCoords: number[][][], pIdx: number) => {
        zones.push({
          id: `zone-${idx}-${pIdx}`,
          category,
          coordinates: ringsToLatLng(polyCoords),
          maxDeformation: props.point_count,
        });
      });
    }
  });

  return zones;
}