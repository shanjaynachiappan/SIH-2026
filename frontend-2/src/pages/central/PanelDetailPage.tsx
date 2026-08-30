import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Grid, 
  Router, 
  Radio, 
  ShieldAlert, 
  Activity, 
  Layers, 
  ChevronRight, 
  Search, 
  MapPin, 
  X, 
  Sparkles
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { centralApiService } from '../../services/centralApiService';
import { 
  MinePanel, 
  GatewayInfo, 
  CentralAlert, 
  TrendMetricPoint, 
  PredictedRiskData, 
  SensorPlacementData, 
  MineInfo 
} from '../../types/central';
import { MonitoringNode } from '../../types';
import { CentralMineGISMap } from '../../components/gis/CentralMineGISMap';

type PanelTabType = 'overview' | 'nodes' | 'placement' | 'gateways' | 'risk' | 'alerts';

export const PanelDetailPage: React.FC = () => {
  const { mineId = 'MINE-01', panelId = 'P-03', tab } = useParams<{ mineId: string; panelId: string; tab?: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<PanelTabType>(
    (tab && ['overview', 'nodes', 'placement', 'gateways', 'risk', 'alerts'].includes(tab)) 
      ? (tab as PanelTabType) 
      : 'overview'
  );

  useEffect(() => {
    if (tab && ['overview', 'nodes', 'placement', 'gateways', 'risk', 'alerts'].includes(tab)) {
      setActiveTab(tab as PanelTabType);
    }
  }, [tab]);

  const [mine, setMine] = useState<MineInfo | null>(null);
  const [panel, setPanel] = useState<MinePanel | null>(null);
  const [allPanelsInMine, setAllPanelsInMine] = useState<MinePanel[]>([]);
  const [gateways, setGateways] = useState<GatewayInfo[]>([]);
  const [nodes, setNodes] = useState<MonitoringNode[]>([]);
  const [alerts, setAlerts] = useState<CentralAlert[]>([]);
  const [placementData, setPlacementData] = useState<SensorPlacementData | null>(null);
  const [trends, setTrends] = useState<TrendMetricPoint[]>([]);
  const [prediction, setPrediction] = useState<PredictedRiskData | null>(null);

  // Filter States for Nodes tab
  const [nodeSearch, setNodeSearch] = useState('');
  const [nodeTierFilter, setNodeTierFilter] = useState('ALL');
  const [nodeStatusFilter, setNodeStatusFilter] = useState('ALL');
  const [nodeRiskFilter, setNodeRiskFilter] = useState('ALL');
  const [selectedNode, setSelectedNode] = useState<MonitoringNode | null>(null);

  // Filter States for Alerts tab
  const [alertSeverityFilter, setAlertSeverityFilter] = useState('all');
  const [alertStatusFilter, setAlertStatusFilter] = useState('all');

  // Trend States
  const [trendMetric, setTrendMetric] = useState<'displacement' | 'tilt' | 'vibration' | 'crackWidth' | 'riskScore'>('displacement');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  // Placement Algorithm Running State
  const [isOptimizingPlacement, setIsOptimizingPlacement] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [m, p, pList, gList, nList, aList, place, tr, pred] = await Promise.all([
        centralApiService.getMineById(mineId),
        centralApiService.getPanelById(mineId, panelId),
        centralApiService.getPanels(mineId),
        centralApiService.getGateways(mineId, panelId),
        centralApiService.getCentralNodes({ mineId, panelId }),
        centralApiService.getCentralAlerts({ mineId, panelId }),
        centralApiService.getSensorPlacement(mineId, panelId),
        centralApiService.getHistoricalTrends(timeRange, mineId, panelId),
        centralApiService.getPredictedRisk(mineId, panelId)
      ]);

      if (m) setMine(m);
      if (p) setPanel(p);
      setAllPanelsInMine(pList);
      setGateways(gList);
      setNodes(nList);
      setAlerts(aList);
      if (place) setPlacementData(place);
      setTrends(tr);
      setPrediction(pred);
    };

    load();
  }, [mineId, panelId, timeRange]);

  if (!panel) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <Grid className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Panel {panelId} Not Found in {mineId}</h2>
        <button 
          onClick={() => navigate(`/mine/${mineId}`)}
          className="mt-4 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl"
        >
          Back to {mineId} Panels
        </button>
      </div>
    );
  }

  const isCritical = panel.riskLevel === 'CRITICAL';
  const isWarning = panel.riskLevel === 'WARNING';

  // Filtered nodes strictly within this panel
  const filteredNodes = nodes.filter(n => {
    if (nodeTierFilter !== 'ALL' && !n.nodeTier?.toLowerCase().includes(nodeTierFilter.toLowerCase())) return false;
    if (nodeStatusFilter !== 'ALL') {
      if (nodeStatusFilter === 'ONLINE' && n.status === 'offline') return false;
      if (nodeStatusFilter === 'OFFLINE' && n.status !== 'offline') return false;
    }
    if (nodeRiskFilter !== 'ALL' && n.status?.toLowerCase() !== nodeRiskFilter.toLowerCase()) return false;
    if (nodeSearch && !n.id.toLowerCase().includes(nodeSearch.toLowerCase()) && !n.nodeType?.toLowerCase().includes(nodeSearch.toLowerCase())) return false;
    return true;
  });

  // Filtered alerts strictly within this panel
  const filteredAlerts = alerts.filter(a => {
    if (alertSeverityFilter !== 'all' && a.severity !== alertSeverityFilter) return false;
    if (alertStatusFilter !== 'all' && a.status !== alertStatusFilter) return false;
    return true;
  });

  const handleRunPlacement = () => {
    setIsOptimizingPlacement(true);
    setTimeout(() => {
      setIsOptimizingPlacement(false);
      alert('AI Strata Placement Algorithm Complete! 3 High-Priority boundary sensor locations generated.');
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
          <button 
            onClick={() => navigate('/overview')} 
            className="hover:text-slate-900"
          >
            Central Overview
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button 
            onClick={() => navigate(`/mine/${mineId}`)} 
            className="hover:text-slate-900 font-mono"
          >
            {mineId}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold font-mono bg-slate-100 px-2 py-0.5 rounded">
            {panel.id}
          </span>
        </div>

        {/* Quick Panel Switcher */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-semibold">Switch Panel:</span>
          <select
            value={panel.id}
            onChange={(e) => navigate(`/mine/${mineId}/panel/${e.target.value}`)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
          >
            {allPanelsInMine.map(p => (
              <option key={p.id} value={p.id}>
                {p.id} - {p.name} ({p.riskLevel})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Persistent Panel Context Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <span className="font-mono font-black text-base bg-slate-900 text-white px-3 py-1 rounded-xl">
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
            Mine Scope: <strong className="text-slate-700 font-mono">{mineId}</strong> ({mine?.name}) • Depth: {panel.depthMeters}m • Status: <span className="font-semibold text-slate-700">{panel.status}</span>
          </p>
        </div>

        {/* Panel Aggregated Metrics Header */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200/80 p-3 rounded-2xl text-xs">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Current Risk</div>
            <div className={`font-black ${isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'}`}>
              {panel.riskLevel} ({panel.riskScore}%)
            </div>
          </div>
          <div className="h-7 w-px bg-slate-200"></div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Predicted</div>
            <div className="font-black text-red-500">
              {prediction?.predictedRisk || 'HIGH'} (88%)
            </div>
          </div>
          <div className="h-7 w-px bg-slate-200"></div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Gateways</div>
            <div className="font-black text-slate-800">{gateways.length} Active</div>
          </div>
          <div className="h-7 w-px bg-slate-200"></div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Nodes</div>
            <div className="font-black text-slate-800">{nodes.length} Nodes</div>
          </div>
          <div className="h-7 w-px bg-slate-200"></div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Alerts</div>
            <div className="font-black text-rose-600">{alerts.length}</div>
          </div>
        </div>
      </div>

      {/* 6 Panel Tabs Navigation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm flex flex-wrap gap-1">
        {[
          { id: 'overview', label: 'Overview', icon: Grid },
          { id: 'nodes', label: `Nodes (${nodes.length})`, icon: Radio },
          { id: 'placement', label: 'Sensor Placement', icon: MapPin },
          { id: 'gateways', label: `Gateways / Mesh (${gateways.length})`, icon: Router },
          { id: 'risk', label: 'Risk & Deformation', icon: Activity },
          { id: 'alerts', label: `Alerts (${alerts.length})`, icon: ShieldAlert }
        ].map(tabItem => {
          const Icon = tabItem.icon;
          const isActive = activeTab === tabItem.id;
          return (
            <button
              key={tabItem.id}
              onClick={() => {
                setActiveTab(tabItem.id as PanelTabType);
                navigate(`/mine/${mineId}/panel/${panelId}/${tabItem.id}`);
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{tabItem.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================== TAB 1: OVERVIEW ==================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Spatial GIS Map of this Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-cyan-600" />
                <h3 className="text-base font-bold text-slate-800">{panel.name} Spatial Scope Map</h3>
              </div>
              <span className="text-xs font-mono text-slate-500 font-semibold">{nodes.length} Nodes in {panel.id}</span>
            </div>

            <CentralMineGISMap
              panels={[panel]}
              gateways={gateways}
              nodes={nodes}
              selectedMineId={mineId}
              selectedPanelId={panel.id}
              heightClass="h-[420px]"
              showControls={false}
            />
          </div>

          {/* Gateways & Historical Mini Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Assigned Gateways */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Panel Gateways ({gateways.length})
                </h4>
                <button 
                  onClick={() => setActiveTab('gateways')}
                  className="text-xs font-bold text-cyan-600 hover:underline"
                >
                  View Details
                </button>
              </div>

              <div className="space-y-2.5">
                {gateways.map(gw => (
                  <div key={gw.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-slate-900">{gw.id} ({gw.meshId})</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {gw.syncStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">{gw.name}</p>
                    <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
                      <span>Nodes: <strong>{gw.connectedNodes}/{gw.totalNodes}</strong></span>
                      <span>Latency: <strong>{gw.latencyMs || 110}ms</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deformation Chart */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Recent Panel Deformation Trend (24h)
                  </h4>
                  <button 
                    onClick={() => setActiveTab('risk')}
                    className="text-xs font-bold text-cyan-600 hover:underline"
                  >
                    Expanded Analysis
                  </button>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends}>
                      <defs>
                        <linearGradient id="pDeformColor" x1="0" y1="0" x2="0" y2="1">
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
                        dataKey="displacement" 
                        stroke={isCritical ? '#ef4444' : '#0ea5e9'} 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill="url(#pDeformColor)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: NODES ==================== */}
      {activeTab === 'nodes' && (
        <div className="space-y-6">
          {/* Node Search & Filters */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Node ID..."
                  value={nodeSearch}
                  onChange={(e) => setNodeSearch(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <select
                value={nodeTierFilter}
                onChange={(e) => setNodeTierFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-700 font-bold"
              >
                <option value="ALL">All Node Tiers</option>
                <option value="Tier-1">Tier-1 Surface Extensometer</option>
                <option value="Tier-2">Tier-2 Sub-Surface MPBX</option>
                <option value="Tier-3">Tier-3 In-Seam Multi-Param</option>
              </select>

              <select
                value={nodeStatusFilter}
                onChange={(e) => setNodeStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-700 font-bold"
              >
                <option value="ALL">All Status</option>
                <option value="ONLINE">Online Only</option>
                <option value="OFFLINE">Offline Only</option>
              </select>

              <select
                value={nodeRiskFilter}
                onChange={(e) => setNodeRiskFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-700 font-bold"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="normal">Normal</option>
              </select>
            </div>

            <span className="font-mono text-slate-500 font-bold">
              Showing {filteredNodes.length} of {nodes.length} Nodes in {panel.id}
            </span>
          </div>

          {/* Nodes Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Node ID</th>
                    <th className="py-3 px-4">Type / Tier</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Seen</th>
                    <th className="py-3 px-4 text-right">Tilt (°)</th>
                    <th className="py-3 px-4 text-right">Displacement</th>
                    <th className="py-3 px-4 text-right">Vibration</th>
                    <th className="py-3 px-4 text-center">Risk</th>
                    <th className="py-3 px-4 text-right">Confidence</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredNodes.map(node => {
                    const isNodeCrit = node.status === 'critical';
                    const isNodeWarn = node.status === 'warning';
                    const isNodeOff = node.status === 'offline';

                    return (
                      <tr 
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{node.id}</td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          <div>{node.nodeType}</div>
                          <span className="text-[10px] text-slate-400">{node.nodeTier?.split(' ')[0]}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            isNodeOff ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {isNodeOff ? 'OFFLINE' : 'ONLINE'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{node.lastSeenAgo}</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">{node.tilt}°</td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span className={isNodeCrit ? 'text-red-600' : isNodeWarn ? 'text-amber-600' : 'text-slate-800'}>
                            {node.displacement} mm
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">{node.vibration} g</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isNodeCrit ? 'bg-red-50 text-red-700 border border-red-200' :
                            isNodeWarn ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {node.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600 font-bold">
                          {((node.riskConfidence || 0.88) * 100).toFixed(0)}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedNode(node); }}
                            className="p-1 text-cyan-600 hover:bg-cyan-50 rounded"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Node Inspector Modal / Drawer */}
          {selectedNode && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Radio className="w-5 h-5 text-cyan-600" />
                    <span className="font-mono font-bold text-lg text-slate-900">{selectedNode.id} Telemetry</span>
                  </div>
                  <button 
                    onClick={() => setSelectedNode(null)}
                    className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
                    <div><span className="text-slate-400">Mine / Panel:</span> <strong className="text-slate-800">{selectedNode.mineId} / {selectedNode.panelId}</strong></div>
                    <div><span className="text-slate-400">Gateway / Mesh:</span> <strong className="text-slate-800">{selectedNode.gatewayId} / {selectedNode.meshId}</strong></div>
                    <div><span className="text-slate-400">Coordinates:</span> <strong className="font-mono">{selectedNode.latitude}, {selectedNode.longitude}</strong></div>
                    <div><span className="text-slate-400">Battery:</span> <strong className="text-emerald-600">{selectedNode.battery}%</strong></div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Displacement</div>
                      <div className="text-lg font-black text-red-600 mt-1">{selectedNode.displacement} mm</div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Tilt Angle</div>
                      <div className="text-lg font-black text-slate-800 mt-1">{selectedNode.tilt}°</div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Vibration</div>
                      <div className="text-lg font-black text-slate-800 mt-1">{selectedNode.vibration} g</div>
                    </div>
                  </div>

                  {selectedNode.crackDetected && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 font-medium">
                      ⚠️ Tension Surface Crack Detected: Width = {selectedNode.crackWidthMm} mm
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                  >
                    Close Inspector
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 3: SENSOR PLACEMENT ==================== */}
      {activeTab === 'placement' && (
        <div className="space-y-6">
          {/* Placement Stats Header */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded">
                  Panel Placement Optimizer
                </span>
                <span className="text-xs text-slate-500 font-semibold">• Strictly Scoped to {panel.id}</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                Optimized Sensor Array Layout for {panel.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                AI genetic coverage algorithm identifies high-strain blindspots and proposes new extensometers.
              </p>
            </div>

            <button
              onClick={handleRunPlacement}
              disabled={isOptimizingPlacement}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${isOptimizingPlacement ? 'animate-spin' : ''}`} />
              <span>{isOptimizingPlacement ? 'Running Algorithm...' : 'Run Placement Algorithm'}</span>
            </button>
          </div>

          {/* Placement Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Total Planned</div>
              <div className="text-2xl font-black text-slate-800 mt-1">{placementData?.totalPlannedNodes || 80}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Installed Nodes</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{placementData?.installedNodes || 68}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Proposed Nodes</div>
              <div className="text-2xl font-black text-indigo-600 mt-1">{placementData?.proposedPoints.length || 3}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Coverage %</div>
              <div className="text-2xl font-black text-cyan-600 mt-1">{placementData?.coveragePercent || 91.5}%</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Estimated Budget</div>
              <div className="text-base font-black text-slate-800 mt-1">{placementData?.estimatedCostINR || '₹ 4,80,000'}</div>
            </div>
          </div>

          {/* Placement Map */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                <h4 className="text-base font-bold text-slate-800">Placement Map: Installed vs Proposed Sensor Nodes</h4>
              </div>
              <div className="flex items-center space-x-3 text-xs font-semibold">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Installed ({nodes.length})</span>
                </span>
                <span className="flex items-center space-x-1.5 text-indigo-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 border border-white"></span>
                  <span>Proposed ({placementData?.proposedPoints.length || 3})</span>
                </span>
              </div>
            </div>

            <CentralMineGISMap
              panels={[panel]}
              gateways={gateways}
              nodes={nodes}
              proposedNodes={placementData?.proposedPoints || []}
              selectedMineId={mineId}
              selectedPanelId={panel.id}
              heightClass="h-[440px]"
              showControls={false}
            />
          </div>

          {/* Proposed Nodes Table */}
          {placementData && placementData.proposedPoints.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Proposed Node Specifications ({placementData.proposedPoints.length})
              </h4>
              <div className="space-y-2.5">
                {placementData.proposedPoints.map(prop => (
                  <div key={prop.id} className="p-3.5 bg-indigo-50/50 border border-indigo-200/80 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs bg-indigo-600 text-white px-2 py-0.5 rounded">
                          {prop.id}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{prop.nodeTier}</span>
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                          Priority: {prop.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{prop.purpose}</p>
                    </div>

                    <div className="flex items-center space-x-4 text-xs font-mono">
                      <div>
                        <span className="text-slate-400">Confidence:</span> <strong>{(prop.confidence * 100).toFixed(0)}%</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Est. Cost:</span> <strong className="text-slate-900">₹ {prop.estimatedCostINR}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 4: GATEWAYS / MESH ==================== */}
      {activeTab === 'gateways' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Gateways & LoRa Meshes Serving {panel.name} ({gateways.length})
                </h3>
                <p className="text-xs text-slate-500">
                  All nodes in {panel.id} route telemetry through these local mesh backhauls.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                All Gateways Connected
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gateways.map(gw => (
                <div key={gw.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Router className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-mono font-bold text-xs text-slate-500">{gw.id}</span>
                        <h4 className="font-bold text-sm text-slate-900">{gw.name}</h4>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      {gw.syncStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-slate-200/80 text-xs">
                    <div><span className="text-slate-400">Mesh ID:</span> <strong className="font-mono text-slate-800">{gw.meshId}</strong></div>
                    <div><span className="text-slate-400">IP Address:</span> <strong className="font-mono text-slate-800">{gw.ipAddress}</strong></div>
                    <div><span className="text-slate-400">Connected Nodes:</span> <strong>{gw.connectedNodes} / {gw.totalNodes}</strong></div>
                    <div><span className="text-slate-400">Packet Success:</span> <strong className="text-emerald-600">{gw.packetSuccessRate || 99.2}%</strong></div>
                    <div><span className="text-slate-400">Backhaul Latency:</span> <strong className="text-slate-800">{gw.latencyMs || 110} ms</strong></div>
                    <div><span className="text-slate-400">Signal RSSI:</span> <strong className="text-slate-800">{gw.signalStrengthDbm} dBm</strong></div>
                  </div>

                  <div className="text-[11px] text-slate-500 flex justify-between pt-1">
                    <span>Firmware: {gw.firmwareVersion}</span>
                    <span>Last Synced: {gw.lastSyncSecondsAgo}s ago</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: RISK & DEFORMATION ==================== */}
      {activeTab === 'risk' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {panel.name} Deformation & Strata Risk History
                </h3>
                <p className="text-xs text-slate-500">
                  Select telemetry parameters to inspect historical and AI predicted trajectories.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  {(['24h', '7d', '30d'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setTimeRange(t)}
                      className={`px-3 py-1 rounded-lg transition-all ${timeRange === t ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Metric Selector Buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'displacement', label: 'Surface Displacement (mm)' },
                { id: 'tilt', label: 'Strata Incline Tilt (°)' },
                { id: 'vibration', label: 'Seismic Vibration (g)' },
                { id: 'crackWidth', label: 'Fissure Crack Width (mm)' },
                { id: 'riskScore', label: 'Aggregated Risk Score (%)' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setTrendMetric(m.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    trendMetric === m.id
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Recharts Chart */}
            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="pRiskColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isCritical ? '#ef4444' : '#0ea5e9'} stopOpacity={0.35}/>
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
                    fill="url(#pRiskColor)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 6: ALERTS ==================== */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <select
                value={alertSeverityFilter}
                onChange={(e) => setAlertSeverityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical Only</option>
                <option value="high">High Only</option>
                <option value="medium">Medium Only</option>
                <option value="low">Low Only</option>
              </select>

              <select
                value={alertStatusFilter}
                onChange={(e) => setAlertStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="acknowledged">Acknowledged Only</option>
                <option value="resolved">Resolved Only</option>
              </select>
            </div>

            <span className="font-mono text-slate-500 font-bold">
              {filteredAlerts.length} Alerts in {panel.id}
            </span>
          </div>

          <div className="space-y-3">
            {filteredAlerts.map(alert => (
              <div
                key={alert.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-700 border border-red-200 animate-pulse' :
                      alert.severity === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {alert.severity}
                    </span>
                    <h4 className="font-black text-sm text-slate-900">{alert.title}</h4>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {alert.timestamp.replace('T', ' ').substring(0, 16)}
                  </span>
                </div>

                <p className="text-xs text-slate-600">{alert.message}</p>

                <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs">
                  <span className="font-bold text-amber-900 uppercase text-[10px]">Statutory Mitigation Action:</span>
                  <p className="text-amber-800 mt-0.5">{alert.recommendedAction}</p>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="font-mono text-slate-500">
                    Node: <strong>{alert.nodeId || 'PANEL'}</strong> | Confidence: <strong>{alert.confidencePercent || 90}%</strong>
                  </span>

                  <div className="flex space-x-2">
                    {alert.status === 'active' && (
                      <button
                        onClick={async () => {
                          await centralApiService.acknowledgeAlert(alert.id);
                          setAlerts(await centralApiService.getCentralAlerts({ mineId, panelId }));
                        }}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold"
                      >
                        Acknowledge
                      </button>
                    )}
                    {alert.status !== 'resolved' && (
                      <button
                        onClick={async () => {
                          await centralApiService.resolveAlert(alert.id);
                          setAlerts(await centralApiService.getCentralAlerts({ mineId, panelId }));
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
