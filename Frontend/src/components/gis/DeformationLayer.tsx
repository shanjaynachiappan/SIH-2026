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
  // BUG FIX: was `0.3 + value/200`, capped at 0.6 -- meant even a
  // near-zero-deformation cell rendered at 30% opacity, and the whole
  // 24x24 grid (576 large squares) painted opaque color across the ENTIRE
  // bounding box regardless of whether that area had any real signal,
  // looking like a solid wall covering the map. Now: near-zero cells are
  // (almost) fully transparent, and max opacity is lower so real node
  // markers/risk zones underneath stay visible.
  if (value < 10) return 0; // don't render "normal" cells at all
  return Math.min(0.35, 0.08 + (value / 250));
};

export const DeformationLayer: React.FC<DeformationLayerProps> = ({ grid, step }) => {
  return (
    <>
      {grid.map((cell, idx) => {
        const opacity = getOpacity(cell.value);
        if (opacity <= 0) return null; // skip rendering near-zero cells entirely

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