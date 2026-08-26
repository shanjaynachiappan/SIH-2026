export type RiskCategory = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface RiskScore {
  riskScore: number;
  riskLevel: RiskCategory;
  confidence: number;
}

export interface RiskZonePolygon {
  category: RiskCategory;
  coordinates: [number, number][][];
}
