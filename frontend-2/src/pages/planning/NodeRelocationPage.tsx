import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Grid, 
  ChevronRight,
  MapPin,
  Sparkles,
  Sliders,
  Save,
  Trash2,
  Edit3,
  CheckCircle2,
  RefreshCw,
  X
} from 'lucide-react';
import { centralApiService } from '../../services/centralApiService';
import { MineInfo, MinePanel, NodeRelocationItem, GatewayInfo, SensorPlacementData, ProposedNode } from '../../types/central';
import { MonitoringNode } from '../../types';
import { CentralMineGISMap } from '../../components/gis/CentralMineGISMap';
import { EditPanelGeometryModal } from '../../components/modals/EditPanelGeometryModal';
import { ConfigureCoordinatesModal } from '../../components/modals/ConfigureCoordinatesModal';
import { placementService, PlacementConfig, calculatePolygonCenter } from '../../services/placementService';

export const NodeRelocationPage: React.FC = () => {
  const [mines, setMines] = useState<MineInfo[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>('MINE-01');
  const [panels, setPanels] = useState<MinePanel[]>([]);
  const [selectedPanelId, setSelectedPanelId] = useState<string>('P-03');

  const [panel, setPanel] = useState<MinePanel | null>(null);
  const [gateways, setGateways] = useState<GatewayInfo[]>([]);
  const [nodes, setNodes] = useState<MonitoringNode[]>([]);
  const [relocations, setRelocations] = useState<NodeRelocationItem[]>([]);
  const [placementData, setPlacementData] = useState<SensorPlacementData | null>(null);
  const [proposedPoints, setProposedPoints] = useState<ProposedNode[]>([]);

  // Placement Config (Configurable FULL, LITE, CRACK counts)
  const [fullCount, setFullCount] = useState<number>(8);
  const [liteCount, setLiteCount] = useState<number>(7);
  const [crackCount, setCrackCount] = useState<number>(5);

  // Editing Modals & Map States
  const [isEditGeometryModalOpen, setIsEditGeometryModalOpen] = useState(false);
  const [isConfigCoordsModalOpen, setIsConfigCoordsModalOpen] = useState(false);
  const [isEditingBoundaryOnMap, setIsEditingBoundaryOnMap] = useState(false);
  const [inspectedNode, setInspectedNode] = useState<ProposedNode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    const loadMines = async () => {
      const mList = await centralApiService.getMines();
      setMines(mList);
    };
    loadMines();
  }, []);

  // Reload panels when mine changes
  useEffect(() => {
    const loadPanels = async () => {
      const pList = await centralApiService.getPanels(selectedMineId);
      setPanels(pList);
      if (pList.length > 0) {
        const exists = pList.find(p => p.id === selectedPanelId);
        if (!exists) {
          setSelectedPanelId(pList[0].id);
        }
      }
    };
    loadPanels();
  }, [selectedMineId]);

  // Load panel data when mine or panel changes
  useEffect(() => {
    if (!selectedMineId || !selectedPanelId) return;

    const loadData = async () => {
      const [p, gList, nList, relocs, place] = await Promise.all([
        centralApiService.getPanelById(selectedMineId, selectedPanelId),
        centralApiService.getGateways(selectedMineId, selectedPanelId),
        centralApiService.getCentralNodes({ mineId: selectedMineId, panelId: selectedPanelId }),
        centralApiService.getNodeRelocations(selectedMineId, selectedPanelId),
        centralApiService.getSensorPlacement(selectedMineId, selectedPanelId)
      ]);

      setPanel(p || null);
      setGateways(gList);
      setNodes(nList);
      setRelocations(relocs);

      if (place) {
        setPlacementData(place);
        setProposedPoints(place.proposedPoints || []);
        if (place.nodeTypeCounts) {
          setFullCount(place.nodeTypeCounts.FULL || 8);
          setLiteCount(place.nodeTypeCounts.LITE || 7);
          setCrackCount(place.nodeTypeCounts.CRACK || 5);
        }
      }
    };

    loadData();
  }, [selectedMineId, selectedPanelId]);

  // Handle map handle vertex dragging
  const handleUpdateVertexOnMap = (index: number, newLat: number, newLng: number) => {
    if (!panel) return;
    const nextCoords = [...panel.geometry.coordinates];
    nextCoords[index] = [newLat, newLng];

    setPanel({
      ...panel,
      geometry: {
        ...panel.geometry,
        coordinates: nextCoords
      }
    });
  };

  // Dimension Extenders
  const handleExtendPanelDimensions = (type: 'LENGTH_50' | 'LENGTH_100' | 'SCALE_1_2' | 'SCALE_1_5') => {
    if (!panel || !panel.geometry?.coordinates) return;

    let coords = [...panel.geometry.coordinates];
    const center = calculatePolygonCenter(coords);

    if (type === 'LENGTH_50') {
      coords = coords.map(pt => [pt[0] > center.centerLat ? pt[0] + 0.001 : pt[0], pt[1]]);
    } else if (type === 'LENGTH_100') {
      coords = coords.map(pt => [pt[0] > center.centerLat ? pt[0] + 0.002 : pt[0], pt[1]]);
    } else if (type === 'SCALE_1_2') {
      coords = coords.map(pt => [
        center.centerLat + (pt[0] - center.centerLat) * 1.2,
        center.centerLng + (pt[1] - center.centerLng) * 1.2
      ]);
    } else if (type === 'SCALE_1_5') {
      coords = coords.map(pt => [
        center.centerLat + (pt[0] - center.centerLat) * 1.5,
        center.centerLng + (pt[1] - center.centerLng) * 1.5
      ]);
    }

    setPanel({
      ...panel,
      geometry: {
        ...panel.geometry,
        coordinates: coords
      }
    });
  };

  const handleApplyMapCoordinates = async () => {
    if (!panel) return;
    const updated = await centralApiService.updatePanelGeometry(selectedMineId, selectedPanelId, panel.geometry.coordinates);
    if (updated) setPanel(updated);

    // Re-generate placement for new boundary geometry
    handleProvideSensorPlacement();
  };

  const handleGeometryApplied = (updatedPanel: MinePanel) => {
    setPanel(updatedPanel);
    handleProvideSensorPlacement();
  };

  // Provide Sensor Placement (Temporary Random Algorithm abstraction)
  const handleProvideSensorPlacement = async () => {
    if (!panel) return;
    setIsGenerating(true);

    setTimeout(async () => {
      const config: PlacementConfig = {
        fullCount: Number(fullCount) || 8,
        liteCount: Number(liteCount) || 7,
        crackCount: Number(crackCount) || 5
      };

      const generated = placementService.generateSensorPlacement(panel, config);
      setPlacementData(generated);
      setProposedPoints(generated.proposedPoints);
      setIsGenerating(false);
    }, 800);
  };

  const handleSavePlacement = async () => {
    if (!placementData) return;
    const totalCapex = proposedPoints.reduce((acc, curr) => acc + curr.estimatedCostINR, 0);

    const updatedData: SensorPlacementData = {
      ...placementData,
      proposedPoints: proposedPoints,
      proposedNodesCount: proposedPoints.length,
      totalPlannedNodes: nodes.length + proposedPoints.length,
      estimatedCostINR: `₹ ${totalCapex.toLocaleString('en-IN')}`,
      nodeTypeCounts: { FULL: fullCount, LITE: liteCount, CRACK: crackCount }
    };

    const saved = await centralApiService.saveSensorPlacement(selectedMineId, selectedPanelId, updatedData);
    setPlacementData(saved);

    const updatedPanel = await centralApiService.getPanelById(selectedMineId, selectedPanelId);
    if (updatedPanel) setPanel(updatedPanel);

    setSavedMessage(`Placement saved for ${selectedMineId} / ${selectedPanelId}! Source: Temporary Random Prototype.`);
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const handleDeleteProposedNode = (id: string) => {
    setProposedPoints(proposedPoints.filter(p => p.id !== id));
  };

  const totalCapex = proposedPoints.reduce((acc, curr) => acc + curr.estimatedCostINR, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner with Mine & Panel Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded">
              Adaptive Strata Relocation
            </span>
            <span className="text-xs text-slate-500 font-semibold">• Extraction Progression Driven</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Dynamic Node Relocation Planner
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Shift surface & in-seam monitoring sensors as the longwall extraction face advances.
          </p>
        </div>

        {/* Mandatory Mine & Panel Selector */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-2xl">
          <div className="flex items-center space-x-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedMineId}
              onChange={(e) => setSelectedMineId(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              {mines.map(m => (
                <option key={m.id} value={m.id}>
                  {m.id} - {m.name}
                </option>
              ))}
            </select>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />

          <div className="flex items-center space-x-1.5">
            <Grid className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedPanelId}
              onChange={(e) => setSelectedPanelId(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer font-mono"
            >
              {panels.map(p => (
                <option key={p.id} value={p.id}>
                  {p.id} - {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Extraction Progression Banner */}
      {panel && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-cyan-400 font-bold text-xs">{panel.id}: {panel.name}</span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30 font-bold">
                ACTIVE EXTRACTION
              </span>
            </div>
            <h3 className="text-lg font-black text-white mt-1">
              Face Progression: 120m advanced over past 30 days
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Goaf collapse center has shifted northwest. Sensor arrays in outer perimeter require realignment.
            </p>
          </div>

          <div className="flex items-center space-x-4 bg-white/10 p-3 rounded-xl border border-white/10 text-xs">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Nodes</div>
              <div className="text-base font-black text-white">{panel.totalNodes} Nodes</div>
            </div>
            <div className="h-7 w-px bg-white/20"></div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Relocations</div>
              <div className="text-base font-black text-amber-400">{relocations.length} Recommended</div>
            </div>
          </div>
        </div>
      )}

      {/* Relocation Recommendations Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Relocation Directives for {selectedMineId} / {panel?.name || selectedPanelId}
            </h3>
            <p className="text-xs text-slate-500">
              Strictly filtered to nodes assigned to {selectedPanelId}.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
            {relocations.length} Action Directives
          </span>
        </div>

        {relocations.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
            No sensor relocations currently required for {selectedPanelId}. Array is operating in optimal strain coverage.
          </div>
        ) : (
          <div className="space-y-4">
            {relocations.map(reloc => (
              <div
                key={reloc.id}
                className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono font-bold text-sm bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                      NODE {reloc.nodeId}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      reloc.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      Priority: {reloc.priority}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-bold text-cyan-600">
                    Confidence: {(reloc.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 font-medium">Current Location:</span>
                    <div className="font-bold text-slate-800 mt-0.5">{reloc.currentZone}</div>
                    <div className="font-mono text-slate-500 text-[11px]">
                      ({reloc.currentCoordinates.join(', ')})
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-cyan-200">
                    <span className="text-cyan-700 font-medium">Recommended Placement:</span>
                    <div className="font-bold text-slate-900 mt-0.5">{reloc.recommendedZone}</div>
                    <div className="font-mono text-slate-500 text-[11px]">
                      Shift Distance: <strong className="text-cyan-600">{reloc.distanceMeters}m</strong> ({reloc.recommendedCoordinates.join(', ')})
                    </div>
                  </div>
                </div>

                <div className="text-xs bg-amber-50/70 border border-amber-200/80 p-3 rounded-xl text-slate-700">
                  <span className="font-bold text-amber-900">Geotechnical Rationale:</span> {reloc.reason}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SENSOR PLACEMENT WORKFLOW & GIS MAP INTEGRATION */}
      {savedMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center space-x-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Sensor Placement Action Control & Settings Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-black text-slate-900">
                Sensor Placement Generator ({selectedMineId} / {panel?.name || selectedPanelId})
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Decoupled Placement Service • Temporary Random Prototype Generator (Friend's algorithm integration point)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsEditGeometryModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl shadow-sm cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>Edit Coordinates</span>
            </button>

            <button
              onClick={handleProvideSensorPlacement}
              disabled={isGenerating}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Generating...' : 'Provide Sensor Placement'}</span>
            </button>

            {proposedPoints.length > 0 && (
              <>
                <button
                  onClick={handleProvideSensorPlacement}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </button>

                <button
                  onClick={handleSavePlacement}
                  className="flex items-center space-x-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Placement</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Configurable Node Types Input Bar */}
        <div className="flex flex-wrap items-center gap-4 text-xs bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
            Placement Node Distribution:
          </span>

          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              FULL Nodes:
            </span>
            <input
              type="number"
              min="0"
              max="30"
              value={fullCount}
              onChange={(e) => setFullCount(Number(e.target.value))}
              className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-mono font-bold"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              LITE Nodes:
            </span>
            <input
              type="number"
              min="0"
              max="30"
              value={liteCount}
              onChange={(e) => setLiteCount(Number(e.target.value))}
              className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-mono font-bold"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              CRACK Nodes:
            </span>
            <input
              type="number"
              min="0"
              max="30"
              value={crackCount}
              onChange={(e) => setCrackCount(Number(e.target.value))}
              className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-mono font-bold"
            />
          </div>

          <div className="text-slate-500 font-bold ml-auto">
            Total Proposed: <strong className="text-slate-900">{fullCount + liteCount + crackCount} Nodes</strong>
          </div>
        </div>
      </div>

      {/* Placement Statistics Cards for Current Panel */}
      {placementData && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Target Nodes ({selectedPanelId})</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{nodes.length + proposedPoints.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Planned for panel</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Installed Active</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{nodes.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Active telemetry</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Proposed Locations</div>
            <div className="text-2xl font-black text-indigo-600 mt-1">{proposedPoints.length}</div>
            <div className="text-[9px] font-bold text-slate-500 mt-0.5">
              FULL: {fullCount} | LITE: {liteCount} | CRACK: {crackCount}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Array Coverage</div>
            <div className="text-2xl font-black text-cyan-600 mt-1">
              {placementData.algorithmStatus === 'NOT_GENERATED' ? '0%' : `${placementData.coveragePercent}%`}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Strata area shield</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Est. CAPEX Budget</div>
            <div className="text-base font-black text-slate-800 mt-1">₹ {totalCapex.toLocaleString('en-IN')}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Unit estimate</div>
          </div>
        </div>
      )}

      {/* Interactive Leaflet GIS Map */}
      {panel && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-800">
                Interactive GIS Map: {selectedMineId} / {panel.name} ({selectedPanelId})
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <button
                onClick={() => setIsEditingBoundaryOnMap(!isEditingBoundaryOnMap)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold ${
                  isEditingBoundaryOnMap 
                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300' 
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingBoundaryOnMap ? 'Editing Map Handles...' : 'Edit Map Coordinates'}</span>
              </button>

              <button
                onClick={() => setIsEditGeometryModalOpen(true)}
                className="flex items-center space-x-1 text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Numeric Geometry</span>
              </button>
            </div>
          </div>

          {/* Interactive Boundary Editing Control Bar */}
          {isEditingBoundaryOnMap && (
            <div className="p-3.5 bg-indigo-50/90 border border-indigo-200 rounded-xl space-y-3 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-indigo-900">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                  <span>Drag corner handles (V1, V2, V3...) directly on the map or click dimension extenders below:</span>
                </div>
                <button
                  onClick={handleApplyMapCoordinates}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Map Coordinates & Re-Optimize</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="text-slate-500 font-semibold">Extend Panel Size:</span>
                <button
                  onClick={() => handleExtendPanelDimensions('LENGTH_50')}
                  className="px-2.5 py-1 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg cursor-pointer"
                >
                  +50m Length
                </button>
                <button
                  onClick={() => handleExtendPanelDimensions('LENGTH_100')}
                  className="px-2.5 py-1 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg cursor-pointer"
                >
                  +100m Length
                </button>
                <button
                  onClick={() => handleExtendPanelDimensions('SCALE_1_2')}
                  className="px-2.5 py-1 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg cursor-pointer"
                >
                  Scale 1.2x
                </button>
                <button
                  onClick={() => handleExtendPanelDimensions('SCALE_1_5')}
                  className="px-2.5 py-1 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg cursor-pointer"
                >
                  Scale 1.5x
                </button>
                <button
                  onClick={() => setIsConfigCoordsModalOpen(true)}
                  className="px-2.5 py-1 bg-slate-900 text-white hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Edit Lat/Lng Table
                </button>
              </div>
            </div>
          )}

          <CentralMineGISMap
            panels={[panel]}
            gateways={gateways}
            nodes={nodes}
            proposedNodes={proposedPoints}
            selectedMineId={selectedMineId}
            selectedPanelId={panel.id}
            heightClass="h-[500px]"
            showControls={false}
            isEditingBoundary={isEditingBoundaryOnMap}
            onUpdateVertex={handleUpdateVertexOnMap}
          />
        </div>
      )}

      {/* Proposed Nodes Table with Inspector */}
      {proposedPoints.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Proposed Sensor Nodes ({proposedPoints.length} Points inside {selectedPanelId})
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Generated via Temporary Random Prototype • Click node row to inspect details
              </p>
            </div>

            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
              Est. CAPEX: ₹ {totalCapex.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="space-y-3">
            {proposedPoints.map(prop => (
              <div
                key={prop.id}
                onClick={() => setInspectedNode(prop)}
                className="p-4 bg-slate-50 border border-slate-200 hover:border-indigo-400 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-all cursor-pointer"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs bg-indigo-600 text-white px-2 py-0.5 rounded">
                      {prop.id}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded text-white ${
                      prop.nodeType === 'FULL' ? 'bg-indigo-600' : prop.nodeType === 'CRACK' ? 'bg-red-600' : 'bg-amber-600'
                    }`}>
                      {prop.nodeType || 'FULL'} NODE
                    </span>
                    <span className="text-xs font-bold text-slate-800">{prop.nodeTier}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{prop.purpose}</p>
                </div>

                <div className="flex items-center space-x-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400">Lat:</span> <strong>{prop.latitude}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Lng:</span> <strong>{prop.longitude}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Est:</span> <strong className="text-slate-900">₹ {prop.estimatedCostINR.toLocaleString('en-IN')}</strong>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProposedNode(prop.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Proposed Node"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proposed Node Details Modal/Drawer */}
      {inspectedNode && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-sm bg-indigo-600 text-white px-2.5 py-1 rounded-lg">
                  {inspectedNode.id}
                </span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded text-white ${
                  inspectedNode.nodeType === 'FULL' ? 'bg-indigo-600' : inspectedNode.nodeType === 'CRACK' ? 'bg-red-600' : 'bg-amber-600'
                }`}>
                  {inspectedNode.nodeType || 'FULL'} NODE
                </span>
              </div>
              <button 
                onClick={() => setInspectedNode(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-semibold">Assigned Panel:</span> <strong className="text-slate-900">{selectedPanelId} ({selectedMineId})</strong>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Latitude:</span> <strong className="font-mono text-slate-900">{inspectedNode.latitude}</strong>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Longitude:</span> <strong className="font-mono text-slate-900">{inspectedNode.longitude}</strong>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Status:</span> <strong className="text-indigo-600">PROPOSED</strong>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Placement Source:</span> <strong className="text-slate-900">TEMPORARY RANDOM (PROTOTYPE)</strong>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Estimated Unit CAPEX:</span> <strong className="text-slate-900">₹ {inspectedNode.estimatedCostINR.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl text-slate-700">
              <span className="font-bold text-indigo-900">Geotechnical Purpose:</span> {inspectedNode.purpose}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setInspectedNode(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Panel Geometry Modal (Numeric Center Lat/Lng/Width/Height) */}
      {panel && (
        <EditPanelGeometryModal
          isOpen={isEditGeometryModalOpen}
          onClose={() => setIsEditGeometryModalOpen(false)}
          panel={panel}
          onGeometryApplied={handleGeometryApplied}
        />
      )}

      {/* Edit Boundary Coordinates Modal (Lat/Lng Vertices Table) */}
      {panel && (
        <ConfigureCoordinatesModal
          isOpen={isConfigCoordsModalOpen}
          onClose={() => setIsConfigCoordsModalOpen(false)}
          panel={panel}
          onGeometrySaved={handleGeometryApplied}
        />
      )}
    </div>
  );
};
