import React from 'react';
import { Radio, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const MetricBar: React.FC = () => {
  return (
    <div className="absolute bottom-8 left-8 right-8 z-20">
      <div className="bg-[#14213D]/80 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex justify-between items-center shadow-2xl">
        
        <div className="flex items-center space-x-3 px-4">
          <div className="bg-blue-500/20 p-2 rounded-lg">
            <Radio className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-xl font-bold text-white leading-tight">24</div>
            <div className="text-[10px] font-medium text-slate-300 uppercase tracking-wider">Sensors Online</div>
          </div>
        </div>

        <div className="w-px h-10 bg-white/10"></div>

        <div className="flex items-center space-x-3 px-4">
          <div className="bg-orange-500/20 p-2 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <div className="text-xl font-bold text-white leading-tight">2</div>
            <div className="text-[10px] font-medium text-slate-300 uppercase tracking-wider">Active Alerts</div>
          </div>
        </div>

        <div className="w-px h-10 bg-white/10"></div>

        <div className="flex items-center space-x-3 px-4">
          <div className="bg-red-500/20 p-2 rounded-lg">
            <ShieldAlert className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <div className="text-xl font-bold text-white leading-tight">78%</div>
            <div className="text-[10px] font-medium text-slate-300 uppercase tracking-wider">Risk Level</div>
          </div>
        </div>

        <div className="w-px h-10 bg-white/10"></div>

        <div className="flex items-center space-x-3 px-4">
          <div className="bg-emerald-500/20 p-2 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-xl font-bold text-white leading-tight">99.8%</div>
            <div className="text-[10px] font-medium text-slate-300 uppercase tracking-wider">System Uptime</div>
          </div>
        </div>

      </div>
    </div>
  );
};
