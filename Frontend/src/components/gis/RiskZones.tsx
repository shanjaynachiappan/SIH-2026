import React from 'react';
import { Polygon } from 'react-leaflet';
import { RiskZonePolygon, RiskCategory } from '../../types/risk';

interface RiskZonesProps {
  zones: RiskZonePolygon[];
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'CRITICAL': return '#ef4444'; // red
    case 'WARNING':
    case 'HIGH': return '#f97316'; // orange
    case 'MODERATE': return '#eab308'; // yellow
    case 'NORMAL':
    case 'LOW': return '#22c55e'; // green
    default: return '#3b82f6';
  }
};

export const RiskZones: React.FC<RiskZonesProps> = ({ zones }) => {
  return (
    <>
      {zones.map((zone, idx) => (
        <Polygon
          key={`zone-${idx}`}
          positions={zone.coordinates[0]} 
          pathOptions={{
            color: getCategoryColor(zone.category),
            weight: 2,
            fillOpacity: 0.1, 
            fillColor: getCategoryColor(zone.category),
            dashArray: '5, 5',
            interactive: false
          }}
        />
      ))}
    </>
  );
};
