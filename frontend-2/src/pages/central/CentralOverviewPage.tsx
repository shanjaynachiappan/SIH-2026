import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Grid, 
  Router, 
  Radio, 
  AlertTriangle, 
  ShieldAlert, 
  ChevronRight, 
  Activity, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { CentralMineGISMap } from '../../components/gis/CentralMineGISMap';
import { centralApiService } from '../../services/centralApiService';
import { MineInfo, MinePanel, GatewayInfo, CentralAlert, PredictedRiskData } from '../../types/central';
import { MonitoringNode } from '../../types';
import { useMine } from '../../context/MineContext';

export const CentralOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedMineId, setSelectedMineId, selectedMine } = useMine();

  const [mines, setMines] = useState<MineInfo[]>([]);
  const [panels, setPanels] = useState<MinePanel[]>([]);
  const [gateways, setGateways] = useState<GatewayInfo[]>([]);
  const [nodes, setNodes] = useState<MonitoringNode[]>([]);
  const [alerts, setAlerts] = useState<CentralAlert[]>([]);
  const [prediction, setPrediction] = useState<PredictedRiskData | null>(null);

  useEffect(() => {
    const load = async () => {
      const [mList, pList, gList, nList, aList, pred] = await Promise.all([
        centralApiService.getMines(),
        centralApiService.getPanels(selectedMineId === 'ALL' ? undefined : selectedMineId),
        centralApiService.getGateways(selectedMineId === 'ALL' ? undefined : selectedMineId),
        centralApiService.getCentralNodes({ mineId: selectedMineId === 'ALL' ? undefined : selectedMineId }),
        centralApiService.getCentralAlerts({ mineId: selectedMineId === 'ALL' ? undefined : selectedMineId }),
        centralApiService.getPredictedRisk(selectedMineId === 'ALL' ? undefined : selectedMineId)
      ]);

      setMines(mList);
      setPanels(pList);
      setGateways(gList);
      setNodes(nList);
      setAlerts(aList);
      setPrediction(pred);
    };

    load();
  }, [selectedMineId]);

  // Aggregate Metrics
  const totalMines = mines.length;
  const totalPanels = panels.length;
  const totalGateways = gateways.length;
  const totalNodes = nodes.length;
  const criticalPanels = panels.filter(p => p.riskLevel === 'CRITICAL').length;
  const warningPanels = panels.filter(p => p.riskLevel === 'WARNING').length;
  const activeAlertsCount = alerts.filter(a => a.status === 'active').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner with Mine Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-cyan-50 text-cyan-700 border border-cyan-200 uppercase tracking-wider">
              Central Mine Command
            </span>
            <span className="text-xs text-slate-500 font-semibold">• Real-Time Hierarchy Surveillance</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            {selectedMine ? `${selectedMine.id} Centralized Dashboard` : 'Centralized Mine Subsidence Monitoring'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedMine ? `${selectedMine.name} • ${selectedMine.colliery} (${selectedMine.location})` : 'Hierarchical multi-mine strata surveillance • Select a mine site to load its centralized dashboard.'}
          </p>
        </div>

        {/* Mine Selector Dropdown */}
        <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 p-2 rounded-2xl">
          <span className="text-xs font-bold text-slate-600 pl-2">Active Mine:</span>
          <select
            value={selectedMineId}
            onChange={(e) => setSelectedMineId(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Mines ({totalMines})</option>
            {mines.map(m => (
              <option key={m.id} value={m.id}>
                {m.id} - {m.name} ({m.overallRisk})
              </option>
            ))}
          </select>

          {selectedMineId !== 'ALL' && (
            <button
              onClick={() => navigate(`/mine/${selectedMineId}`)}
              className="flex items-center space-x-1 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <span>Drilldown</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 7 Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Mines</span>
            <div className="p-1.5 bg-slate-100 rounded-lg text-slate-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalMines}</div>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Registered</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Panels</span>
            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
              <Grid className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalPanels}</div>
            <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">{criticalPanels} Critical</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gateways</span>
            <div className="p-1.5 bg-cyan-50 rounded-lg text-cyan-600">
              <Router className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalGateways}</div>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">All Online</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Sensor Nodes</span>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalNodes}</div>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">3 Tiers Deployed</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Critical Areas</span>
            <div className="p-1.5 bg-red-50 rounded-lg text-red-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-red-600">{criticalPanels}</div>
            <p className="text-[10px] text-red-500 font-semibold mt-0.5">{criticalPanels > 0 ? 'P-03 Action Req.' : 'Safe'}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Warning Areas</span>
            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600">{warningPanels}</div>
            <p className="text-[10px] text-amber-600 font-semibold mt-0.5">{warningPanels} Panels</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Alerts</span>
            <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-rose-600">{activeAlertsCount}</div>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Live Feed</p>
          </div>
        </div>
      </div>

      {/* GIS Map & Mines Directory */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse"></span>
              <h2 className="text-base font-bold text-slate-800">
                Mine-Wide Spatial GIS & Risk Boundary Map
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Interactive multi-panel spatial visualization with IDW deformation overlay and gateway coordinates.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600">
            <span className="bg-slate-100 px-2.5 py-1 rounded-lg">{panels.length} Panels Mapped</span>
            <span className="bg-slate-100 px-2.5 py-1 rounded-lg">{nodes.length} Sensors Online</span>
          </div>
        </div>

        {/* Leaflet Map Component */}
        <CentralMineGISMap
          panels={panels}
          gateways={gateways}
          nodes={nodes}
          selectedMineId={selectedMineId === 'ALL' ? undefined : selectedMineId}
          onSelectPanel={(panelId) => {
            const panel = panels.find(p => p.id === panelId);
            if (panel) navigate(`/mine/${panel.mineId}/panel/${panel.id}`);
          }}
          heightClass="h-[480px]"
          showControls={true}
        />
      </div>

      {/* Registered Mines Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Mines Directory ({mines.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mines.map(mine => {
            const isCritical = mine.overallRisk === 'CRITICAL';
            const isWarning = mine.overallRisk === 'WARNING';
            const minePanels = panels.filter(p => p.mineId === mine.id);

            return (
              <div
                key={mine.id}
                onClick={() => navigate(`/mine/${mine.id}`)}
                className="bg-white border border-slate-200 hover:border-cyan-400 hover:shadow-md rounded-2xl p-5 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-cyan-50 group-hover:text-cyan-600 transition-colors">
                        <Building2 className="w-5 h-5 text-slate-700" />
                      </div>
                      <div>
                        <span className="font-mono font-bold text-xs text-slate-500">{mine.id}</span>
                        <h4 className="text-base font-black text-slate-900">{mine.name}</h4>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      isCritical ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse' :
                      isWarning ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {mine.overallRisk} RISK
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-medium mb-3">
                    {mine.colliery} • {mine.location}
                  </p>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs mb-3">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Panels</div>
                      <div className="text-sm font-black text-slate-800">{mine.totalPanels} Active</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Gateways</div>
                      <div className="text-sm font-black text-slate-800">{mine.totalGateways} Online</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Nodes</div>
                      <div className="text-sm font-black text-slate-800">{mine.totalNodes} Deployed</div>
                    </div>
                  </div>

                  {/* Panel Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {minePanels.map(p => (
                      <span
                        key={p.id}
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          p.riskLevel === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                          p.riskLevel === 'WARNING' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {p.id} ({p.riskLevel})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-cyan-600">
                  <span>Enter Mine Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Strata Risk Forecast & Critical Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Forecast */}
        <div className="bg-gradient-to-br from-[#1C2118] to-[#2A3324] text-white rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Mine-Wide Strata AI Risk Forecast</h3>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded">
                48H PREDICTION
              </span>
            </div>

            {prediction && (
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-[10px] uppercase font-bold text-slate-300">Predicted Risk State</div>
                  <div className="text-2xl font-black text-red-400 mt-0.5">
                    {prediction.predictedRisk} ({prediction.confidencePercent}% Confidence)
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-amber-300 mt-1 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Trend: Accelerating Deformation</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Recommended Actions
                  </div>
                  <ul className="text-xs space-y-1.5 text-slate-200">
                    {prediction.recommendedActions.map((act, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-[10px] text-slate-400 flex justify-between">
            <span>Model: MineGuard-BiLSTM-v2.1</span>
            <span>Refreshed: Just now</span>
          </div>
        </div>

        {/* Critical Alerts Feed */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-base text-slate-800">Critical Mine Alerts ({alerts.length})</h3>
              </div>
              <span className="text-xs font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                Live Feed
              </span>
            </div>

            <div className="space-y-3">
              {alerts.slice(0, 3).map(alert => (
                <div
                  key={alert.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        alert.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{alert.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {alert.timestamp.split('T')[1].substring(0, 5)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mb-2">{alert.message}</p>

                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/60">
                    <span className="font-mono text-slate-500">
                      Scope: <strong>{alert.mineId}</strong> → <strong>{alert.panelId}</strong> → <strong>{alert.gatewayId}</strong>
                    </span>
                    <button
                      onClick={() => navigate(`/mine/${alert.mineId}/panel/${alert.panelId}`)}
                      className="text-cyan-600 hover:text-cyan-700 font-bold flex items-center space-x-0.5"
                    >
                      <span>Inspect Panel</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
