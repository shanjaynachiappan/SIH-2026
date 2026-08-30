import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Radio, Battery, Activity, Wifi, ShieldAlert, Clock, AlertTriangle } from 'lucide-react';
import { fetchLiveNodes } from '../services/apiService';
import { MonitoringNode } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Simple mock history for charts
const generateHistory = (base: number, variance: number, points: number = 10) => {
  return Array.from({ length: points }).map((_, i) => ({
    time: `${i * 2}h ago`,
    value: Math.max(0, base + (Math.random() * variance - variance / 2))
  })).reverse();
};

export const NodeDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [node, setNode] = useState<MonitoringNode | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadNode = async () => {
      const nodes = await fetchLiveNodes();
      const found = nodes.find(n => n.id === id);
      if (isMounted && found) setNode(found);
    };
    loadNode();
    const interval = setInterval(loadNode, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [id]);

  if (!node) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse flex flex-col items-center">
          <Radio className="w-10 h-10 text-slate-300 mb-4 animate-bounce" />
          <p className="text-slate-500 font-medium">Connecting to node...</p>
        </div>
      </div>
    );
  }

  const isOffline = node.status === 'offline';
  const riskColor = node.status === 'critical' ? 'text-red-500' : node.status === 'high' || node.status === 'warning' ? 'text-orange-500' : 'text-emerald-500';
  const riskBg = node.status === 'critical' ? 'bg-red-50' : node.status === 'high' || node.status === 'warning' ? 'bg-orange-50' : 'bg-emerald-50';

  const displacementHistory = generateHistory(node.displacement || 5, 2);
  const tiltHistory = generateHistory(node.tilt || 1, 0.5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/nodes" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-slate-900">Node {node.id}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${riskBg} ${riskColor} border border-current`}>
                {node.status}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">Gateway: GW-01 | Panel: P-01 | Mesh: MESH-01</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Node Tier</div>
          <div className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-md inline-block">
            {node.nodeType}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Metrics & Health */}
        <div className="space-y-6 lg:col-span-1">
          {/* Risk Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 flex items-center mb-4">
              <ShieldAlert className={`w-4 h-4 mr-2 ${riskColor}`} />
              Current Risk Assessment
            </h3>
            <div className="flex items-end space-x-2 mb-4">
              <span className="text-4xl font-black text-slate-800">{node.riskScore || 15}</span>
              <span className="text-sm text-slate-500 font-medium mb-1">/ 100 Score</span>
            </div>
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">RF Risk</span>
                <span className="font-semibold text-slate-700 uppercase">{node.status}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">LSTM Risk</span>
                <span className="font-semibold text-slate-700 uppercase">{node.status}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Model Confidence</span>
                <span className="font-semibold text-emerald-600">89.4%</span>
              </div>
            </div>
          </div>

          {/* Device Health Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 flex items-center mb-4">
              <Activity className="w-4 h-4 mr-2 text-blue-500" />
              Device Health
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 flex items-center"><Battery className="w-4 h-4 mr-2" /> Battery</span>
                <span className={`font-semibold ${node.battery <= 20 ? 'text-red-500' : 'text-slate-700'}`}>{node.battery}%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 flex items-center"><Wifi className="w-4 h-4 mr-2" /> Signal Strength</span>
                <span className="font-semibold text-slate-700">-68 dBm</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 flex items-center"><Clock className="w-4 h-4 mr-2" /> Last Seen</span>
                <span className="font-semibold text-slate-700">{isOffline ? '2 hours ago' : 'Just now'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sensor Data & Charts */}
        <div className="space-y-6 lg:col-span-2">
          {/* Current Readings Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase mb-2">Displacement</div>
              <div className="flex items-end">
                <span className="text-2xl font-black text-slate-800">{node.displacement !== undefined ? node.displacement.toFixed(1) : '--'}</span>
                <span className="text-sm text-slate-500 font-medium ml-1 mb-1">mm</span>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase mb-2">Tilt</div>
              <div className="flex items-end">
                <span className="text-2xl font-black text-slate-800">{node.tilt !== undefined ? node.tilt.toFixed(2) : '--'}</span>
                <span className="text-sm text-slate-500 font-medium ml-1 mb-1">°</span>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase mb-2">Vibration</div>
              <div className="flex items-end">
                <span className="text-2xl font-black text-slate-800">{node.vibration !== undefined ? node.vibration.toFixed(2) : '--'}</span>
                <span className="text-sm text-slate-500 font-medium ml-1 mb-1">g</span>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase mb-2">Crack Status</div>
              <div className="flex items-end mt-1">
                {Math.random() > 0.8 ? (
                  <span className="text-sm font-bold text-red-500 flex items-center bg-red-50 px-2 py-1 rounded-md"><AlertTriangle className="w-3.5 h-3.5 mr-1" /> DETECTED</span>
                ) : (
                  <span className="text-sm font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md">NORMAL</span>
                )}
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-6">Displacement Trend (Last 24h)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displacementHistory}>
                  <defs>
                    <linearGradient id="colorDisp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorDisp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-6">Tilt Trend (Last 24h)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tiltHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4, fill: '#8b5cf6', strokeWidth: 0}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
