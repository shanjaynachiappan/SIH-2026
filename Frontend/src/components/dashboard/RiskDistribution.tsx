import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { RiskDistributionData } from '../../types';

interface RiskDistributionProps {
  data: RiskDistributionData[];
  total: number;
}

export const RiskDistribution: React.FC<RiskDistributionProps> = ({ data, total }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 h-full flex flex-col">
      <h2 className="text-base font-bold text-slate-800 mb-4">Risk Distribution</h2>

      <div className="flex-1 flex items-center justify-between">
        <div className="relative w-32 h-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-slate-800 leading-tight">{total}</span>
            <span className="text-[10px] font-semibold text-slate-400">Total</span>
          </div>
        </div>

        <div className="ml-4 flex-1 space-y-2">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-600 font-medium">{item.name}</span>
              </div>
              <span className="font-bold text-slate-800">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
