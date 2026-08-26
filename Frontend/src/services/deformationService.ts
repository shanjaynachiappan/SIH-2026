import { MonitoringNode } from '../types';

export interface GridCell {
  latitude: number;
  longitude: number;
  value: number; // deformation in mm
}

export function calculateIDW(
  nodes: MonitoringNode[],
  bounds: [number, number, number, number], // [minLng, minLat, maxLng, maxLat]
  gridResolution: number,
  power: number = 2
): GridCell[] {
  const [minLng, minLat, maxLng, maxLat] = bounds;
  const latRange = maxLat - minLat;
  const lngRange = maxLng - minLng;

  const maxRange = Math.max(latRange, lngRange);
  const step = maxRange / gridResolution;

  const validNodes = nodes.filter(n => n.riskScore !== undefined);
  const grid: GridCell[] = [];

  for (let lat = minLat; lat <= maxLat; lat += step) {
    for (let lng = minLng; lng <= maxLng; lng += step) {
      let numerator = 0;
      let denominator = 0;
      let exactMatch = false;
      let exactValue = 0;

      for (const n of validNodes) {
        const dist = Math.sqrt(Math.pow(n.latitude - lat, 2) + Math.pow(n.longitude - lng, 2));
        if (dist === 0) {
          exactMatch = true;
          exactValue = n.riskScore!;
          break;
        }
        const weight = 1 / Math.pow(dist, power);
        numerator += weight * n.riskScore!;
        denominator += weight;
      }

      const value = exactMatch ? exactValue : (denominator > 0 ? numerator / denominator : 0);
      grid.push({ latitude: lat, longitude: lng, value });
    }
  }

  return grid;
}
