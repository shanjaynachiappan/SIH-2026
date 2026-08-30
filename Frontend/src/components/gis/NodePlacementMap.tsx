import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, CircleMarker, Tooltip, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { mockMinePanel } from '../../data/mockMineData';

interface NodePlacementMapProps {
  geojsonData: any;
  layerControls: {
    panelBoundary: boolean;
    influenceZone: boolean;
    riskZones: boolean;
    fullSensors: boolean;
    crackSensors: boolean;
    liteSensors: boolean;
  };
  selectedRisk: string;
  searchQuery: string;
  onNodeSelect: (node: any) => void;
  selectedNode: any;
  previewPanelCoords: [number, number][] | null;
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

export const NodePlacementMap: React.FC<NodePlacementMapProps> = ({ 
  geojsonData, 
  layerControls, 
  selectedRisk, 
  searchQuery,
  onNodeSelect,
  selectedNode,
  previewPanelCoords
}) => {
  
  const panelCoords = useMemo(() => {
    if (previewPanelCoords) {
       return [previewPanelCoords];
    }
    return mockMinePanel.geometry.coordinates.map((ring: any) =>
      ring.map((coord: any) => [coord[1], coord[0]] as [number, number])
    );
  }, [previewPanelCoords]);

  const filteredFeatures = useMemo(() => {
    if (!geojsonData || !geojsonData.features) return [];
    
    return geojsonData.features.filter((f: any, idx: number) => {
      const p = f.properties;
      
      if (!layerControls.fullSensors && p.node_tier === 'Full') return false;
      if (!layerControls.crackSensors && p.node_tier === 'Crack') return false;
      if (!layerControls.liteSensors && p.node_tier === 'Lite') return false;
      if (selectedRisk !== 'All' && p.risk_level !== selectedRisk) return false;
      
      if (searchQuery) {
        const id = p.id || `N-${idx.toString().padStart(3, '0')}`;
        if (!id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      }
      return true;
    });
  }, [geojsonData, layerControls, selectedRisk, searchQuery]);

  const mapBounds = useMemo(() => {
    // If we have a preview panel but no generated features yet (or cleared), fit to panel
    if (filteredFeatures.length === 0 && previewPanelCoords) {
      const lats = previewPanelCoords.map(c => c[0]);
      const lngs = previewPanelCoords.map(c => c[1]);
      
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      const padLat = (maxLat - minLat) * 0.2 || 0.01;
      const padLng = (maxLng - minLng) * 0.2 || 0.01;
      
      return [
        [minLat - padLat, minLng - padLng] as [number, number],
        [maxLat + padLat, maxLng + padLng] as [number, number]
      ];
    }

    if (filteredFeatures.length === 0) return null;
    const lats: number[] = [];
    const lngs: number[] = [];

    filteredFeatures.forEach((f: any) => {
      lngs.push(f.geometry.coordinates[0]);
      lats.push(f.geometry.coordinates[1]);
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
  }, [filteredFeatures, previewPanelCoords]);

  const getColor = (tier: string) => {
    switch (tier) {
      case 'Full': return '#3b82f6'; // blue-500
      case 'Lite': return '#10b981'; // emerald-500
      case 'Crack': return '#f59e0b'; // amber-500
      default: return '#64748b';
    }
  };

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden border border-slate-200">
      <MapContainer
        center={[23.758, 86.415]}
        zoom={14}
        zoomControl={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; Esri'
          maxZoom={19}
        />
        <MapRecenter bounds={mapBounds} />

        {layerControls.panelBoundary && (
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
        )}

        {layerControls.influenceZone && geojsonData?.influence_zone && (
          <GeoJSON 
            data={geojsonData.influence_zone} 
            style={{
              color: '#0ea5e9', // cyan-500
              weight: 1,
              fillColor: '#0ea5e9',
              fillOpacity: 0.05,
              dashArray: '4',
            }}
          />
        )}

        {layerControls.riskZones && geojsonData?.risk_zones && (
          <GeoJSON 
            data={geojsonData.risk_zones} 
            style={(feature) => {
              const risk = feature?.properties?.risk_level;
              let color = '#3b82f6';
              if (risk === 'High') color = '#ef4444';
              else if (risk === 'Medium') color = '#f59e0b';
              else if (risk === 'Low') color = '#10b981';
              return {
                fillColor: color,
                weight: 1,
                opacity: 1,
                color: color,
                dashArray: '3',
                fillOpacity: 0.1
              };
            }}
          />
        )}

        {filteredFeatures.map((f: any, idx: number) => {
          const lat = f.geometry.coordinates[1];
          const lng = f.geometry.coordinates[0];
          const isSelected = selectedNode && selectedNode.geometry.coordinates[0] === lng && selectedNode.geometry.coordinates[1] === lat;
          
          return (
            <CircleMarker
              key={idx}
              center={[lat, lng]}
              radius={isSelected ? 10 : 6}
              pathOptions={{
                color: isSelected ? '#ffffff' : getColor(f.properties.node_tier),
                weight: isSelected ? 3 : 2,
                fillColor: getColor(f.properties.node_tier),
                fillOpacity: 0.8
              }}
              eventHandlers={{
                click: () => onNodeSelect(f)
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <div className="p-1 min-w-[120px]">
                  <p className="font-bold text-sm mb-1 text-slate-800 border-b border-slate-200 pb-1">{f.properties.node_id || `N-${idx.toString().padStart(3, '0')}`}</p>
                  <div className="flex justify-between items-center text-xs mt-1">
                    <span className="text-slate-500 font-semibold">Tier:</span>
                    <span className="font-medium text-slate-700">{f.properties.node_tier}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-1">
                    <span className="text-slate-500 font-semibold">Risk:</span>
                    <span className={`font-medium ${
                      f.properties.risk_level === 'High' ? 'text-red-600' :
                      f.properties.risk_level === 'Medium' ? 'text-amber-500' : 'text-emerald-500'
                    }`}>
                      {f.properties.risk_level} {f.properties.risk_score && `(${(f.properties.risk_score * 100).toFixed(1)}%)`}
                    </span>
                  </div>
                  {f.properties.strain_ue !== undefined && (
                    <div className="flex justify-between items-center text-xs mt-1">
                      <span className="text-slate-500 font-semibold">Strain:</span>
                      <span className="font-medium text-slate-700">{f.properties.strain_ue.toFixed(1)} µε</span>
                    </div>
                  )}
                  {f.properties.zone_name && (
                    <div className="flex justify-between items-center text-xs mt-1">
                      <span className="text-slate-500 font-semibold">Zone:</span>
                      <span className="font-medium text-slate-700">{f.properties.zone_name}</span>
                    </div>
                  )}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Internal Legend */}
      <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur px-4 py-3 rounded-xl shadow-lg border border-slate-200 z-[400] flex gap-6">
        <div>
          <h4 className="text-xs font-bold text-slate-800 mb-2">Sensor Nodes</h4>
          <div className="space-y-1.5">
            <div className="flex items-center text-xs font-medium text-slate-600">
              <span className="w-3 h-3 rounded-full bg-blue-500 mr-2 border-2 border-white shadow-sm"></span> Full
            </div>
            <div className="flex items-center text-xs font-medium text-slate-600">
              <span className="w-3 h-3 rounded-full bg-amber-500 mr-2 border-2 border-white shadow-sm"></span> Crack
            </div>
            <div className="flex items-center text-xs font-medium text-slate-600">
              <span className="w-3 h-3 rounded-full bg-emerald-500 mr-2 border-2 border-white shadow-sm"></span> Lite
            </div>
          </div>
        </div>
        
        {geojsonData?.risk_zones && (
          <div className="border-l pl-5 border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 mb-2">Risk Zones</h4>
            <div className="space-y-1.5">
              <div className="flex items-center text-xs font-medium text-slate-600">
                <span className="w-3 h-3 rounded-sm border-2 border-red-500 bg-red-500/10 mr-2"></span> High
              </div>
              <div className="flex items-center text-xs font-medium text-slate-600">
                <span className="w-3 h-3 rounded-sm border-2 border-amber-500 bg-amber-500/10 mr-2"></span> Medium
              </div>
              <div className="flex items-center text-xs font-medium text-slate-600">
                <span className="w-3 h-3 rounded-sm border-2 border-emerald-500 bg-emerald-500/10 mr-2"></span> Low
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
