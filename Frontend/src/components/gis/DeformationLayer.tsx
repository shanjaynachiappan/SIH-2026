import React from 'react';
import { Polygon } from 'react-leaflet';
import { GridCell } from '../../services/deformationService';

interface DeformationLayerProps {
  grid: GridCell[];
  step: number;
}

const getDeformationColor = (value: number) => {
  if (value >= 80) return '#ef4444'; // red (critical)
  if (value >= 60) return '#f97316'; // orange (high)
  if (value >= 30) return '#eab308'; // yellow (moderate)
  return '#22c55e'; // green (low/normal)
};

const getOpacity = (value: number) => {
  return Math.min(0.6, 0.3 + (value / 200));
};

export const DeformationLayer: React.FC<DeformationLayerProps> = ({ grid, step }) => {
  return (
    <>
      {grid.map((cell, idx) => {
        const opacity = getOpacity(cell.value);
        
        const halfStep = step / 2;
        const positions: [number, number][] = [
          [cell.latitude - halfStep, cell.longitude - halfStep],
          [cell.latitude + halfStep, cell.longitude - halfStep],
          [cell.latitude + halfStep, cell.longitude + halfStep],
          [cell.latitude - halfStep, cell.longitude + halfStep],
        ];

        return (
          <Polygon
            key={`def-${idx}`}
            positions={positions}
            pathOptions={{
              stroke: true,
              color: getDeformationColor(cell.value),
              weight: 1,
              fillColor: getDeformationColor(cell.value),
              fillOpacity: opacity,
              interactive: false
            }}
          />
        );
      })}
    </>
  );
};
