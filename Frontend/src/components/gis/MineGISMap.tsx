import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MonitoringNode } from '../../types';
import { mockMinePanel } from '../../data/mockMineData';
import { generateNodeLocations } from '../../services/nodePlacementService';
import { initializeMockNodes, updateNodeReading } from '../../services/mockNodeService';
import { calculateIDW, GridCell } from '../../services/deformationService';
import { generateRiskZones } from '../../services/riskZoneService';
import { RiskZonePolygon } from '../../types/risk';
import { NodeMarkers } from './NodeMarkers';
import { DeformationLayer } from './DeformationLayer';
import { RiskZones } from './RiskZones';
import { MapLegend } from './MapLegend';
import { mineGuardContext } from '../../services/mineGuardContext';

interface MineGISMapProps {
  nodeCount?: number;
  isSimulating?: boolean;
}

const MapRecenter = ({ bounds }: { bounds: [number, number][][] }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds[0] && bounds[0].length > 0) {
      map.fitBounds(bounds[0] as any);
    }
  }, [map, bounds]);
  return null;
};

export const MineGISMap: React.FC<MineGISMapProps> = ({ nodeCount = 20, isSimulating = false }) => {
  const [nodes, setNodes] = useState<MonitoringNode[]>([]);
  const [deformationGrid, setDeformationGrid] = useState<GridCell[]>([]);
  const [riskZones, setRiskZones] = useState<RiskZonePolygon[]>([]);

  useEffect(() => {
    const locations = generateNodeLocations(mockMinePanel, nodeCount);
    const initialNodes = initializeMockNodes(locations);
    setNodes(initialNodes);
  }, [nodeCount]);

  useEffect(() => {
    if (!isSimulating || nodes.length === 0) return;

    const interval = setInterval(() => {
      setNodes(prev => prev.map(n => updateNodeReading(n)));
    }, 5000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  useEffect(() => {
    if (nodes.length === 0) return;
    
    const gridBounds: [number, number, number, number] = [86.405, 23.745, 86.430, 23.770];
    const gridResolution = 20; 
    const step = (gridBounds[2] - gridBounds[0]) / gridResolution;
    
    const newGrid = calculateIDW(nodes, gridBounds, gridResolution, 2);
    setDeformationGrid(newGrid);
    
    const newZones = generateRiskZones(newGrid, step);
    setRiskZones(newZones);
    
  }, [nodes]);

  // Sync state to global context for AI Assistant
  useEffect(() => {
    mineGuardContext.updateState({
      nodes,
      deformationGrid,
      riskZones,
      isSimulating
    });
  }, [nodes, deformationGrid, riskZones, isSimulating]);

  const panelCoords = useMemo(() => {
    return mockMinePanel.geometry.coordinates.map(ring => 
      ring.map(coord => [coord[1], coord[0]] as [number, number])
    );
  }, []);

  return (
    <div className="w-full h-full relative">
      <MapContainer 
        center={[23.758, 86.415]} 
        zoom={14} 
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; Esri'
          maxZoom={19}
        />
        <ZoomControl position="topleft" />
        <MapRecenter bounds={panelCoords} />

        <Polygon 
          positions={panelCoords} 
          pathOptions={{ 
            color: '#ffffff', 
            weight: 2, 
            fillColor: 'transparent',
            dashArray: '5, 5'
          }} 
        />

        <RiskZones zones={riskZones} />
        <DeformationLayer grid={deformationGrid} step={(86.430 - 86.405) / 20} />
        <NodeMarkers nodes={nodes} />
      </MapContainer>
      <MapLegend />
    </div>
  );
};
