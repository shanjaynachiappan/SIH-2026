import React from 'react';

export const MapLegend: React.FC = () => {
  return (
    <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur px-4 py-3 rounded-xl shadow-lg border border-slate-200 z-[400] flex gap-8">
      <div>
        <h4 className="text-xs font-bold text-slate-800 mb-2">Deformation (mm)</h4>
        <div className="w-32 h-3 rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500 mb-1"></div>
        <div className="flex justify-between text-[10px] font-bold text-slate-600">
          <span>0</span>
          <span>25</span>
          <span>50+</span>
        </div>
      </div>
      
      <div className="border-l pl-6 border-slate-200">
        <h4 className="text-xs font-bold text-slate-800 mb-2">Risk Zones</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="flex items-center text-[10px] font-bold text-slate-600">
            <span className="w-2 h-2 rounded-full border-2 border-emerald-500 mr-1.5"></span> Low
          </div>
          <div className="flex items-center text-[10px] font-bold text-slate-600">
            <span className="w-2 h-2 rounded-full border-2 border-yellow-500 mr-1.5"></span> Mod
          </div>
          <div className="flex items-center text-[10px] font-bold text-slate-600">
            <span className="w-2 h-2 rounded-full border-2 border-orange-500 mr-1.5"></span> High
          </div>
          <div className="flex items-center text-[10px] font-bold text-slate-600">
            <span className="w-2 h-2 rounded-full border-2 border-red-500 mr-1.5"></span> Crit
          </div>
        </div>
      </div>
    </div>
  );
};
