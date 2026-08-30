import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Grid, 
  Router, 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Layers, 
  ChevronRight, 
  TrendingUp, 
  Activity, 
  Clock, 
  ArrowRight,
  Cpu
} from 'lucide-react';
import { SummaryCard } from '../../components/dashboard/SummaryCard';
import { CentralMineGISMap } from '../../components/gis/CentralMineGISMap';
import { centralApiService } from '../../services/centralApiService';
import { MineInfo, MinePanel, GatewayInfo, CentralAlert, PredictedRiskData } from '../../types/central';
import { MonitoringNode } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const CentralDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [mineInfo, setMineInfo] = useState<MineInfo | null>(null);
  const [panels, setPanels] = useState<MinePanel[]>([]);
  const [gateways, setGateways] = useState<GatewayInfo[]>([]);
  const [nodes, setNodes] = useState<MonitoringNode[]>([]);
  const [alerts, setAlerts] = useState<CentralAlert[]>([]);
  const [predictedRisk, setPredictedRisk] = useState<PredictedRiskData | null>(null);
  const [selectedPanelId, setSelectedPanelId] = useState<string>('ALL');

  useEffect(() => {
    let isMounted = true;
    const loadAll = async () => {
      const [mInfo, pList, gList, nList, aList, pRisk] = await Promise.all([
        centralApiService.getMineById('MINE-01'),
        centralApiService.getPanels(),
        centralApiService.getGateways(),
        centralApiService.getCentralNodes(),
        centralApiService.getCentralAlerts(),
        centralApiService.getPredictedRisk()
      ]);

      if (isMounted) {
        if (mInfo) setMineInfo(mInfo);
        setPanels(pList);
        setGateways(gList);
        setNodes(nList);
        setAlerts(aList);
        setPredictedRisk(pRisk);
      }
    };

    loadAll();
    const interval = setInterval(loadAll, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const totalPanels = panels.length || 5;
  const totalGateways = gateways.length || 8;
  const totalNodes = nodes.length || 240;
  const onlineNodes = nodes.filter(n => n.status !== 'offline').length || 235;
  const warningAreas = panels.filter(p => p.riskLevel === 'WARNING').length || 2;
  const criticalAreas = panels.filter(p => p.riskLevel === 'CRITICAL').length || 1;
  const activeAlertsCount = alerts.filter(a => a.status === 'active').length || 4;

  const getSyncBadge = (gw: GatewayInfo) => {
    if (gw.syncStatus === 'DELAYED') {
      return (
        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
          DELAYED ({Math.floor(gw.lastSyncSecondsAgo / 60)}m ago)
        </span>
      );
    }
    if (gw.syncStatus === 'STALE' || gw.syncStatus === 'OFFLINE') {
      return (
        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
          STALE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
        SYNCED ({gw.lastSyncSecondsAgo}s ago)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Context */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-mono font-bold border border-emerald-200">
              {mineInfo?.id || 'MINE-01'}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {mineInfo?.name || 'Jharia Colliery Block-IV'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {mineInfo?.colliery} • {mineInfo?.location}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 font-medium">
            <span className="text-slate-400 font-semibold">User Role:</span>
            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {currentUser?.role || 'PLANNER'}
            </span>
          </div>

          <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2 text-xs text-emerald-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold">SYSTEM ONLINE</span>
            <span className="text-[11px] text-emerald-600 ml-1">Sync: {mineInfo?.lastSyncTime || 'Just now'}</span>
          </div>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        <SummaryCard 
          title="Total Panels" 
          value={totalPanels} 
          subtitle="Monitored" 
          icon={Grid} 
          iconBgColor="bg-blue-50" 
          iconColor="text-blue-600"
          sparklineData={[{value: 5}, {value: 5}, {value: 5}, {value: 5}]}
          sparklineColor="#3b82f6"
        />
        <SummaryCard 
          title="Gateways" 
          value={totalGateways} 
          subtitle="7/8 Synced" 
          icon={Router} 
          iconBgColor="bg-indigo-50" 
          iconColor="text-indigo-600"
          sparklineData={[{value: 8}, {value: 8}, {value: 8}, {value: 8}]}
          sparklineColor="#6366f1"
        />
        <SummaryCard 
          title="Total Nodes" 
          value={totalNodes} 
          subtitle="3 Tiers" 
          icon={Radio} 
          iconBgColor="bg-cyan-50" 
          iconColor="text-cyan-600"
          sparklineData={[{value: 230}, {value: 235}, {value: 238}, {value: 240}]}
          sparklineColor="#06b6d4"
        />
        <SummaryCard 
          title="Online Nodes" 
          value={onlineNodes} 
          subtitle="97.9% Health" 
          icon={CheckCircle2} 
          iconBgColor="bg-emerald-50" 
          iconColor="text-emerald-600"
          sparklineData={[{value: 230}, {value: 234}, {value: 232}, {value: 235}]}
          sparklineColor="#10b981"
        />
        <SummaryCard 
          title="Warning Areas" 
          value={warningAreas} 
          subtitle="Panels P-01, P-05" 
          icon={AlertTriangle} 
          iconBgColor="bg-amber-50" 
          iconColor="text-amber-600"
          sparklineData={[{value: 1}, {value: 2}, {value: 2}, {value: 2}]}
          sparklineColor="#f59e0b"
          valueColor="text-amber-600"
        />
        <SummaryCard 
          title="Critical Areas" 
          value={criticalAreas} 
          subtitle="Panel P-03 (Goaf)" 
          icon={ShieldAlert} 
          iconBgColor="bg-red-50" 
          iconColor="text-red-600"
          sparklineData={[{value: 0}, {value: 1}, {value: 1}, {value: 1}]}
          sparklineColor="#ef4444"
          valueColor="text-red-600"
        />
        <SummaryCard 
          title="Active Alerts" 
          value={activeAlertsCount} 
          subtitle="2 High Severity" 
          icon={Activity} 
          iconBgColor="bg-red-50" 
          iconColor="text-red-600"
          sparklineData={[{value: 2}, {value: 4}, {value: 5}, {value: 6}]}
          sparklineColor="#ef4444"
        />
      </div>

      {/* Mine-Wide GIS Map Preview & Predicted Risk Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-cyan-600" />
                <h2 className="text-base font-bold text-slate-800">Mine-Wide GIS Subsidence & Deformation Map</h2>
              </div>
              <button 
                onClick={() => navigate('/central/map')}
                className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center space-x-1"
              >
                <span>Fullscreen GIS Map</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-3 flex-1 min-h-[460px]">
              <CentralMineGISMap 
                panels={panels}
                gateways={gateways}
                nodes={nodes}
                selectedPanelId={selectedPanelId}
                onSelectPanel={(pid) => setSelectedPanelId(pid)}
                heightClass="h-[460px]"
                showControls={true}
              />
            </div>
          </div>
        </div>

        {/* AI Early Warning & Predictive Risk Model */}
        <div className="space-y-6 flex flex-col">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-tr from-purple-600 to-indigo-500 p-1.5 rounded-lg text-white">
                  <Cpu className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">AI Strata Risk & Prediction</h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                48h Forecast
              </span>
            </div>

            {/* Risk Comparison: Current vs Predicted */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-50/80 border border-red-200 rounded-xl p-3">
                <div className="text-[10px] font-bold uppercase text-red-600 tracking-wider">Current Condition</div>
                <div className="text-xl font-black text-red-700 mt-1">
                  {predictedRisk?.currentRisk || 'CRITICAL'}
                </div>
                <div className="text-[11px] text-red-600 font-semibold mt-0.5">
                  Severity Score: {predictedRisk?.currentScore || 92}/100
                </div>
              </div>

              <div className="bg-orange-50/80 border border-orange-200 rounded-xl p-3">
                <div className="text-[10px] font-bold uppercase text-orange-600 tracking-wider">Predicted Risk</div>
                <div className="text-xl font-black text-orange-700 mt-1">
                  {predictedRisk?.predictedRisk || 'HIGH'}
                </div>
                <div className="text-[11px] text-orange-600 font-semibold mt-0.5">
                  Confidence: {predictedRisk?.confidencePercent || 88.5}%
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>Displacement Acceleration:</span>
                <span className="font-bold text-red-600 flex items-center">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" /> +3.8 mm / 24h
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>Most Critical Sector:</span>
                <span className="font-mono font-bold text-slate-800">Panel P-03 (GW-05)</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>Primary Subsidence Factor:</span>
                <span className="font-semibold text-slate-700">Roof Bed Separation (Goaf)</span>
              </div>
            </div>

            {/* Recommended Operator / Planner Action */}
            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Recommended Mitigation Action</h4>
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 space-y-1.5">
                {predictedRisk?.recommendedActions.map((action, idx) => (
                  <p key={idx} className="leading-relaxed flex items-start">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 mr-2 flex-shrink-0"></span>
                    <span>{action}</span>
                  </p>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate('/central/trends')}
              className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <span>Explore Multi-Panel Trends</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Panels Health Matrix & Gateway Sync Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panels Overview Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Monitored Mine Panels</h2>
              <p className="text-xs text-slate-500">Spatial extraction areas and active subsidence monitoring</p>
            </div>
            <button 
              onClick={() => navigate('/central/panels')}
              className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center space-x-1"
            >
              <span>View All Panels</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Panel</th>
                  <th className="px-4 py-3">Risk Level</th>
                  <th className="px-4 py-3">Gateways</th>
                  <th className="px-4 py-3">Nodes (Online)</th>
                  <th className="px-4 py-3">Max Deformation</th>
                  <th className="px-4 py-3">Depth</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {panels.map(panel => {
                  const isCritical = panel.riskLevel === 'CRITICAL';
                  const isWarning = panel.riskLevel === 'WARNING';

                  return (
                    <tr 
                      key={panel.id}
                      onClick={() => navigate(`/central/panels/${panel.id}`)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3.5 font-bold text-slate-900 flex items-center space-x-2">
                        <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {panel.id}
                        </span>
                        <span className="text-slate-800 font-semibold">{panel.name}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isCritical ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse' :
                          isWarning ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {panel.riskLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-600">
                        {panel.gateways.join(', ')}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700">
                        <span className={panel.onlineNodes < panel.totalNodes ? 'text-amber-600' : 'text-emerald-600'}>
                          {panel.onlineNodes}
                        </span>
                        <span className="text-slate-400"> / {panel.totalNodes}</span>
                      </td>
                      <td className="px-4 py-3.5 font-bold font-mono">
                        <span className={isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-slate-700'}>
                          {panel.maxDeformationMm} mm
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-medium">
                        {panel.depthMeters} m
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button className="text-cyan-600 group-hover:text-cyan-700 font-bold inline-flex items-center space-x-1">
                          <span>Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gateway Synchronization Matrix */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Gateway Sync Health</h2>
              <p className="text-xs text-slate-500">Central telemetry & mesh state</p>
            </div>
            <button 
              onClick={() => navigate('/central/gateways')}
              className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center space-x-1"
            >
              <span>All Gateways</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[380px]">
            {gateways.map(gw => (
              <div 
                key={gw.id}
                onClick={() => navigate(`/central/gateways/${gw.id}`)}
                className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-slate-800">{gw.id}</span>
                    <span className="text-[10px] text-slate-400 font-medium">• {gw.panelId}</span>
                    <span className="text-[10px] text-slate-500 font-mono bg-white px-1.5 py-0.2 rounded border border-slate-200">
                      {gw.meshId}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Nodes: {gw.connectedNodes}/{gw.totalNodes} • Mesh: <span className="font-semibold text-emerald-700">{gw.meshHealth}</span>
                  </p>
                </div>

                <div className="text-right">
                  {getSyncBadge(gw)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Mine-Wide Alerts Feed */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <div>
              <h2 className="text-base font-bold text-slate-800">Critical & High Priority Early Warning Alerts</h2>
              <p className="text-xs text-slate-500">Aggregated real-time risk alerts across all 8 gateways</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/central/alerts')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>Alerts Center</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {alerts.slice(0, 4).map(alert => (
            <div key={alert.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                  alert.severity === 'critical' ? 'bg-red-50 text-red-600 border border-red-200' :
                  alert.severity === 'high' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                }`}>
                  {alert.severity === 'critical' ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>

                <div>
                  <div className="flex items-center space-x-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">{alert.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Panel {alert.panelId} • {alert.gatewayId} {alert.nodeId ? `• Node ${alert.nodeId}` : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{alert.message}</p>
                  <p className="text-xs text-amber-800 font-medium mt-1 bg-amber-50/70 p-1.5 rounded-lg border border-amber-200/50">
                    <span className="font-bold">Recommended Action:</span> {alert.recommendedAction}
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 flex-shrink-0">
                <span className="text-[11px] text-slate-400 flex items-center font-medium">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
                <button
                  onClick={() => navigate('/central/alerts')}
                  className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  Manage Alert
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
