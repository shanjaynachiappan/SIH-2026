import React, { useState, useEffect } from 'react';
import { Search, Filter, Radio, Battery, BatteryMedium, BatteryLow, Activity, MapPin, Wifi, WifiOff, AlertTriangle, Settings, RefreshCw, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchLiveNodes } from '../services/apiService';
import { MonitoringNode } from '../types';
export const NodesPage: React.FC = () => {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [nodes, setNodes] = useState<MonitoringNode[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadNodes = async () => {
      const liveNodes = await fetchLiveNodes();
      if (isMounted) setNodes(liveNodes);
    };
    loadNodes();
    const interval = setInterval(loadNodes, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const getStatusConfig = (status: string) => {
    switch(status.toLowerCase()) {
      case 'critical': return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Critical' };
      case 'high': return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: 'High Risk' };
      case 'warning': return { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Warning' };
      case 'offline': return { color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-300', label: 'Offline' };
      case 'normal': 
      default: return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Normal' };
    }
  };

  const getBatteryIcon = (level: number) => {
    if (level > 60) return <Battery className="w-4 h-4 text-emerald-500" />;
    if (level > 20) return <BatteryMedium className="w-4 h-4 text-yellow-500" />;
    return <BatteryLow className="w-4 h-4 text-red-500 animate-pulse" />;
  };

  const filteredNodes = nodes.filter(node => {
    if (filter !== 'all') {
      if (filter === 'online' && node.status === 'offline') return false;
      if (filter === 'offline' && node.status !== 'offline') return false;
      if (filter === 'attention' && !['warning', 'high', 'critical'].includes(node.status.toLowerCase())) return false;
    }
    if (search && !node.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const onlineCount = nodes.filter(n => n.status !== 'offline').length;
  const offlineCount = nodes.filter(n => n.status === 'offline').length;
  const attentionCount = nodes.filter(n => ['warning', 'high', 'critical'].includes(n.status.toLowerCase())).length;
  const avgBattery = nodes.length > 0 ? Math.round(nodes.reduce((acc, n) => acc + n.battery, 0) / nodes.length) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Node Network Management</h1>
          <p className="text-sm text-slate-500">Monitor IoT devices, connectivity, and hardware telemetry for MESH-01.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Node ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center justify-center space-x-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors">
            <Filter className="w-4 h-4" />
            <span>Advanced Filters</span>
          </button>
          <button className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span>Scan Network</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div 
          onClick={() => setFilter('all')}
          className={`bg-white rounded-xl border ${filter === 'all' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'} p-4 shadow-sm cursor-pointer transition-all`}
        >
          <div className="flex items-center space-x-2 mb-2">
            <Radio className="w-4 h-4 text-blue-500" />
            <div className="text-xs font-bold text-slate-500 uppercase">Total Nodes</div>
          </div>
          <div className="text-2xl font-black text-slate-800">{nodes.length}</div>
        </div>

        <div 
          onClick={() => setFilter('online')}
          className={`bg-white rounded-xl border ${filter === 'online' ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-200'} p-4 shadow-sm cursor-pointer transition-all`}
        >
          <div className="flex items-center space-x-2 mb-2">
            <Wifi className="w-4 h-4 text-emerald-500" />
            <div className="text-xs font-bold text-emerald-600 uppercase">Online</div>
          </div>
          <div className="text-2xl font-black text-emerald-700">{onlineCount}</div>
        </div>

        <div 
          onClick={() => setFilter('offline')}
          className={`bg-white rounded-xl border ${filter === 'offline' ? 'border-slate-500 ring-1 ring-slate-500' : 'border-slate-200'} p-4 shadow-sm cursor-pointer transition-all`}
        >
          <div className="flex items-center space-x-2 mb-2">
            <WifiOff className="w-4 h-4 text-slate-400" />
            <div className="text-xs font-bold text-slate-500 uppercase">Offline</div>
          </div>
          <div className="text-2xl font-black text-slate-700">{offlineCount}</div>
        </div>

        <div 
          onClick={() => setFilter('attention')}
          className={`bg-white rounded-xl border ${filter === 'attention' ? 'border-orange-500 ring-1 ring-orange-500' : 'border-slate-200'} p-4 shadow-sm cursor-pointer transition-all`}
        >
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <div className="text-xs font-bold text-orange-600 uppercase">Needs Attention</div>
          </div>
          <div className="text-2xl font-black text-orange-700">{attentionCount}</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hidden md:block">
          <div className="flex items-center space-x-2 mb-2">
            <Battery className="w-4 h-4 text-emerald-500" />
            <div className="text-xs font-bold text-slate-500 uppercase">Avg Battery</div>
          </div>
          <div className="text-2xl font-black text-slate-800">{avgBattery}%</div>
        </div>
      </div>

      {/* Grid of Nodes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredNodes.map((node) => {
          const statusConfig = getStatusConfig(node.status);
          const isOffline = node.status === 'offline';
          
          return (
            <Link to={`/nodes/${node.id}`} key={node.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group block">
              {/* Card Header */}
              <div className={`px-4 py-3 border-b flex justify-between items-center ${statusConfig.bg} ${statusConfig.border}`}>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-slate-400' : 'bg-current animate-pulse'} ${statusConfig.color}`}></div>
                  <h3 className="text-sm font-bold text-slate-800">Node {node.id}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusConfig.color} bg-white/60 border border-current`}>
                    {statusConfig.label}
                  </span>
                  <ChevronRight className={`w-4 h-4 ${statusConfig.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
                </div>
              </div>
              
              <div className={`p-4 ${isOffline ? 'opacity-60' : 'opacity-100'}`}>
                {/* Readings Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Displacement</div>
                    <div className="flex items-end">
                      <span className="text-lg font-black text-slate-700">{isOffline || node.displacement === undefined ? '--' : node.displacement.toFixed(1)}</span>
                      <span className="text-[10px] text-slate-500 font-medium ml-1 mb-1">mm</span>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tilt</div>
                    <div className="flex items-end">
                      <span className="text-lg font-black text-slate-700">{isOffline || node.tilt === undefined ? '--' : node.tilt.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-500 font-medium ml-1 mb-1">°</span>
                    </div>
                  </div>
                </div>

                {/* Telemetry rows */}
                <div className="space-y-2 mb-5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 flex items-center"><Activity className="w-3.5 h-3.5 mr-1" /> Vibration</span>
                    <span className="font-semibold text-slate-700">{isOffline || node.vibration === undefined ? '--' : node.vibration.toFixed(2)} g</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> Coordinates</span>
                    <span className="font-mono text-slate-700">
                      {node.latitude.toFixed(4)}, {node.longitude.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 flex items-center">
                      {getBatteryIcon(node.battery)}
                      <span className="ml-1">Battery</span>
                    </span>
                    <span className={`font-semibold ${node.battery <= 20 ? 'text-red-500' : 'text-slate-700'}`}>
                      {node.battery}%
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="text-[10px] text-slate-400 font-medium">
                    {isOffline ? 'Last seen: 2 hours ago' : 'Updated: Just now'}
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Ping Node">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors" title="Configure">
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}

        {filteredNodes.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border border-slate-200 border-dashed">
            <Radio className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-lg text-slate-700">No nodes found</p>
            <p className="text-sm text-slate-500">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
};
