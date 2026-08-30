import React from 'react';
import { Hexagon } from 'lucide-react';

export const Logo: React.FC = () => {
  return (
    <div className="flex items-center space-x-3 mb-8">
      <div className="bg-[#1769E0] p-2.5 rounded-xl text-white shadow-sm flex-shrink-0">
        <Hexagon className="w-7 h-7 fill-current" />
      </div>
      <div>
        <h1 className="text-2xl font-extrabold text-[#14213D] tracking-tight leading-tight">MineGuard</h1>
        <p className="text-xs text-slate-500 font-medium">Smart Subsidence Monitoring</p>
      </div>
    </div>
  );
};
