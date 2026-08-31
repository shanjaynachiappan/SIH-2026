import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Sparkles, 
  ChevronRight,
  Building2,
  Grid,
  Plus,
  Trash2,
  Download,
  X,
  Save,
  CheckCircle2,
  Edit3,
  Info,
  Sliders
} from 'lucide-react';
import { centralApiService } from '../../services/centralApiService';
import { MineInfo, MinePanel, GatewayInfo, SensorPlacementData, ProposedNode, PanelLifecycleState } from '../../types/central';
import { MonitoringNode } from '../../types';
import { CentralMineGISMap } from '../../components/gis/CentralMineGISMap';
import { RiskZonePolygon } from '../../types/risk';
import { AddPanelModal } from '../../components/modals/AddPanelModal';
import { ConfigureCoordinatesModal } from '../../components/modals/ConfigureCoordinatesModal';

const PLACEMENT_ALGORITHMS = [
  'Voronoi/Delaunay Grid Optimization',
  'Extensometer Multi-Point Array Design',
  'ML Strata Deformation Density Mapping',
  'Goaf Edge Subsidence Boundary Shield',
  'Sub-surface Strain Sensor Distribution',
  'Multi-tier LoRa Mesh Coverage Optimization',
  'High-Density Goaf Collapse Risk Array'
];

export const SensorPlacementPage: React.FC = () => {
  const [mines, setMines] = useState<MineInfo[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>('MINE-01');
  const [panels, setPanels] = useState<MinePanel[]>([]);
  const [selectedPanelId, setSelectedPanelId] = useState<string>('P-03');

  const [panel, setPanel] = useState<MinePanel | null>(null);
  const [gateways, setGateways] = useState<GatewayInfo[]>([]);
  const [nodes, setNodes] = useState<MonitoringNode[]>([]);
  const [placementData, setPlacementData] = useState<SensorPlacementData | null>(null);
  const [proposedPoints, setProposedPoints] = useState<ProposedNode[]>([]);
  const [riskZones, setRiskZones] = useState<RiskZonePolygon[]>([]);

  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>(PLACEMENT_ALGORITHMS[0]);
  const [isRunningOptimizer, setIsRunningOptimizer] = useState(false);

  // Modals & Map Edit States
  const [isAddPanelModalOpen, setIsAddPanelModalOpen] = useState(false);
  const [isConfigCoordsModalOpen, setIsConfigCoordsModalOpen] = useState(false);
  const [isAddPointModalOpen, setIsAddPointModalOpen] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isEditingBoundaryOnMap, setIsEditingBoundaryOnMap] = useState(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState('');

  // New Node Form State
  const [newTier, setNewTier] = useState<ProposedNode['nodeTier']>('Tier-1 (Surface Extensometer)');
  const [newNodeType, setNewNodeType] = useState<'FULL' | 'LITE' | 'CRACK'>('FULL');
  const [newPriority, setNewPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [newPurpose, setNewPurpose] = useState('Subsidence displacement monitoring along goaf edge');
  const [newCost, setNewCost] = useState(35000);

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

  // Load panel-specific data when mine or panel changes
  useEffect(() => {
    if (!selectedMineId || !selectedPanelId) return;

    const loadPanelData = async () => {
      const [p, gList, nList, place] = await Promise.all([
        centralApiService.getPanelById(selectedMineId, selectedPanelId),
        centralApiService.getGateways(selectedMineId, selectedPanelId),
        centralApiService.getCentralNodes({ mineId: selectedMineId, panelId: selectedPanelId }),
        centralApiService.getSensorPlacement(selectedMineId, selectedPanelId)
      ]);

      setPanel(p || null);
      setGateways(gList);
      setNodes(nList);
      if (place) {
        setPlacementData(place);
        setProposedPoints(place.proposedPoints || []);
        if (place.algorithmUsed) setSelectedAlgorithm(place.algorithmUsed);
        setRiskZones(centralApiService.getRiskZonesGeoJSON(selectedMineId, selectedPanelId));
      }
    };

    loadPanelData();
  }, [selectedMineId, selectedPanelId]);

  const handlePanelCreated = (newPanel: MinePanel) => {
    setSelectedMineId(newPanel.mineId);
    setSelectedPanelId(newPanel.id);
  };

  const handleGeometrySaved = (updatedPanel: MinePanel) => {
    setPanel(updatedPanel);
  };

  // Draggable Map Vertex Handler
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
    const centerLat = coords.reduce((sum, pt) => sum + pt[0], 0) / coords.length;
    const centerLng = coords.reduce((sum, pt) => sum + pt[1], 0) / coords.length;

    if (type === 'LENGTH_50') {
      coords = coords.map(pt => [pt[0] > centerLat ? pt[0] + 0.001 : pt[0], pt[1]]);
    } else if (type === 'LENGTH_100') {
      coords = coords.map(pt => [pt[0] > centerLat ? pt[0] + 0.002 : pt[0], pt[1]]);
    } else if (type === 'SCALE_1_2') {
      coords = coords.map(pt => [
        centerLat + (pt[0] - centerLat) * 1.2,
        centerLng + (pt[1] - centerLng) * 1.2
      ]);
    } else if (type === 'SCALE_1_5') {
      coords = coords.map(pt => [
        centerLat + (pt[0] - centerLat) * 1.5,
        centerLng + (pt[1] - centerLng) * 1.5
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

  const handleSaveMapCoordinates = async () => {
    if (!panel) return;

    const updated = await centralApiService.updatePanelGeometry(
      selectedMineId, 
      selectedPanelId, 
      panel.geometry.coordinates
    );

    if (updated) setPanel(updated);

    // Auto re-generate sensor placement for new panel geometry
    await handleGeneratePlacement();

    setSavedSuccessMsg(`Panel ${selectedPanelId} coordinates updated & placement re-optimized!`);
    setTimeout(() => setSavedSuccessMsg(''), 3000);
  };

  const handleGeneratePlacement = async () => {
    setIsRunningOptimizer(true);
    setTimeout(async () => {
      const place = await centralApiService.generateSensorPlacement(
        selectedMineId, 
        selectedPanelId, 
        selectedAlgorithm
      );

      setPlacementData(place);
      setProposedPoints(place.proposedPoints || []);
      // Real risk-zone polygons computed by the same pipeline run --
      // this is what makes the map show the actual algorithm output.
      setRiskZones(centralApiService.getRiskZonesGeoJSON(selectedMineId, selectedPanelId));
      setIsRunningOptimizer(false);

      const updatedPanel = await centralApiService.getPanelById(selectedMineId, selectedPanelId);
      if (updatedPanel) setPanel(updatedPanel);
    }, 1000);
  };

  const handleSavePlacement = async () => {
    if (!placementData) return;

    const fullCount = proposedPoints.filter(p => p.nodeType === 'FULL').length;
    const liteCount = proposedPoints.filter(p => p.nodeType === 'LITE').length;
    const crackCount = proposedPoints.filter(p => p.nodeType === 'CRACK').length;
    const totalCapex = proposedPoints.reduce((acc, curr) => acc + curr.estimatedCostINR, 0);

    const updatedPlacementData: SensorPlacementData = {
      ...placementData,
      proposedPoints: proposedPoints,
      proposedNodesCount: proposedPoints.length,
      totalPlannedNodes: nodes.length + proposedPoints.length,
      estimatedCostINR: `₹ ${totalCapex.toLocaleString('en-IN')}`,
      algorithmUsed: selectedAlgorithm,
      algorithmStatus: 'OPTIMAL',
      nodeTypeCounts: { FULL: fullCount, LITE: liteCount, CRACK: crackCount }
    };

    const saved = await centralApiService.saveSensorPlacement(selectedMineId, selectedPanelId, updatedPlacementData);
    setPlacementData(saved);

    const updatedPanel = await centralApiService.getPanelById(selectedMineId, selectedPanelId);
    if (updatedPanel) setPanel(updatedPanel);

    setIsReviewMode(false);
    setSavedSuccessMsg(`Sensor placement configuration saved for ${selectedMineId} / ${selectedPanelId}!`);
    setTimeout(() => setSavedSuccessMsg(''), 3000);
  };

  const handleAddProposedPoint = (e: React.FormEvent) => {
    e.preventDefault();
    const baseLat = panel?.geometry?.coordinates?.[0]?.[0] || 23.765;
    const baseLng = panel?.geometry?.coordinates?.[0]?.[1] || 86.415;

    const newPoint: ProposedNode = {
      id: `PROP-${selectedPanelId}-${(proposedPoints.length + 1).toString().padStart(2, '0')}`,
      nodeTier: newTier,
      nodeType: newNodeType,
      latitude: baseLat + (Math.random() * 0.003 - 0.0015),
      longitude: baseLng + (Math.random() * 0.003 - 0.0015),
      confidence: 0.94,
      priority: newPriority,
      purpose: newPurpose,
      estimatedCostINR: newCost
    };

    setProposedPoints([newPoint, ...proposedPoints]);
    setIsAddPointModalOpen(false);
  };

  const handleDeleteProposedPoint = (id: string) => {
    setProposedPoints(proposedPoints.filter(p => p.id !== id));
  };

  const handleNodeTypeChange = (id: string, type: 'FULL' | 'LITE' | 'CRACK') => {
    setProposedPoints(proposedPoints.map(p => {
      if (p.id === id) {
        const cost = type === 'FULL' ? 35000 : type === 'CRACK' ? 25000 : 15000;
        return { ...p, nodeType: type, estimatedCostINR: cost };
      }
      return p;
    }));
  };

  const handleExportBlueprint = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      mineId: selectedMineId,
      panelId: selectedPanelId,
      panelName: panel?.name,
      lifecycleState: panel?.lifecycleState,
      installedNodes: nodes.length,
      proposedNodesCount: proposedPoints.length,
      algorithmUsed: selectedAlgorithm,
      proposedPoints: proposedPoints
    }, null, 2));

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `SensorPlacementBlueprint_${selectedMineId}_${selectedPanelId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getLifecycleBadge = (state?: PanelLifecycleState) => {
    switch (state) {
      case 'PLACEMENT_APPROVED':
      case 'ACTIVE_MONITORING':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase">ACTIVE MONITORING</span>;
      case 'PLACEMENT_GENERATED':
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase">PLACEMENT GENERATED</span>;
      case 'COORDINATES_CONFIGURED':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase">COORDINATES CONFIGURED</span>;
      case 'NEW':
      default:
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase">NEW / UNCONFIGURED</span>;
    }
  };

  const fullCount = proposedPoints.filter(p => p.nodeType === 'FULL').length;
  const liteCount = proposedPoints.filter(p => p.nodeType === 'LITE').length;
  const crackCount = proposedPoints.filter(p => p.nodeType === 'CRACK').length;
  const totalCapex = proposedPoints.reduce((acc, curr) => acc + curr.estimatedCostINR, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner with Hierarchical Selection */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded">
              Mine Planning Suite
            </span>
            <span className="text-xs text-slate-500 font-semibold">• Sensor Array Optimization</span>
            {getLifecycleBadge(panel?.lifecycleState)}
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Sensor Placement & Array Design
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Isolated panel-specific sensor array planning • {selectedMineId} / {panel?.name || selectedPanelId}
          </p>
        </div>

        {/* Mine & Panel Selector + Add Panel */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-2xl">
          {/* Mine Dropdown */}
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

          {/* Panel Dropdown */}
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

          {/* Add Panel Action */}
          <button
            onClick={() => setIsAddPanelModalOpen(true)}
            className="flex items-center space-x-1 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Create a new panel under this mine"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Panel</span>
          </button>

          {/* Edit Boundary Action */}
          {panel && (
            <button
              onClick={() => setIsConfigCoordsModalOpen(true)}
              className="flex items-center space-x-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="Edit boundary coordinates for this panel"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Edit Coordinates</span>
            </button>
          )}
        </div>
      </div>

      {savedSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center space-x-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{savedSuccessMsg}</span>
        </div>
      )}

      {/* Algorithm Selection Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
              Sensor Placement Algorithm Suite
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Calculates optimal multi-tier sensor deployment strictly scoped to boundary coordinates of panel <strong>{selectedPanelId}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700 p-1.5 rounded-xl flex-1 lg:flex-none">
            <Sliders className="w-4 h-4 text-slate-400 ml-1.5" />
            <select
              value={selectedAlgorithm}
              onChange={(e) => setSelectedAlgorithm(e.target.value)}
              className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer pr-2"
            >
              {PLACEMENT_ALGORITHMS.map(alg => (
                <option key={alg} value={alg} className="bg-slate-900 text-white">
                  {alg}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGeneratePlacement}
            disabled={isRunningOptimizer}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <Sparkles className={`w-4 h-4 ${isRunningOptimizer ? 'animate-spin' : ''}`} />
            <span>{isRunningOptimizer ? 'Generating Placement...' : 'Generate Placement'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards for CURRENT PANEL ONLY */}
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

      {/* Empty State Banner if no placement generated yet */}
      {placementData?.algorithmStatus === 'NOT_GENERATED' && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Info className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">No Sensor Placement Generated Yet</h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Panel <strong>{selectedPanelId}</strong> is a newly created panel. Click <strong>Generate Placement</strong> above to compute optimal sensor coordinates.
              </p>
            </div>
          </div>
          <button
            onClick={handleGeneratePlacement}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs whitespace-nowrap shadow-sm cursor-pointer"
          >
            Run Algorithm
          </button>
        </div>
      )}

      {/* Interactive GIS Map */}
      {panel && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-800">
                Panel {selectedPanelId} GIS Placement Geometry ({selectedMineId})
              </h3>
            </div>
            <div className="flex items-center space-x-2.5 text-xs font-semibold">
              <button
                onClick={() => setIsEditingBoundaryOnMap(!isEditingBoundaryOnMap)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold ${
                  isEditingBoundaryOnMap 
                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300' 
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingBoundaryOnMap ? 'Editing Map Handles...' : 'Edit Map Coordinates'}</span>
              </button>

              <button
                onClick={handleExportBlueprint}
                className="flex items-center space-x-1 text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Blueprint</span>
              </button>
            </div>
          </div>

          {/* Interactive Boundary Editing Control Bar */}
          {isEditingBoundaryOnMap && (
            <div className="p-3.5 bg-indigo-50/90 border border-indigo-200 rounded-xl space-y-3 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-indigo-900">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                  <span>Drag corner handles (V1, V2, V3...) directly on the Leaflet map below or click dimension extenders:</span>
                </div>
                <button
                  onClick={handleSaveMapCoordinates}
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
            realRiskZones={riskZones}
            selectedMineId={selectedMineId}
            selectedPanelId={panel.id}
            heightClass="h-[500px]"
            showControls={false}
            isEditingBoundary={isEditingBoundaryOnMap}
            onUpdateVertex={handleUpdateVertexOnMap}
          />
        </div>
      )}

      {/* Review & Modify Proposed Nodes */}
      {proposedPoints.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Proposed Sensor Installation Array ({proposedPoints.length} Points)
                </h4>
                {isReviewMode && (
                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                    Review & Editing Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Algorithm: {selectedAlgorithm} • Scoped to {selectedMineId} / {selectedPanelId}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsAddPointModalOpen(true)}
                className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Node Manually</span>
              </button>

              <button
                onClick={() => setIsReviewMode(!isReviewMode)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isReviewMode ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' : 'bg-slate-900 text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isReviewMode ? 'Done Reviewing' : 'Review Placement'}</span>
              </button>

              <button
                onClick={handleSavePlacement}
                className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Placement</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {proposedPoints.map(prop => (
              <div
                key={prop.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs bg-indigo-600 text-white px-2 py-0.5 rounded">
                      {prop.id}
                    </span>

                    {/* Node Type selector in review mode */}
                    {isReviewMode ? (
                      <select
                        value={prop.nodeType || 'FULL'}
                        onChange={(e) => handleNodeTypeChange(prop.id, e.target.value as any)}
                        className="text-xs font-black bg-white border border-slate-300 rounded px-2 py-0.5 text-slate-800"
                      >
                        <option value="FULL">FULL (Multi-Param Hub)</option>
                        <option value="LITE">LITE (Single Extensometer)</option>
                        <option value="CRACK">CRACK (Micro-Seismic Crack)</option>
                      </select>
                    ) : (
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded text-white ${
                        prop.nodeType === 'FULL' ? 'bg-indigo-600' : prop.nodeType === 'CRACK' ? 'bg-red-600' : 'bg-amber-600'
                      }`}>
                        {prop.nodeType || 'FULL'}
                      </span>
                    )}

                    <span className="text-xs font-bold text-slate-700">{prop.nodeTier}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      prop.priority === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      Priority: {prop.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{prop.purpose}</p>
                </div>

                <div className="flex items-center space-x-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400">ML Confidence:</span> <strong>{(prop.confidence * 100).toFixed(0)}%</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Unit Cost:</span> <strong className="text-slate-900">₹ {prop.estimatedCostINR.toLocaleString('en-IN')}</strong>
                  </div>

                  <button
                    onClick={() => handleDeleteProposedPoint(prop.id)}
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

      {/* Modal: Add Proposed Point Manually */}
      {isAddPointModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Add Manual Proposed Node Point</h3>
              </div>
              <button 
                onClick={() => setIsAddPointModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProposedPoint} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Mine & Panel</label>
                <input 
                  type="text" 
                  disabled 
                  value={`${selectedMineId} / ${selectedPanelId}`} 
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Node Type (FULL, LITE, CRACK)</label>
                <select
                  value={newNodeType}
                  onChange={(e) => {
                    const t = e.target.value as 'FULL' | 'LITE' | 'CRACK';
                    setNewNodeType(t);
                    setNewCost(t === 'FULL' ? 35000 : t === 'CRACK' ? 25000 : 15000);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="FULL">FULL (Multi-Parameter Hub)</option>
                  <option value="LITE">LITE (Single Extensometer)</option>
                  <option value="CRACK">CRACK (Micro-Seismic Crack Sensor)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sensor Node Tier</label>
                <select
                  value={newTier}
                  onChange={(e) => setNewTier(e.target.value as ProposedNode['nodeTier'])}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Tier-1 (Surface Extensometer)">Tier-1 (Surface Extensometer)</option>
                  <option value="Tier-2 (Sub-Surface MPBX)">Tier-2 (Sub-Surface MPBX)</option>
                  <option value="Tier-3 (In-Seam Multi-Param)">Tier-3 (In-Seam Multi-Param)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Priority Level</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="HIGH">HIGH (Immediate Installation)</option>
                  <option value="MEDIUM">MEDIUM (Phase 2)</option>
                  <option value="LOW">LOW (Phase 3)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Installation Purpose & Zone</label>
                <textarea
                  rows={3}
                  value={newPurpose}
                  onChange={(e) => setNewPurpose(e.target.value)}
                  placeholder="e.g. Critical subsidence displacement monitoring..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Estimated Unit CAPEX (₹ INR)</label>
                <input
                  type="number"
                  value={newCost}
                  onChange={(e) => setNewCost(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddPointModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-sm"
                >
                  Add Proposed Point
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Panel Modal */}
      <AddPanelModal
        isOpen={isAddPanelModalOpen}
        onClose={() => setIsAddPanelModalOpen(false)}
        mines={mines}
        defaultMineId={selectedMineId}
        onPanelCreated={handlePanelCreated}
      />

      {/* Edit Boundary Coordinates Modal */}
      {panel && (
        <ConfigureCoordinatesModal
          isOpen={isConfigCoordsModalOpen}
          onClose={() => setIsConfigCoordsModalOpen(false)}
          panel={panel}
          onGeometrySaved={handleGeometrySaved}
        />
      )}
    </div>
  );
};