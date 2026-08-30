export type RiskCategory = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

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
