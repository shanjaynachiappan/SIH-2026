export type RiskCategory = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'WARNING' | 'NORMAL';

export interface RiskScore {
  riskScore: number;
  riskLevel: RiskCategory;
  confidence: number;
}

export interface RiskZonePolygon {
  id?: string;
  name?: string;
  category: RiskCategory;
  coordinates: [number, number][][];
  maxDeformation?: number;
}
