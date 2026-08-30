import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Building2, 
  Grid, 
  Plus
} from 'lucide-react';
import { centralApiService } from '../../services/centralApiService';
import { MineInfo, MinePanel, GatewayInfo } from '../../types/central';

export const GatewayRegistryPage: React.FC = () => {
  const navigate = useNavigate();

  const [mines, setMines] = useState<MineInfo[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>('ALL');
  const [panels, setPanels] = useState<MinePanel[]>([]);
  const [selectedPanelId, setSelectedPanelId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const [gateways, setGateways] = useState<GatewayInfo[]>([]);

  useEffect(() => {
    const loadMines = async () => {
      const mList = await centralApiService.getMines();
      setMines(mList);
    };
    loadMines();
  }, []);

  useEffect(() => {
    const loadPanels = async () => {
      const pList = await centralApiService.getPanels(selectedMineId === 'ALL' ? undefined : selectedMineId);
      setPanels(pList);
      setSelectedPanelId('ALL');
    };
    loadPanels();
  }, [selectedMineId]);

  useEffect(() => {
    const loadGateways = async () => {
      const gList = await centralApiService.getGateways(
        selectedMineId === 'ALL' ? undefined : selectedMineId,
        selectedPanelId === 'ALL' ? undefined : selectedPanelId
      );
      setGateways(gList);
    };
    loadGateways();
  }, [selectedMineId, selectedPanelId]);

  const filteredGateways = gateways.filter(g => {
    if (statusFilter !== 'ALL' && g.status !== statusFilter) return false;
    if (search && !g.name.toLowerCase().includes(search.toLowerCase()) && !g.id.toLowerCase().includes(search.toLowerCase()) && !g.meshId.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black uppercase tracking-wider bg-cyan-50 text-cyan-700 border border-cyan-200 px-2.5 py-0.5 rounded">
              Central System Infrastructure
            </span>
            <span className="text-xs text-slate-500 font-semibold">• LoRa Mesh Gateway Registry</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Global Gateway & Mesh Node Registry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Hierarchical management and backhaul telemetry across all colliery extraction levels.
          </p>
        </div>

        <button
          onClick={() => alert('Add New Gateway Modal: Connects new hardware gateway to LoRa mesh backhaul.')}
          className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Gateway</span>
        </button>
      </div>

      {/* Hierarchical Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mine Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMineId}
              onChange={(e) => setSelectedMineId(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Mines</option>
              {mines.map(m => (
                <option key={m.id} value={m.id}>
                  {m.id} - {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Panel Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5">
            <Grid className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPanelId}
              onChange={(e) => setSelectedPanelId(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Panels</option>
              {panels.map(p => (
                <option key={p.id} value={p.id}>
                  {p.id} - {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 font-bold focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="ONLINE">Online Only</option>
            <option value="OFFLINE">Offline Only</option>
          </select>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Gateway / Mesh..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>

        <span className="font-mono text-slate-500 font-bold">
          {filteredGateways.length} Gateways Registered
        </span>
      </div>

      {/* Gateways Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Gateway ID</th>
                <th className="py-3 px-4">Mine / Panel</th>
                <th className="py-3 px-4">Mesh Network</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Sync State</th>
                <th className="py-3 px-4 text-center">Connected Nodes</th>
                <th className="py-3 px-4 text-right">Packet Delivery</th>
                <th className="py-3 px-4 text-right">Latency</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGateways.map(gw => (
                <tr key={`${gw.mineId}-${gw.id}`} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-black text-slate-900">{gw.id}</div>
                    <div className="text-[11px] text-slate-500">{gw.name}</div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">
                    <div>{gw.mineId}</div>
                    <span className="text-[10px] font-mono text-cyan-600 font-bold">{gw.panelId}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                    {gw.meshId}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {gw.ipAddress}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {gw.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      gw.syncStatus === 'SYNCED' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                      gw.syncStatus === 'DELAYED' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {gw.syncStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                    {gw.connectedNodes} / {gw.totalNodes}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                    {gw.packetSuccessRate || 99.2}%
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                    {gw.latencyMs || 110} ms
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => navigate(`/mine/${gw.mineId}/panel/${gw.panelId}`)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors"
                    >
                      View in Panel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
