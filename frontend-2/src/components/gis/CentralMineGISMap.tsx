import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, Tooltip, ZoomControl, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MonitoringNode } from '../../types';
import { MinePanel, GatewayInfo, ProposedNode } from '../../types/central';
import { calculateIDW, GridCell } from '../../services/deformationService';
import { RiskZonePolygon } from '../../types/risk';
import { NodeMarkers } from './NodeMarkers';
import { DeformationLayer } from './DeformationLayer';
import { RiskZones } from './RiskZones';
import { MapLegend } from './MapLegend';
import { Filter, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CentralMineGISMapProps {
  panels: MinePanel[];
  gateways: GatewayInfo[];
  nodes: MonitoringNode[];
  proposedNodes?: ProposedNode[];
  selectedMineId?: string;
  selectedPanelId?: string;
  selectedGatewayId?: string;
  onSelectPanel?: (panelId: string) => void;
  onSelectGateway?: (gwId: string) => void;
  heightClass?: string;
  showControls?: boolean;
  isEditingBoundary?: boolean;
  onUpdateVertex?: (index: number, newLat: number, newLng: number) => void;
}

const MapRecenter = ({ bounds }: { bounds: [number, number][] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length === 2) {
      map.fitBounds(bounds as any, { padding: [30, 30] });
    }
  }, [map, bounds]);
  return null;
};

// Custom Vertex Drag Handle Icon
const createVertexIcon = (index: number) => {
  return L.divIcon({
    className: 'custom-vertex-marker',
    html: `
      <div style="
        background-color: #4f46e5;
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2px.5px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: 11px;
        font-family: monospace;
        cursor: grab;
      ">
        V${index + 1}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

// Custom Gateway Leaflet Icon
const createGatewayIcon = (risk: string) => {
  const isCritical = risk === 'CRITICAL';
  const isWarning = risk === 'WARNING';
  const color = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';

  return L.divIcon({
    className: 'custom-gw-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2.5px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 800;
        font-size: 9px;
        font-family: monospace;
      ">
        GW
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

export const CentralMineGISMap: React.FC<CentralMineGISMapProps> = ({
  panels,
  gateways,
  nodes,
  proposedNodes = [],
  selectedMineId,
  selectedPanelId: propSelectedPanelId,
  selectedGatewayId: propSelectedGatewayId,
  onSelectPanel,
  onSelectGateway,
  heightClass = 'h-[540px]',
  showControls = true,
  isEditingBoundary = false,
  onUpdateVertex
}) => {
  const navigate = useNavigate();

  // Local filter states
  const [panelFilter, setPanelFilter] = useState<string>(propSelectedPanelId || 'ALL');
  const [gatewayFilter, setGatewayFilter] = useState<string>(propSelectedGatewayId || 'ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Layer visibility toggles
  const [showDeformation, setShowDeformation] = useState(true);
  const [showPanels, setShowPanels] = useState(true);
  const [showGateways, setShowGateways] = useState(true);
  const [showNodes, setShowNodes] = useState(true);
  const [showProposed, setShowProposed] = useState(true);

  // Sync prop changes
  useEffect(() => {
    if (propSelectedPanelId) setPanelFilter(propSelectedPanelId);
  }, [propSelectedPanelId]);

  useEffect(() => {
    if (propSelectedGatewayId) setGatewayFilter(propSelectedGatewayId);
  }, [propSelectedGatewayId]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      if (selectedMineId && n.mineId && n.mineId.toLowerCase() !== selectedMineId.toLowerCase()) return false;
      if (panelFilter !== 'ALL' && n.panelId !== panelFilter) return false;
      if (gatewayFilter !== 'ALL' && n.gatewayId !== gatewayFilter) return false;
      if (riskFilter !== 'ALL') {
        const s = (n.status || '').toLowerCase();
        if (riskFilter === 'CRITICAL' && s !== 'critical') return false;
        if (riskFilter === 'WARNING' && s !== 'warning') return false;
        if (riskFilter === 'NORMAL' && s !== 'normal') return false;
      }
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ONLINE' && n.status === 'offline') return false;
        if (statusFilter === 'OFFLINE' && n.status !== 'offline') return false;
      }
      return true;
    });
  }, [nodes, selectedMineId, panelFilter, gatewayFilter, riskFilter, statusFilter]);

  // Filtered gateways
  const filteredGateways = useMemo(() => {
    return gateways.filter(g => {
      if (selectedMineId && g.mineId && g.mineId.toLowerCase() !== selectedMineId.toLowerCase()) return false;
      if (panelFilter !== 'ALL' && g.panelId !== panelFilter) return false;
      if (gatewayFilter !== 'ALL' && g.id !== gatewayFilter) return false;
      return true;
    });
  }, [gateways, selectedMineId, panelFilter, gatewayFilter]);

  // IDW Grid computation
  const deformationGrid: GridCell[] = useMemo(() => {
    if (!showDeformation || filteredNodes.length === 0) return [];
    const bounds: [number, number, number, number] = [86.395, 23.740, 86.442, 23.778];
    return calculateIDW(filteredNodes, bounds, 24, 2);
  }, [filteredNodes, showDeformation]);

  // Risk zones
  const riskZones: RiskZonePolygon[] = useMemo(() => {
    if (selectedMineId === 'MINE-02') {
      return [
        {
          id: 'RZ-M2-P02',
          name: 'Raniganj Panel P-02 Barrier Stress Zone',
          category: 'WARNING',
          coordinates: [[
            [23.622, 87.125],
            [23.630, 87.132],
            [23.625, 87.140],
            [23.618, 87.132],
            [23.622, 87.125]
          ]],
          maxDeformation: 31.5
        }
      ];
    }
    return [
      {
        id: 'RZ-P03-GOAF',
        name: 'Panel P-03 Active Subsidence Goaf Trough',
        category: 'CRITICAL',
        coordinates: [[
          [23.744, 86.412],
          [23.754, 86.425],
          [23.748, 86.429],
          [23.740, 86.418],
          [23.744, 86.412]
        ]],
        maxDeformation: 74.6
      },
      {
        id: 'RZ-P01-BARRIER',
        name: 'Panel P-01 Barrier Pillar Strain Zone',
        category: 'WARNING',
        coordinates: [[
          [23.764, 86.410],
          [23.770, 86.416],
          [23.766, 86.421],
          [23.760, 86.414],
          [23.764, 86.410]
        ]],
        maxDeformation: 34.8
      }
    ];
  }, [selectedMineId]);

  // Compute map bounds based on selection
  const mapBounds = useMemo(() => {
    const lats: number[] = [];
    const lngs: number[] = [];

    if (panelFilter !== 'ALL') {
      const panel = panels.find(p => p.id === panelFilter);
      if (panel) {
        panel.geometry.coordinates.forEach((c: [number, number]) => {
          lats.push(c[0]);
          lngs.push(c[1]);
        });
      }
    } else if (filteredNodes.length > 0) {
      filteredNodes.forEach(n => {
        lats.push(n.latitude);
        lngs.push(n.longitude);
      });
    } else {
      panels.forEach(p => {
        p.geometry.coordinates.forEach((c: [number, number]) => {
          lats.push(c[0]);
          lngs.push(c[1]);
        });
      });
    }

    if (lats.length === 0) return null;

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const padLat = (maxLat - minLat) * 0.15 || 0.008;
    const padLng = (maxLng - minLng) * 0.15 || 0.008;

    return [
      [minLat - padLat, minLng - padLng] as [number, number],
      [maxLat + padLat, maxLng + padLng] as [number, number]
    ];
  }, [panels, filteredNodes, panelFilter]);

  // Panel Color Resolver
  const getPanelColor = (risk: string, isSelected: boolean) => {
    if (isSelected) return '#06b6d4'; // Cyan active highlight
    if (risk === 'CRITICAL') return '#ef4444';
    if (risk === 'WARNING') return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      {/* Control / Filter Bar */}
      {showControls && (
        <div className="p-3 bg-white/95 backdrop-blur border-b border-slate-200 z-10 relative flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Spatial Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-700 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-cyan-600" />
              <span>Spatial Filter:</span>
            </span>

            {/* Panel Selector */}
            <select
              value={panelFilter}
              onChange={(e) => {
                setPanelFilter(e.target.value);
                setGatewayFilter('ALL');
                if (onSelectPanel && e.target.value !== 'ALL') onSelectPanel(e.target.value);
              }}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Panels ({panels.length})</option>
              {panels.map(p => (
                <option key={p.id} value={p.id}>
                  {p.id} - {p.name} ({p.riskLevel})
                </option>
              ))}
            </select>

            {/* Gateway Selector */}
            <select
              value={gatewayFilter}
              onChange={(e) => {
                setGatewayFilter(e.target.value);
                if (onSelectGateway && e.target.value !== 'ALL') onSelectGateway(e.target.value);
              }}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Gateways ({filteredGateways.length})</option>
              {filteredGateways.map(g => (
                <option key={g.id} value={g.id}>
                  {g.id} ({g.meshId})
                </option>
              ))}
            </select>

            {/* Risk Filter */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="WARNING">Warning Only</option>
              <option value="NORMAL">Normal Only</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Node Status</option>
              <option value="ONLINE">Online Only</option>
              <option value="OFFLINE">Offline Only</option>
            </select>
          </div>

          {/* Layer Visibility Toggles */}
          <div className="flex items-center space-x-3 text-slate-600 font-medium">
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showPanels}
                onChange={(e) => setShowPanels(e.target.checked)}
                className="rounded text-cyan-600 focus:ring-0"
              />
              <span>Panels</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showGateways}
                onChange={(e) => setShowGateways(e.target.checked)}
                className="rounded text-cyan-600 focus:ring-0"
              />
              <span>Gateways</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showNodes}
                onChange={(e) => setShowNodes(e.target.checked)}
                className="rounded text-cyan-600 focus:ring-0"
              />
              <span>Nodes ({filteredNodes.length})</span>
            </label>

            {proposedNodes.length > 0 && (
              <label className="flex items-center space-x-1.5 cursor-pointer text-indigo-600 font-bold">
                <input
                  type="checkbox"
                  checked={showProposed}
                  onChange={(e) => setShowProposed(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <span>Proposed ({proposedNodes.length})</span>
              </label>
            )}

            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showDeformation}
                onChange={(e) => setShowDeformation(e.target.checked)}
                className="rounded text-cyan-600 focus:ring-0"
              />
              <span>Deformation Heatmap</span>
            </label>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className={`w-full ${heightClass} relative z-0`}>
        <MapContainer
          center={[23.758, 86.415]}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ZoomControl position="bottomright" />
          <MapRecenter bounds={mapBounds} />

          {/* Interpolated Deformation Heatmap */}
          {showDeformation && deformationGrid.length > 0 && (
            <DeformationLayer grid={deformationGrid} step={(86.442 - 86.395) / 24} />
          )}

          {/* Risk Zones Overlay */}
          <RiskZones zones={riskZones} />

          {/* Panel Boundaries Layer */}
          {showPanels && panels.map(panel => {
            const isSelected = panelFilter === panel.id;
            const color = getPanelColor(panel.riskLevel, isSelected);

            return (
              <Polygon
                key={panel.id}
                positions={panel.geometry.coordinates}
                pathOptions={{
                  color: color,
                  weight: isSelected ? 3.5 : 2,
                  fillColor: color,
                  fillOpacity: isSelected ? 0.2 : 0.08,
                  dashArray: isSelected ? undefined : '5, 5'
                }}
                eventHandlers={{
                  click: () => {
                    setPanelFilter(panel.id);
                    if (onSelectPanel) onSelectPanel(panel.id);
                  }
                }}
              >
                <Tooltip sticky direction="top" className="custom-panel-tooltip">
                  <div className="p-1 font-sans">
                    <div className="font-bold text-xs text-slate-900">{panel.id}: {panel.name}</div>
                    <div className="text-[10px] text-slate-600">
                      Risk: <strong className={panel.riskLevel === 'CRITICAL' ? 'text-red-600' : 'text-emerald-600'}>{panel.riskLevel}</strong> | Depth: {panel.depthMeters}m
                    </div>
                  </div>
                </Tooltip>
                <Popup>
                  <div className="p-2 font-sans min-w-[200px]">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100 mb-2">
                      <span className="font-bold text-sm text-slate-900">{panel.name}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        panel.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        panel.riskLevel === 'WARNING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {panel.riskLevel}
                      </span>
                    </div>
                    <div className="text-xs space-y-1 text-slate-600 mb-3">
                      <div>Panel ID: <strong className="text-slate-800">{panel.id}</strong></div>
                      <div>Depth: <strong>{panel.depthMeters} meters</strong></div>
                      <div>Max Deformation: <strong className="text-red-600">{panel.maxDeformationMm} mm</strong></div>
                      <div>Active Nodes: <strong>{panel.onlineNodes} / {panel.totalNodes}</strong></div>
                      <div>Gateways: <strong>{panel.gateways.join(', ')}</strong></div>
                    </div>
                    <button
                      onClick={() => navigate(`/mine/${panel.mineId}/panel/${panel.id}`)}
                      className="w-full flex items-center justify-center space-x-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      <span>Drilldown Panel</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Popup>
              </Polygon>
            );
          })}

          {/* Draggable Polygon Vertex Handles when Editing Boundary */}
          {isEditingBoundary && panels.map(panel => {
            if (panelFilter !== 'ALL' && panel.id !== panelFilter) return null;

            return panel.geometry?.coordinates?.map((pt, idx) => (
              <Marker
                key={`vertex-${panel.id}-${idx}`}
                position={[pt[0], pt[1]]}
                draggable={true}
                icon={createVertexIcon(idx)}
                eventHandlers={{
                  dragend: (e) => {
                    const latLng = e.target.getLatLng();
                    if (onUpdateVertex) {
                      onUpdateVertex(idx, latLng.lat, latLng.lng);
                    }
                  }
                }}
              >
                <Tooltip sticky direction="top">
                  <div className="text-xs font-bold font-sans p-1">
                    <div className="text-indigo-700">Drag Corner Handle Vertex #{idx + 1}</div>
                    <div className="font-mono text-[10px] text-slate-600">
                      {pt[0].toFixed(5)}, {pt[1].toFixed(5)}
                    </div>
                  </div>
                </Tooltip>
              </Marker>
            ));
          })}

          {/* Gateway Markers Layer */}
          {showGateways && filteredGateways.map(gw => (
            <Marker
              key={gw.id}
              position={[gw.latitude, gw.longitude]}
              icon={createGatewayIcon(gw.currentRisk)}
              eventHandlers={{
                click: () => {
                  setGatewayFilter(gw.id);
                  if (onSelectGateway) onSelectGateway(gw.id);
                }
              }}
            >
              <Popup>
                <div className="p-2 font-sans min-w-[210px]">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100 mb-2">
                    <span className="font-bold text-sm text-slate-900">{gw.id}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {gw.syncStatus}
                    </span>
                  </div>
                  <div className="text-xs space-y-1 text-slate-600 mb-2">
                    <div className="font-semibold text-slate-800">{gw.name}</div>
                    <div>Panel: <strong className="text-slate-800">{gw.panelId}</strong></div>
                    <div>Mesh: <strong>{gw.meshId}</strong></div>
                    <div>Nodes Connected: <strong>{gw.connectedNodes} / {gw.totalNodes}</strong></div>
                    <div>Mesh Health: <strong className="text-emerald-600">{gw.meshHealth}</strong></div>
                    <div>Last Synced: <strong>{gw.lastSyncSecondsAgo}s ago</strong></div>
                  </div>
                  <button
                    onClick={() => navigate(`/mine/${gw.mineId}/panel/${gw.panelId}`)}
                    className="w-full text-center py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded text-xs font-bold transition-colors"
                  >
                    View in Panel {gw.panelId}
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Proposed Sensor Nodes (for Sensor Placement view) */}
          {showProposed && proposedNodes.map(prop => {
            const isFull = prop.nodeType === 'FULL';
            const isCrack = prop.nodeType === 'CRACK';
            const color = isFull ? '#6366f1' : isCrack ? '#ef4444' : '#f59e0b';
            const fillColor = isFull ? '#818cf8' : isCrack ? '#f87171' : '#fbbf24';
            const typeLabel = prop.nodeType || (prop.nodeTier?.includes('Tier-3') ? 'FULL' : prop.nodeTier?.includes('Tier-2') ? 'CRACK' : 'LITE');

            return (
              <CircleMarker
                key={prop.id}
                center={[prop.latitude, prop.longitude]}
                radius={9}
                pathOptions={{
                  color: color,
                  fillColor: fillColor,
                  fillOpacity: 0.95,
                  weight: 2.5,
                  dashArray: '4, 4'
                }}
              >
                <Tooltip sticky>
                  <div className="text-xs font-sans p-1">
                    <div className="flex items-center space-x-1.5 mb-1">
                      <span className="font-mono font-bold text-slate-900">{prop.id}</span>
                      <span 
                        className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded text-white"
                        style={{ backgroundColor: color }}
                      >
                        {typeLabel}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-700 font-semibold">{prop.purpose}</div>
                    <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                      ML Confidence: {(prop.confidence * 100).toFixed(0)}% • Est: ₹ {prop.estimatedCostINR.toLocaleString('en-IN')}
                    </div>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}

          {/* Sensor Nodes Layer */}
          {showNodes && (
            <NodeMarkers nodes={filteredNodes} />
          )}

          {/* Map Legend */}
          <MapLegend />
        </MapContainer>
      </div>
    </div>
  );
};
