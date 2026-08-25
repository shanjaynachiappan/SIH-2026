import { GridCell } from './deformationService';
import { RiskZonePolygon, RiskCategory } from '../types/risk';

export function generateRiskZones(
  deformationGrid: GridCell[],
  step: number
): RiskZonePolygon[] {
  const zones: RiskZonePolygon[] = [];
  
  for (const cell of deformationGrid) {
    let category: RiskCategory = 'LOW';
    if (cell.value > 40) category = 'CRITICAL';
    else if (cell.value > 25) category = 'HIGH';
    else if (cell.value > 10) category = 'MODERATE';
    else continue; // don't draw polygons for low risk to keep map clean
    
    const halfStep = step / 2;
    // Leaflet expects [lat, lng]
    const coords: [number, number][][] = [[
      [cell.latitude - halfStep, cell.longitude - halfStep],
      [cell.latitude + halfStep, cell.longitude - halfStep],
      [cell.latitude + halfStep, cell.longitude + halfStep],
      [cell.latitude - halfStep, cell.longitude + halfStep],
      [cell.latitude - halfStep, cell.longitude - halfStep]
    ]];
    
    zones.push({ category, coordinates: coords });
  }
  
  return zones;
}
