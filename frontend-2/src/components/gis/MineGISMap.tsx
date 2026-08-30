import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MonitoringNode } from '../../types';
import { calculateIDW, GridCell } from '../../services/deformationService';
import { RiskZonePolygon } from '../../types/risk';
import { mockMinePanel } from '../../data/mockMineData';
import { fetchLiveNodes, fetchLiveZones, fetchNodePlacement } from '../../services/apiService';
import { GeoJSON } from 'react-leaflet';
import { NodeMarkers } from './NodeMarkers';
import { DeformationLayer } from './DeformationLayer';
import { RiskZones } from './RiskZones';
import { MapLegend } from './MapLegend';
import { mineGuardContext } from '../../services/mineGuardContext';

interface MineGISMapProps {
  nodeCount?: number;
  isSimulating?: boolean;
}

const MapRecenter = ({ bounds }: { bounds: [number, number][] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length === 2) {
      map.fitBounds(bounds as any);
    }
  }, [map, bounds]);
  return null;
};

export const MineGISMap: React.FC<MineGISMapProps> = ({ isSimulating = false }) => {
  const [nodes, setNodes] = useState<MonitoringNode[]>([]);
  const [deformationGrid, setDeformationGrid] = useState<GridCell[]>([]);
  const [riskZones, setRiskZones] = useState<RiskZonePolygon[]>([]);
  const [geojsonData, setGeojsonData] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchNodes = async () => {
      const liveNodes = await fetchLiveNodes();
      const liveZones = await fetchLiveZones();
      if (isMounted) {
        if (liveNodes.length > 0) setNodes(liveNodes);
        if (liveZones.length > 0) setRiskZones(liveZones);
        
        // Fetch placement data to render real panel and influence zone
        const placement = await fetchNodePlacement();
        if (placement) setGeojsonData(placement);
      }
    };

    fetchNodes();
    const interval = setInterval(fetchNodes, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isSimulating]);

  useEffect(() => {
    if (nodes.length === 0) return;

    const gridBounds: [number, number, number, number] = [86.405, 23.745, 86.430, 23.770];
    const gridResolution = 20;

    const newGrid = calculateIDW(nodes, gridBounds, gridResolution, 2);
    setDeformationGrid(newGrid);

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
    if (geojsonData?.panel_geometry?.coordinates) {
      return geojsonData.panel_geometry.coordinates.map((ring: any) =>
        ring.map((coord: any) => [coord[1], coord[0]] as [number, number])
      );
    }
    return mockMinePanel.geometry.coordinates.map(ring =>
      ring.map(coord => [coord[1], coord[0]] as [number, number])
    );
  }, [geojsonData]);

  const mapBounds = useMemo(() => {
    if (nodes.length === 0 && riskZones.length === 0) return null;
    const lats: number[] = [];
    const lngs: number[] = [];

    nodes.forEach(n => {
      if (n.latitude && n.longitude) {
        lats.push(n.latitude);
        lngs.push(n.longitude);
      }
    });

    riskZones.forEach(z => {
      if (z.coordinates && z.coordinates[0]) {
        z.coordinates[0].forEach(coord => {
          lats.push(coord[0]);
          lngs.push(coord[1]);
        });
      }
    });

    if (lats.length === 0) return null;

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const padLat = (maxLat - minLat) * 0.1 || 0.01;
    const padLng = (maxLng - minLng) * 0.1 || 0.01;

    return [
      [minLat - padLat, minLng - padLng] as [number, number],
      [maxLat + padLat, maxLng + padLng] as [number, number]
    ];
  }, [nodes, riskZones]);

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
        <MapRecenter bounds={mapBounds} />

        <Polygon
          positions={panelCoords}
          pathOptions={{
            color: '#ffffff',
            weight: 2,
            fillColor: 'transparent',
            dashArray: '5, 5',
            interactive: false
          }}
        />

        {geojsonData?.influence_zone && (
          <GeoJSON 
            data={geojsonData.influence_zone} 
            style={{
              color: '#0ea5e9',
              weight: 1,
              fillColor: '#0ea5e9',
              fillOpacity: 0.05,
              dashArray: '4, 4'
            }}
          />
        )}

        <RiskZones zones={riskZones} />
        <DeformationLayer grid={deformationGrid} step={(86.430 - 86.405) / 20} />
        <NodeMarkers nodes={nodes} />
      </MapContainer>
      <MapLegend />
    </div>
  );
};
