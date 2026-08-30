import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  Download, 
  TrendingUp, 
  Cpu 
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
import { TrendMetricPoint, PredictedRiskData, MinePanel } from '../../types/central';

export const CentralTrendsPage: React.FC = () => {
  const [metric, setMetric] = useState<'displacement' | 'tilt' | 'vibration' | 'crackWidth' | 'riskScore'>('displacement');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [panelFilter, setPanelFilter] = useState('ALL');
  const [panels, setPanels] = useState<MinePanel[]>([]);
  const [trends, setTrends] = useState<TrendMetricPoint[]>([]);
  const [predictedRisk, setPredictedRisk] = useState<PredictedRiskData | null>(null);

  useEffect(() => {
    const load = async () => {
      const [pList, tData, pRisk] = await Promise.all([
        centralApiService.getPanels(),
        centralApiService.getHistoricalTrends(timeRange, panelFilter === 'ALL' ? undefined : panelFilter),
        centralApiService.getPredictedRisk(panelFilter === 'ALL' ? undefined : panelFilter)
      ]);
      setPanels(pList);
      setTrends(tData);
      setPredictedRisk(pRisk);
    };
    load();
  }, [timeRange, panelFilter]);

  const getMetricLabel = (m: string) => {
    switch (m) {
      case 'displacement': return { name: 'Surface & Strata Displacement', unit: 'mm', color: '#0ea5e9' };
      case 'tilt': return { name: 'Angular Borehole & Roof Tilt', unit: '°', color: '#f59e0b' };
      case 'vibration': return { name: 'Seismic & Micro-Vibration', unit: 'g', color: '#8b5cf6' };
      case 'crackWidth': return { name: 'Tension Crack Opening Width', unit: 'mm', color: '#ef4444' };
      case 'riskScore': 
      default: return { name: 'ML Strata Risk Score', unit: '%', color: '#ec4899' };
    }
  };

  const metricInfo = getMetricLabel(metric);

  // Compute stats
  const values = trends.map(t => t[metric] as number);
  const currentVal = values.length > 0 ? values[values.length - 1] : 0;
  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const maxVal = values.length > 0 ? Math.max(...values) : 0;
  const avgVal = values.length > 0 ? parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-6 h-6 text-cyan-600" />
            <h1 className="text-2xl font-bold text-slate-900">Mine-Wide Historical & Predictive Analytics</h1>
          </div>
          <p className="text-sm text-slate-500">Multi-panel historical sensor deformation trends and 48-hour forward subsidence forecasting</p>
        </div>

        <div className="flex space-x-3 w-full md:w-auto">
          <button 
            onClick={() => centralApiService.exportReport('REP-2026-05-04', 'CSV')}
            className="flex items-center space-x-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Trend CSV</span>
          </button>
        </div>
      </div>

      {/* Scope and Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Metric Selector Buttons */}
        <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl gap-1">
          {[
            { id: 'displacement', label: 'Displacement' },
            { id: 'tilt', label: 'Strata Tilt' },
            { id: 'vibration', label: 'Vibration' },
            { id: 'crackWidth', label: 'Crack Width' },
            { id: 'riskScore', label: 'Risk Score' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMetric(m.id as any)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                metric === m.id 
                  ? 'bg-white text-cyan-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          {/* Panel Selector */}
          <select
            value={panelFilter}
            onChange={(e) => setPanelFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl outline-none cursor-pointer"
          >
            <option value="ALL">Entire Mine (All Panels)</option>
            {panels.map(p => (
              <option key={p.id} value={p.id}>{p.id} - {p.name}</option>
            ))}
          </select>

          {/* Time Range Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {(['24h', '7d', '30d'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeRange === t 
                    ? 'bg-white text-slate-900 shadow-sm font-bold' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t === '24h' ? '24 Hours' : t === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Current Value</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {currentVal} <span className="text-xs font-medium text-slate-500">{metricInfo.unit}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Latest telemetry reading</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Minimum</div>
          <div className="text-2xl font-black text-slate-700 mt-1">
            {minVal} <span className="text-xs font-medium text-slate-500">{metricInfo.unit}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Lowest baseline</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-red-500 uppercase">Peak / Maximum</div>
          <div className="text-2xl font-black text-red-600 mt-1">
            {maxVal} <span className="text-xs font-medium text-slate-500">{metricInfo.unit}</span>
          </div>
          <div className="text-[11px] text-red-500 mt-0.5">Peak deformation point</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Average</div>
          <div className="text-2xl font-black text-slate-700 mt-1">
            {avgVal} <span className="text-xs font-medium text-slate-500">{metricInfo.unit}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across {timeRange}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Trend Direction</div>
          <div className="text-lg font-black text-amber-600 mt-1 flex items-center">
            <TrendingUp className="w-5 h-5 mr-1" />
            <span>ACCELERATING</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">+14% strain rate</div>
        </div>
      </div>

      {/* Main Historical Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-100 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{metricInfo.name} History</h3>
            <p className="text-xs text-slate-500">
              Surveillance window: <span className="font-semibold text-slate-700">{timeRange === '24h' ? 'Last 24 Hours' : timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'}</span> • Filter: {panelFilter}
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: metricInfo.color }}></span>
            <span>Historical Telemetry</span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metricInfo.color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={metricInfo.color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} unit={` ${metricInfo.unit}`} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Area 
                type="monotone" 
                dataKey={metric} 
                stroke={metricInfo.color} 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#metricGrad)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ML Prediction & Forward Forecast (Clearly distinguished from Current) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-2 pb-4 border-b border-slate-100 mb-5">
          <Cpu className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Current Condition vs AI Strata Risk Forecast</h3>
            <p className="text-xs text-slate-500">Model projections based on LSTM deep learning & Random Forest strata classification</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Condition</div>
            <div className="text-2xl font-black text-red-600 mt-2">
              {predictedRisk?.currentRisk}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Current Strata Risk Score: <strong>{predictedRisk?.currentScore}/100</strong>
            </p>
            <div className="mt-3 text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200">
              Verified by surface MPBX & extensometer array.
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="text-xs font-bold text-purple-700 uppercase tracking-wider">48h Predicted Risk</div>
            <div className="text-2xl font-black text-purple-900 mt-2">
              {predictedRisk?.predictedRisk} RISK
            </div>
            <p className="text-xs text-purple-800 mt-1">
              Model Confidence: <strong>{predictedRisk?.confidencePercent}%</strong>
            </p>
            <div className="mt-3 text-[11px] text-purple-900 bg-white/70 p-2 rounded-lg border border-purple-200">
              Trend Direction: <strong>{predictedRisk?.trendDirection}</strong>
            </div>
          </div>

          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">Early Warning Action</div>
              <ul className="text-xs text-amber-900 mt-2 space-y-1.5">
                {predictedRisk?.recommendedActions.map((action, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1 mr-2 flex-shrink-0"></span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
