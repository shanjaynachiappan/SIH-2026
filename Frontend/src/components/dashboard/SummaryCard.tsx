import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  sparklineData: { value: number }[];
  sparklineColor: string;
  valueColor?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor,
  iconColor,
  sparklineData,
  sparklineColor,
  valueColor
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card flex items-center justify-between">
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-xl ${iconBgColor}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-500 mb-1">{title}</h3>
          <div className="flex items-baseline space-x-2">
            <span className={`text-2xl font-bold ${valueColor ? valueColor : title === 'Overall Risk Level' ? 'text-red-500' : 'text-slate-800'}`}>
              {value}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">{subtitle}</p>
        </div>
      </div>
      
      <div className="w-24 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparklineData}>
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={sparklineColor} 
              strokeWidth={2} 
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
