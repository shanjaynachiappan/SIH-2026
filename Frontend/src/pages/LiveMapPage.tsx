import React, { useState } from 'react';
import { MineGISMap } from '../components/gis/MineGISMap';
import { Play, Square, Settings, LayoutGrid, Layers, Activity } from 'lucide-react';

export const LiveMapPage: React.FC = () => {
  const [nodeCount, setNodeCount] = useState(20);
  const [isSimulating, setIsSimulating] = useState(false);
  const [tempCount, setTempCount] = useState(20);

  const handleGenerate = () => {
    setNodeCount(tempCount);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Live Map Workspace</h1>
          <p className="text-sm text-slate-500">Automated GIS Prototype & Monitoring Layout</p>
        </div>
        
        <div className="flex space-x-3 items-center">
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="text-xs font-semibold text-slate-600">Nodes:</span>
            <input 
              type="number" 
              value={tempCount}
              onChange={(e) => setTempCount(Number(e.target.value))}
              className="w-16 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              min="5" max="100"
            />
            <button 
              onClick={handleGenerate}
              className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded transition-colors"
            >
              Generate Layout
            </button>
          </div>
          
          <button 
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-colors ${isSimulating ? 'bg-red-500 hover:bg-red-600 text-white shadow-md' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md'}`}
          >
            {isSimulating ? <><Square className="w-4 h-4 mr-2" /> Stop Simulation</> : <><Play className="w-4 h-4 mr-2" /> Start Simulation</>}
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex">
        <div className="flex-1 relative">
           <MineGISMap nodeCount={nodeCount} isSimulating={isSimulating} />
        </div>
        
        <div className="w-64 border-l border-slate-200 bg-slate-50 p-4 flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
            <Settings className="w-4 h-4 mr-2 text-slate-500" /> Control Panel
          </h3>
          
          <div className="space-y-4 flex-1">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 mb-1 flex items-center"><LayoutGrid className="w-3 h-3 mr-1" /> Target Panel</div>
              <div className="font-bold text-slate-800 text-sm">Panel A (Mock)</div>
              <div className="text-[10px] text-slate-400 mt-1">GeoJSON Polygon</div>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 mb-1 flex items-center"><Activity className="w-3 h-3 mr-1" /> Nodes Placed</div>
              <div className="font-bold text-blue-600 text-lg">{nodeCount}</div>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 mb-1">Algorithm</div>
              <div className="font-bold text-slate-700 text-sm">Turf Point-in-Polygon</div>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 mb-1 flex items-center"><Layers className="w-3 h-3 mr-1" /> Interpolation</div>
              <div className="font-bold text-slate-700 text-sm">IDW (Power 2)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
