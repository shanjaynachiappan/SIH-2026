import { bbox, pointGrid, booleanPointInPolygon } from '@turf/turf';
import { MinePanelFeature } from '../types/gis';
import { MonitoringNode } from '../types';

export function generateNodeLocations(
  panelFeature: MinePanelFeature,
  targetCount: number
): MonitoringNode[] {
  const bounds = bbox(panelFeature);

  let cellSide = 0.5; // kilometers
  let gridPoints = pointGrid(bounds, cellSide, { units: 'kilometers' });
  let insidePoints = gridPoints.features.filter(f => booleanPointInPolygon(f, panelFeature));

  let maxAttempts = 15;
  while (insidePoints.length < targetCount && maxAttempts > 0) {
    cellSide /= 1.5;
    gridPoints = pointGrid(bounds, cellSide, { units: 'kilometers' });
    insidePoints = gridPoints.features.filter(f => booleanPointInPolygon(f, panelFeature));
    maxAttempts--;
  }

  // Sample points evenly to reach targetCount
  const step = Math.max(1, Math.floor(insidePoints.length / targetCount));
  const selectedPoints: any[] = [];
  for (let i = 0; i < targetCount && i * step < insidePoints.length; i++) {
    selectedPoints.push(insidePoints[i * step]);
  }

  while (selectedPoints.length < targetCount && selectedPoints.length < insidePoints.length) {
    const p = insidePoints.find(p => !selectedPoints.includes(p));
    if (p) selectedPoints.push(p);
  }

  return selectedPoints.map((p, idx) => {
    const coords = p.geometry.coordinates; // [lng, lat]
    return {
      id: `N${(idx + 1).toString().padStart(2, '0')}`,
      latitude: coords[1],
      longitude: coords[0],
      tilt: 0,
      displacement: 0,
      vibration: 0,
      battery: 100,
      status: 'normal',
      lastUpdated: new Date().toISOString()
    };
  });
}
