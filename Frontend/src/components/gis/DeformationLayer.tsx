import React from 'react';
import { Polygon } from 'react-leaflet';
import { GridCell } from '../../services/deformationService';

interface DeformationLayerProps {
  grid: GridCell[];
  step: number;
}

const getDeformationColor = (value: number) => {
  if (value > 35) return '#ef4444'; // red
  if (value > 20) return '#f97316'; // orange
  if (value > 10) return '#eab308'; // yellow
  return '#22c55e'; // green
};

const getOpacity = (value: number) => {
  if (value < 2) return 0; // hide very low deformation
  return Math.min(0.6, 0.15 + (value / 80));
};

export const DeformationLayer: React.FC<DeformationLayerProps> = ({ grid, step }) => {
  return (
    <>
      {grid.map((cell, idx) => {
        const opacity = getOpacity(cell.value);
        if (opacity === 0) return null;
        
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
              stroke: false,
              fillColor: getDeformationColor(cell.value),
              fillOpacity: opacity,
            }}
          />
        );
      })}
    </>
  );
};
