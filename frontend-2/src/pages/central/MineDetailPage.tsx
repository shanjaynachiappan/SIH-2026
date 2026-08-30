import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Grid, 
  ChevronRight, 
  ArrowLeft,
  Layers
} from 'lucide-react';
import { CentralMineGISMap } from '../../components/gis/CentralMineGISMap';
import { centralApiService } from '../../services/centralApiService';
import { MineInfo, MinePanel, GatewayInfo, CentralAlert } from '../../types/central';
import { MonitoringNode } from '../../types';

export const MineDetailPage: React.FC = () => {
  const { mineId = 'MINE-01' } = useParams<{ mineId: string }>();
  const navigate = useNavigate();

  const [mine, setMine] = useState<MineInfo | null>(null);
  const [allMines, setAllMines] = useState<MineInfo[]>([]);
  const [panels, setPanels] = useState<MinePanel[]>([]);
  const [gateways, setGateways] = useState<GatewayInfo[]>([]);
  const [nodes, setNodes] = useState<MonitoringNode[]>([]);
  const [alerts, setAlerts] = useState<CentralAlert[]>([]);

  // Filter states for Panels section
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      const [m, mList, pList, gList, nList, aList] = await Promise.all([
        centralApiService.getMineById(mineId),
        centralApiService.getMines(),
        centralApiService.getPanels(mineId),
        centralApiService.getGateways(mineId),
        centralApiService.getCentralNodes({ mineId }),
        centralApiService.getCentralAlerts({ mineId })
      ]);

      if (m) setMine(m);
      setAllMines(mList);
      setPanels(pList);
      setGateways(gList);
      setNodes(nList);
      setAlerts(aList);
    };

    load();
  }, [mineId]);

  if (!mine) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Mine Not Found</h2>
        <button 
          onClick={() => navigate('/overview')}
          className="mt-4 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl"
        >
          Back to Overview
        </button>
      </div>
    );
  }

  const isCritical = mine.overallRisk === 'CRITICAL';
  const isWarning = mine.overallRisk === 'WARNING';

  // Filtered panels in this mine
  const filteredPanels = panels.filter(p => {
    if (riskFilter !== 'ALL' && p.riskLevel !== riskFilter) return false;
    if (searchFilter && !p.name.toLowerCase().includes(searchFilter.toLowerCase()) && !p.id.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
          <button 
            onClick={() => navigate('/overview')} 
            className="hover:text-slate-900 flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Central Overview</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold font-mono">{mine.id}</span>
        </div>

        {/* Quick Mine Switcher */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-semibold">Switch Mine:</span>
          <select
            value={mine.id}
            onChange={(e) => navigate(`/mine/${e.target.value}`)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
          >
            {allMines.map(m => (
              <option key={m.id} value={m.id}>
                {m.id} - {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mine Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <span className="font-mono font-black text-sm bg-slate-900 text-white px-3 py-1 rounded-xl">
              {mine.id}
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{mine.name}</h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isCritical ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse' :
              isWarning ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {mine.overallRisk} RISK
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {mine.colliery} • {mine.location} • Status: <span className="font-semibold text-emerald-600">{mine.status}</span>
          </p>
        </div>

        {/* Mine Stats */}
        <div className="flex items-center space-x-4 bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Panels</div>
            <div className="text-xl font-black text-slate-800">{mine.totalPanels}</div>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Gateways</div>
            <div className="text-xl font-black text-cyan-600">{mine.totalGateways}</div>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Nodes</div>
            <div className="text-xl font-black text-emerald-600">{mine.totalNodes}</div>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Alerts</div>
            <div className="text-xl font-black text-rose-600">{alerts.length}</div>
          </div>
        </div>
      </div>

      {/* Mine GIS Map (Focusing ONLY on this mine) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-cyan-600" />
            <h2 className="text-base font-bold text-slate-800">{mine.name} Spatial Scope Map</h2>
          </div>
          <span className="text-xs font-mono text-slate-500 font-semibold">{panels.length} Panels in {mine.id}</span>
        </div>

        <CentralMineGISMap
          panels={panels}
          gateways={gateways}
          nodes={nodes}
          selectedMineId={mine.id}
          onSelectPanel={(panelId) => navigate(`/mine/${mine.id}/panel/${panelId}`)}
          heightClass="h-[440px]"
          showControls={false}
        />
      </div>

      {/* Dedicated PANELS Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Grid className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Panels in {mine.name} ({panels.length})
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Select a panel below to inspect dedicated nodes, sensor placement, mesh gateways, risk, and alerts.
            </p>
          </div>

          {/* Panel Filters */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search panel..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="WARNING">Warning Only</option>
              <option value="NORMAL">Normal Only</option>
            </select>
          </div>
        </div>

        {/* Panel Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPanels.map(panel => {
            const pCritical = panel.riskLevel === 'CRITICAL';
            const pWarning = panel.riskLevel === 'WARNING';

            return (
              <div
                key={panel.id}
                onClick={() => navigate(`/mine/${mine.id}/panel/${panel.id}`)}
                className="bg-white border border-slate-200 hover:border-cyan-400 hover:shadow-md rounded-2xl p-5 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-black text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200">
                      {panel.id}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      pCritical ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse' :
                      pWarning ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {panel.riskLevel}
                    </span>
                  </div>

                  <h4 className="text-base font-black text-slate-900 mb-1">{panel.name}</h4>
                  <p className="text-xs text-slate-500 font-medium mb-3">
                    Depth: {panel.depthMeters}m • Status: <span className="font-semibold text-slate-700">{panel.status}</span>
                  </p>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs mb-3">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Gateways</div>
                      <div className="text-sm font-black text-slate-800">{panel.gateways.length} Gateways</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Sensor Nodes</div>
                      <div className="text-sm font-black text-slate-800">{panel.onlineNodes} / {panel.totalNodes} Online</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Max Deformation</div>
                      <div className={`text-sm font-black ${pCritical ? 'text-red-600' : 'text-slate-800'}`}>
                        {panel.maxDeformationMm} mm
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Last Update</div>
                      <div className="text-xs font-bold text-slate-700">{panel.lastUpdated}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-cyan-600">
                  <span>View Panel Details</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
