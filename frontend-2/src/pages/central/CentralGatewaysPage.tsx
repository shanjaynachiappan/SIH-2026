import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Router, Search, ChevronRight } from 'lucide-react';
import { centralApiService } from '../../services/centralApiService';
import { GatewayInfo } from '../../types/central';
import { useMine } from '../../context/MineContext';

export const CentralGatewaysPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedMineId } = useMine();
  const [gateways, setGateways] = useState<GatewayInfo[]>([]);
  const [search, setSearch] = useState('');
  const [syncFilter, setSyncFilter] = useState('ALL');

  useEffect(() => {
    const load = async () => {
      const list = await centralApiService.getGateways(selectedMineId === 'ALL' ? undefined : selectedMineId);
      setGateways(list);
    };
    load();
  }, [selectedMineId]);

  const filteredGateways = gateways.filter(gw => {
    if (syncFilter !== 'ALL' && gw.syncStatus !== syncFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        gw.id.toLowerCase().includes(q) ||
        gw.name.toLowerCase().includes(q) ||
        gw.panelId.toLowerCase().includes(q) ||
        gw.meshId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getSyncBadge = (gw: GatewayInfo) => {
    if (gw.syncStatus === 'DELAYED') {
      return (
        <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span>
          DELAYED ({Math.floor(gw.lastSyncSecondsAgo / 60)}m ago)
        </span>
      );
    }
    if (gw.syncStatus === 'STALE' || gw.syncStatus === 'OFFLINE') {
      return (
        <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
          <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></span>
          STALE DATA
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
        SYNCED ({gw.lastSyncSecondsAgo}s ago)
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Router className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900">LoRa Mesh Gateway Monitoring</h1>
          </div>
          <p className="text-sm text-slate-500">Central telemetry and synchronization health across all 8 underground gateways</p>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by GW ID, panel, or mesh..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {['ALL', 'SYNCED', 'DELAYED'].map(f => (
              <button
                key={f}
                onClick={() => setSyncFilter(f)}
                className={`px-3 py-1.5 rounded-lg transition-all ${syncFilter === f ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Gateways</div>
          <div className="text-2xl font-black text-slate-800 mt-1">{gateways.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Distributed in 5 Panels</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-emerald-600 uppercase">Synced Gateways</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {gateways.filter(g => g.syncStatus === 'SYNCED').length}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Live streaming within 30s</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-amber-600 uppercase">Delayed Synchronization</div>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {gateways.filter(g => g.syncStatus === 'DELAYED').length}
          </div>
          <div className="text-[11px] text-amber-600 mt-0.5">GW-06 Backhaul retry</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Avg Mesh Quality</div>
          <div className="text-2xl font-black text-slate-800 mt-1">98.4%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Packet delivery ratio</div>
        </div>
      </div>

      {/* Gateways Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredGateways.map(gw => {
          const isCritical = gw.currentRisk === 'CRITICAL';
          const isWarning = gw.currentRisk === 'WARNING';

          return (
            <div
              key={gw.id}
              onClick={() => navigate(`/central/gateways/${gw.id}`)}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-sm bg-slate-100 text-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-200">
                      {gw.id}
                    </span>
                    <span className="text-xs font-bold text-slate-600">{gw.panelId}</span>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    isCritical ? 'bg-red-50 text-red-700 border border-red-200' :
                    isWarning ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {gw.currentRisk} Risk
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-3 group-hover:text-indigo-700 transition-colors">
                  {gw.name}
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">{gw.meshId} • IP {gw.ipAddress}</p>

                {/* Sync Badge */}
                <div className="mt-3">
                  {getSyncBadge(gw)}
                </div>

                {/* Telemetry Stats */}
                <div className="mt-4 space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between">
                    <span>Connected Nodes:</span>
                    <span className="font-bold text-slate-800">{gw.connectedNodes} / {gw.totalNodes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mesh Health:</span>
                    <span className="font-bold text-emerald-600">{gw.meshHealth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Signal Strength:</span>
                    <span className="font-mono font-semibold">{gw.signalStrengthDbm} dBm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Firmware:</span>
                    <span className="font-mono text-slate-500">{gw.firmwareVersion}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-bold">
                <span>View Gateway Details</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
