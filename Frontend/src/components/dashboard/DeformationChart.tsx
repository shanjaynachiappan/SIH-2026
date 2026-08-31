import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { DeformationDataPoint } from '../../types';

interface DeformationChartProps {
  data: DeformationDataPoint[];
}

export const DeformationChart: React.FC<DeformationChartProps> = ({ data }) => {
  const latestValue = data[data.length - 1]?.deformation || 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">Deformation Trend</h2>
          <p className="text-xs text-slate-500 font-medium">(Last 24 Hours)</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center space-x-2">
          <span className="text-sm font-bold text-slate-800">{latestValue} mm</span>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDeformation" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
              dx={-10}
            />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
              labelStyle={{ color: '#64748b', marginBottom: '4px' }}
            />
            <Area
              type="monotone"
              dataKey="deformation"
              stroke="#2563eb"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorDeformation)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
