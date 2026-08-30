import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, Search, ChevronRight, Plus, Edit3, Sparkles } from 'lucide-react';
import { centralApiService } from '../../services/centralApiService';
import { MinePanel, MineInfo } from '../../types/central';
import { useMine } from '../../context/MineContext';
import { AddPanelModal } from '../../components/modals/AddPanelModal';
import { ConfigureCoordinatesModal } from '../../components/modals/ConfigureCoordinatesModal';

export const CentralPanelsPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedMineId } = useMine();
  const [mines, setMines] = useState<MineInfo[]>([]);
  const [panels, setPanels] = useState<MinePanel[]>([]);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPanel, setEditingPanel] = useState<MinePanel | null>(null);

  const loadData = async () => {
    const [mList, pList] = await Promise.all([
      centralApiService.getMines(),
      centralApiService.getPanels(selectedMineId === 'ALL' ? undefined : selectedMineId)
    ]);
    setMines(mList);
    setPanels(pList);
  };

  useEffect(() => {
    loadData();
  }, [selectedMineId]);

  const handlePanelCreated = (_newPanel: MinePanel) => {
    loadData();
  };

  const handleGeometrySaved = (_updatedPanel: MinePanel) => {
    loadData();
  };

  const filteredPanels = panels.filter(p => {
    if (filterRisk !== 'ALL' && p.riskLevel !== filterRisk) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
    }
    return true;
  });

  const getLifecycleBadge = (panel: MinePanel) => {
    switch (panel.lifecycleState) {
      case 'PLACEMENT_APPROVED':
      case 'ACTIVE_MONITORING':
        return <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">ACTIVE MONITORING</span>;
      case 'PLACEMENT_GENERATED':
        return <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded">PLACEMENT GENERATED</span>;
      case 'COORDINATES_CONFIGURED':
        return <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">BOUNDARY CONFIGURED</span>;
      case 'NEW':
      default:
        return <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">NEW / UNCONFIGURED</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Grid className="w-6 h-6 text-cyan-600" />
            <h1 className="text-2xl font-bold text-slate-900">Mine Panel Monitoring Directory</h1>
          </div>
          <p className="text-sm text-slate-500">
            Underground longwall and pillar panels • Mine: <strong>{selectedMineId}</strong>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search panel ID or name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 bg-white"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {['ALL', 'CRITICAL', 'WARNING', 'NORMAL'].map(r => (
              <button
                key={r}
                onClick={() => setFilterRisk(r)}
                className={`px-3 py-1.5 rounded-lg transition-all ${filterRisk === r ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {r === 'ALL' ? 'All' : r}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Panel</span>
          </button>
        </div>
      </div>

      {/* Panels Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPanels.map((panel) => {
          const isCritical = panel.riskLevel === 'CRITICAL';
          const isWarning = panel.riskLevel === 'WARNING';

          return (
            <div 
              key={panel.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-cyan-400 transition-all flex flex-col justify-between group relative overflow-hidden space-y-4"
            >
              {isCritical && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 animate-pulse"></div>
              )}
              {isWarning && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
              )}

              <div className="space-y-3">
                {/* Header Row */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-sm bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200">
                      {panel.id}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Depth: {panel.depthMeters}m</span>
                  </div>

                  {getLifecycleBadge(panel)}
                </div>

                {/* Panel Info */}
                <div>
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-cyan-700 transition-colors">
                    {panel.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mine: <strong className="text-slate-800">{panel.mineId}</strong> • Risk Level: <strong className={isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'}>{panel.riskLevel}</strong>
                  </p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Nodes</div>
                    <div className="font-mono font-bold text-slate-800 mt-0.5">{panel.onlineNodes} / {panel.totalNodes}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Deform</div>
                    <div className="font-mono font-bold text-cyan-600 mt-0.5">{panel.maxDeformationMm}mm</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Gateways</div>
                    <div className="font-mono font-bold text-slate-800 mt-0.5">{panel.gateways.length}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setEditingPanel(panel)}
                  className="flex items-center space-x-1 text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Configure Boundary Coordinates"
                >
                  <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Boundary</span>
                </button>

                <button
                  onClick={() => navigate(`/planning/placement`)}
                  className="flex items-center space-x-1 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Run Sensor Placement Algorithm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Placement</span>
                </button>

                <button
                  onClick={() => navigate(`/mine/${panel.mineId}/panel/${panel.id}`)}
                  className="flex items-center space-x-1 text-cyan-700 hover:text-cyan-800 font-bold text-xs"
                >
                  <span>Detail</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Panel Modal */}
      <AddPanelModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        mines={mines}
        defaultMineId={selectedMineId}
        onPanelCreated={handlePanelCreated}
      />

      {/* Edit Boundary Coordinates Modal */}
      {editingPanel && (
        <ConfigureCoordinatesModal
          isOpen={!!editingPanel}
          onClose={() => setEditingPanel(null)}
          panel={editingPanel}
          onGeometrySaved={handleGeometrySaved}
        />
      )}
    </div>
  );
};
