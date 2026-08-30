import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Grid,
  Router, 
  ChevronRight, 
  ArrowLeft, 
  Layers, 
  ShieldAlert
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { centralApiService } from '../../services/centralApiService';
import { MinePanel, GatewayInfo, CentralAlert, TrendMetricPoint } from '../../types/central';
import { MonitoringNode } from '../../types';
import { CentralMineGISMap } from '../../components/gis/CentralMineGISMap';

export const CentralPanelDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [panel, setPanel] = useState<MinePanel | null>(null);
  const [gateways, setGateways] = useState<GatewayInfo[]>([]);
  const [nodes, setNodes] = useState<MonitoringNode[]>([]);
  const [alerts, setAlerts] = useState<CentralAlert[]>([]);
  const [trends, setTrends] = useState<TrendMetricPoint[]>([]);
  const [trendMetric, setTrendMetric] = useState<'displacement' | 'tilt' | 'vibration' | 'riskScore'>('displacement');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const p = await centralApiService.getPanelById('MINE-01', id);
      if (p) {
        setPanel(p);
        const [allGws, pNodes, pAlerts, pTrends] = await Promise.all([
          centralApiService.getGateways(),
          centralApiService.getCentralNodes({ panelId: p.id }),
          centralApiService.getCentralAlerts({ panelId: p.id }),
          centralApiService.getHistoricalTrends(timeRange, p.id)
        ]);

        setGateways(allGws.filter(g => p.gateways.includes(g.id)));
        setNodes(pNodes);
        setAlerts(pAlerts);
        setTrends(pTrends);
      }
    };
    load();
  }, [id, timeRange]);

  if (!panel) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <Grid className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Panel Not Found</h2>
        <button 
          onClick={() => navigate('/central/panels')}
          className="mt-4 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl"
        >
          Back to Panels
        </button>
      </div>
    );
  }

  const isCritical = panel.riskLevel === 'CRITICAL';
  const isWarning = panel.riskLevel === 'WARNING';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Breadcrumb / Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/central/panels')}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Panels</span>
        </button>

        {/* Hierarchy Breadcrumb */}
        <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold text-slate-500">
          <span>MINE-01</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-900 font-bold">{panel.id} ({panel.name})</span>
        </div>
      </div>

      {/* Panel Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <span className="font-mono font-black text-base bg-slate-100 text-slate-800 px-3 py-1 rounded-xl border border-slate-200">
              {panel.id}
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{panel.name}</h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isCritical ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse' :
              isWarning ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {panel.riskLevel} RISK
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Depth: {panel.depthMeters} meters • Status: <span className="font-semibold text-slate-700">{panel.status}</span> • Assigned Gateways: {panel.gateways.join(', ')}
          </p>
        </div>

        {/* Key Panel Stats */}
        <div className="flex items-center space-x-4 bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Max Deformation</div>
            <div className={`text-xl font-black ${isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-slate-800'}`}>
              {panel.maxDeformationMm} <span className="text-xs font-medium text-slate-500">mm</span>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Active Nodes</div>
            <div className="text-xl font-black text-slate-800">
              {panel.onlineNodes} <span className="text-xs text-slate-400 font-medium">/ {panel.totalNodes}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spatial GIS Boundary Map of Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-cyan-600" />
            <h2 className="text-base font-bold text-slate-800">Panel Spatial Scope & Deformation Map</h2>
          </div>
          <span className="text-xs font-mono text-slate-500 font-semibold">{nodes.length} Nodes Rendered</span>
        </div>
        <CentralMineGISMap
          panels={[panel]}
          gateways={gateways}
          nodes={nodes}
          selectedPanelId={panel.id}
          heightClass="h-[420px]"
          showControls={false}
        />
      </div>

      {/* Gateways in this Panel & Deformation Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gateways List */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center space-x-2">
                <Router className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800">Panel Gateways ({gateways.length})</h3>
              </div>
            </div>

            <div className="space-y-3">
              {gateways.map(gw => (
                <div
                  key={gw.id}
                  onClick={() => navigate(`/central/gateways/${gw.id}`)}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs text-slate-900">{gw.id}</span>
                      <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                        {gw.meshId}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {gw.syncStatus}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-700">{gw.name}</p>
                  
                  <div className="mt-2 text-xs text-slate-600 flex justify-between">
                    <span>Connected Nodes: <strong>{gw.connectedNodes}/{gw.totalNodes}</strong></span>
                    <span>Mesh: <strong className="text-emerald-600">{gw.meshHealth}</strong></span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-cyan-600 font-bold">
                    <span>Open Gateway View</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Node Tier Breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Sensor Node Distribution
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                <span className="font-medium text-slate-700">Tier-1 Surface Extensometer</span>
                <span className="font-bold text-slate-900">{nodes.filter(n => n.nodeTier?.includes('Tier-1')).length} nodes</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                <span className="font-medium text-slate-700">Tier-2 Sub-Surface MPBX</span>
                <span className="font-bold text-slate-900">{nodes.filter(n => n.nodeTier?.includes('Tier-2')).length} nodes</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                <span className="font-medium text-slate-700">Tier-3 In-Seam Multi-Param</span>
                <span className="font-bold text-slate-900">{nodes.filter(n => n.nodeTier?.includes('Tier-3')).length} nodes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Historical Trend Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Panel Telemetry & Risk Trend</h3>
                <p className="text-xs text-slate-500">Historical telemetry aggregated across {panel.id}</p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  {(['24h', '7d', '30d'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setTimeRange(t)}
                      className={`px-2.5 py-1 rounded-lg transition-all ${timeRange === t ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Metric Selectors */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { id: 'displacement', label: 'Displacement (mm)' },
                { id: 'tilt', label: 'Strata Tilt (°)' },
                { id: 'vibration', label: 'Vibration (g)' },
                { id: 'riskScore', label: 'Risk Score (%)' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setTrendMetric(m.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    trendMetric === m.id 
                      ? 'bg-cyan-500 text-white shadow-sm' 
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Recharts Area Chart */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="panelColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isCritical ? '#ef4444' : '#0ea5e9'} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={isCritical ? '#ef4444' : '#0ea5e9'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dx={-8} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Area 
                    type="monotone" 
                    dataKey={trendMetric} 
                    stroke={isCritical ? '#ef4444' : '#0ea5e9'} 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#panelColor)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Panel Alerts */}
          {alerts.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Active Alerts in {panel.id}</h4>
              <div className="space-y-2">
                {alerts.map(a => (
                  <div key={a.id} className="p-2.5 bg-red-50/60 border border-red-200/70 rounded-xl flex items-start space-x-2 text-xs">
                    <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-red-900">{a.title}</span>
                      <p className="text-slate-600 mt-0.5">{a.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
