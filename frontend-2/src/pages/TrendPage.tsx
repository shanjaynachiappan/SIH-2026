import React, { useState } from 'react';
import { BarChart2, Calendar, Download, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { deformationTrend } from '../data/mockData';

export const TrendPage: React.FC = () => {
  const [metric, setMetric] = useState('Displacement');
  const [timeRange, setTimeRange] = useState('24h');

  // We map the mock deformationTrend to whatever metric is selected just for visual demo
  const displayData = deformationTrend.map(d => ({
    time: d.time,
    value: metric === 'Displacement' ? d.deformation : d.deformation / 10 
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historical Trends</h1>
          <p className="text-sm text-slate-500">Analyze historical telemetry and risk data for Gateway GW-01.</p>
        </div>
        
        <div className="flex space-x-3 w-full md:w-auto">
          <button className="flex items-center space-x-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Sync Data</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Controls */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {['Displacement', 'Tilt', 'Vibration', 'Risk Score'].map(m => (
              <button 
                key={m}
                onClick={() => setMetric(m)}
                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${metric === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {m}
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 font-medium shadow-sm">
            <Calendar className="w-4 h-4 text-slate-500" />
            <select 
              className="bg-transparent outline-none cursor-pointer"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Chart Area */}
        <div className="p-6">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">{metric} Over Time</h3>
              <p className="text-sm text-slate-500">Averaged across all nodes in MESH-01</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-slate-800">
                {metric === 'Displacement' ? '18.4' : '1.8'}
                <span className="text-sm font-medium text-slate-500 ml-1">{metric === 'Displacement' ? 'mm avg' : 'avg'}</span>
              </div>
              <div className="text-sm font-bold text-emerald-500 flex items-center justify-end mt-1">
                <BarChart2 className="w-4 h-4 mr-1" /> Stable Trend
              </div>
            </div>
          </div>
          
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
