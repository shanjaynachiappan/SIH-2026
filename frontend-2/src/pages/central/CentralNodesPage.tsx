import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Search, 
  Battery, 
  BatteryMedium, 
  BatteryLow, 
  X, 
  ChevronRight
} from 'lucide-react';
import { centralApiService } from '../../services/centralApiService';
import { MonitoringNode } from '../../types';
import { MinePanel, GatewayInfo } from '../../types/central';
import { useMine } from '../../context/MineContext';

export const CentralNodesPage: React.FC = () => {
  const { selectedMineId } = useMine();
  const [nodes, setNodes] = useState<MonitoringNode[]>([]);
  const [panels, setPanels] = useState<MinePanel[]>([]);
  const [gateways, setGateways] = useState<GatewayInfo[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [panelFilter, setPanelFilter] = useState('ALL');
  const [gatewayFilter, setGatewayFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  // Selected Node for Drawer
  const [inspectedNode, setInspectedNode] = useState<MonitoringNode | null>(null);

  useEffect(() => {
    const load = async () => {
      const activeMine = selectedMineId === 'ALL' ? undefined : selectedMineId;
      const [nList, pList, gList] = await Promise.all([
        centralApiService.getCentralNodes({ mineId: activeMine }),
        centralApiService.getPanels(activeMine),
        centralApiService.getGateways(activeMine)
      ]);
      setNodes(nList);
      setPanels(pList);
      setGateways(gList);
    };
    load();
  }, [selectedMineId]);

  const filteredNodes = nodes.filter(n => {
    if (panelFilter !== 'ALL' && n.panelId !== panelFilter) return false;
    if (gatewayFilter !== 'ALL' && n.gatewayId !== gatewayFilter) return false;
    if (tierFilter !== 'ALL' && !n.nodeTier?.includes(tierFilter)) return false;
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'ONLINE' && n.status === 'offline') return false;
      if (statusFilter === 'OFFLINE' && n.status !== 'offline') return false;
    }
    if (riskFilter !== 'ALL') {
      if (riskFilter === 'CRITICAL' && n.status !== 'critical') return false;
      if (riskFilter === 'WARNING' && n.status !== 'warning') return false;
      if (riskFilter === 'NORMAL' && n.status !== 'normal') return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        n.id.toLowerCase().includes(q) ||
        n.panelId?.toLowerCase().includes(q) ||
        n.gatewayId?.toLowerCase().includes(q) ||
        n.nodeType?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getBatteryIcon = (lvl: number) => {
    if (lvl > 60) return <Battery className="w-4 h-4 text-emerald-500" />;
    if (lvl > 20) return <BatteryMedium className="w-4 h-4 text-yellow-500" />;
    return <BatteryLow className="w-4 h-4 text-red-500 animate-pulse" />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Radio className="w-6 h-6 text-cyan-600" />
            <h1 className="text-2xl font-bold text-slate-900">Mine-Wide Sensor Node Inventory</h1>
          </div>
          <p className="text-sm text-slate-500">Central inventory of all 240 monitoring devices spanning 5 panels and 8 gateways</p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-semibold">
          <span className="bg-slate-100 px-3 py-1.5 rounded-xl text-slate-700">
            Showing: <strong className="text-slate-900">{filteredNodes.length}</strong> / 240 Nodes
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Node ID (e.g. N127, N018)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>

        {/* Panel Filter */}
        <select
          value={panelFilter}
          onChange={(e) => {
            setPanelFilter(e.target.value);
            setGatewayFilter('ALL');
          }}
          className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl outline-none"
        >
          <option value="ALL">All Panels</option>
          {panels.map(p => (
            <option key={p.id} value={p.id}>{p.id} ({p.name})</option>
          ))}
        </select>

        {/* Gateway Filter */}
        <select
          value={gatewayFilter}
          onChange={(e) => setGatewayFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl outline-none"
        >
          <option value="ALL">All Gateways</option>
          {gateways
            .filter(g => panelFilter === 'ALL' || g.panelId === panelFilter)
            .map(g => (
              <option key={g.id} value={g.id}>{g.id} ({g.panelId})</option>
            ))}
        </select>

        {/* Node Tier Filter */}
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl outline-none"
        >
          <option value="ALL">All Node Tiers</option>
          <option value="Tier-1">Tier-1 (Surface Extensometer)</option>
          <option value="Tier-2">Tier-2 (Sub-Surface MPBX)</option>
          <option value="Tier-3">Tier-3 (In-Seam Multi-Param)</option>
        </select>

        {/* Risk Filter */}
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl outline-none"
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
          className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl outline-none"
        >
          <option value="ALL">All Status</option>
          <option value="ONLINE">Online Only</option>
          <option value="OFFLINE">Offline Only</option>
        </select>

        {(panelFilter !== 'ALL' || gatewayFilter !== 'ALL' || tierFilter !== 'ALL' || riskFilter !== 'ALL' || statusFilter !== 'ALL' || search) && (
          <button
            onClick={() => {
              setSearch('');
              setPanelFilter('ALL');
              setGatewayFilter('ALL');
              setTierFilter('ALL');
              setStatusFilter('ALL');
              setRiskFilter('ALL');
            }}
            className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 px-3 py-2 rounded-xl"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Nodes Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Node ID</th>
                <th className="px-4 py-3">Panel</th>
                <th className="px-4 py-3">Gateway</th>
                <th className="px-4 py-3">Mesh</th>
                <th className="px-4 py-3">Node Tier</th>
                <th className="px-4 py-3">Displacement</th>
                <th className="px-4 py-3">Tilt</th>
                <th className="px-4 py-3">Vibration</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3">Battery</th>
                <th className="px-4 py-3">Last Seen</th>
                <th className="px-4 py-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredNodes.slice(0, 100).map(node => {
                const isOff = node.status === 'offline';
                const isCrit = node.status === 'critical';
                const isWarn = node.status === 'warning';

                return (
                  <tr 
                    key={node.id} 
                    onClick={() => setInspectedNode(node)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${
                        isCrit ? 'bg-red-500 animate-ping' :
                        isWarn ? 'bg-amber-500' :
                        isOff ? 'bg-slate-400' : 'bg-emerald-500'
                      }`}></span>
                      <span>{node.id}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {node.panelId}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {node.gatewayId}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">
                      {node.meshId}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {node.nodeTier?.split(' ')[0]}
                    </td>
                    <td className="px-4 py-3 font-bold font-mono">
                      {isOff || node.displacement === undefined ? '--' : `${node.displacement.toFixed(1)} mm`}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {isOff || node.tilt === undefined ? '--' : `${node.tilt.toFixed(2)}°`}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {isOff || node.vibration === undefined ? '--' : `${node.vibration.toFixed(2)} g`}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isCrit ? 'bg-red-50 text-red-700 border border-red-200' :
                        isWarn ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        isOff ? 'bg-slate-100 text-slate-500' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {node.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex items-center space-x-1">
                      {getBatteryIcon(node.battery)}
                      <span className="font-semibold text-slate-700">{node.battery}%</span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-500">
                      {node.lastSeenAgo || 'Just now'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-cyan-600 group-hover:text-cyan-700 font-bold inline-flex items-center">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Node Inspector Drawer Modal */}
      {inspectedNode && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Node {inspectedNode.id}</h2>
                    <p className="text-xs text-slate-500 font-mono">
                      {inspectedNode.panelId} • {inspectedNode.gatewayId} • {inspectedNode.meshId}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectedNode(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Badge */}
              <div className="mt-4 flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-xs font-semibold text-slate-600">Surveillance Status:</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded uppercase ${
                  inspectedNode.status === 'critical' ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse' :
                  inspectedNode.status === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {inspectedNode.status}
                </span>
              </div>

              {/* Real-time Telemetry */}
              <div className="mt-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Live Sensor Readings</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Displacement</div>
                    <div className="text-xl font-black text-slate-900 mt-0.5">
                      {inspectedNode.displacement !== undefined ? `${inspectedNode.displacement.toFixed(1)} mm` : '--'}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Angular Tilt</div>
                    <div className="text-xl font-black text-slate-900 mt-0.5">
                      {inspectedNode.tilt !== undefined ? `${inspectedNode.tilt.toFixed(2)}°` : '--'}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Vibration</div>
                    <div className="text-xl font-black text-slate-900 mt-0.5">
                      {inspectedNode.vibration !== undefined ? `${inspectedNode.vibration.toFixed(2)} g` : '--'}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Crack Detection</div>
                    <div className="text-xl font-black text-slate-900 mt-0.5">
                      {inspectedNode.crackDetected ? `${inspectedNode.crackWidthMm} mm` : 'None'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hardware Telemetry */}
              <div className="mt-5 space-y-2 text-xs">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hardware Telemetry</h3>
                <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-500">Tier Specification:</span>
                  <span className="font-semibold text-slate-800">{inspectedNode.nodeTier}</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-500">Coordinates:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {inspectedNode.latitude.toFixed(4)}, {inspectedNode.longitude.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-500">Battery Level:</span>
                  <span className="font-bold text-slate-800">{inspectedNode.battery}%</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-500">LoRa RSSI Signal:</span>
                  <span className="font-mono text-slate-800">{inspectedNode.signalDbm || -68} dBm</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => setInspectedNode(null)}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
