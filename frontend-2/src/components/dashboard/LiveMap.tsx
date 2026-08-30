import React, { useState } from 'react';
import { Maximize, Play, Square } from 'lucide-react';
import { MineGISMap } from '../gis/MineGISMap';
import { Link } from 'react-router-dom';

interface LiveMapProps {
  nodes?: any; // To not break Dashboard which passes this
}

export const LiveMap: React.FC<LiveMapProps> = () => {
  const [isSimulating, setIsSimulating] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card flex flex-col h-[500px] overflow-hidden relative">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-20">
        <div className="flex items-center space-x-3">
          <h2 className="text-base font-bold text-slate-800">Automated GIS Prototype</h2>
          <span className={`flex items-center text-[10px] font-bold ${isSimulating ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-slate-600 bg-slate-50 border-slate-200'} px-2 py-0.5 rounded-full uppercase tracking-wide border`}>
            {isSimulating && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>}
            {isSimulating ? 'Simulating' : 'Paused'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isSimulating ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
          >
            {isSimulating ? <><Square className="w-3 h-3 mr-1" /> Stop</> : <><Play className="w-3 h-3 mr-1" /> Start Sim</>}
          </button>
          
          <Link to="/live-map" className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-lg border border-slate-200 transition-colors">
            <Maximize className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="flex-1 relative z-10 bg-slate-50">
        <MineGISMap nodeCount={20} isSimulating={isSimulating} />
      </div>
    </div>
  );
};
