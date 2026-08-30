import React from 'react';
import { Activity, Wifi, HardDrive, Cloud, CheckCircle2 } from 'lucide-react';

export const MeshHealthPanel: React.FC<{ onlineNodes: number, totalNodes: number }> = ({ onlineNodes, totalNodes }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 col-span-1 md:col-span-2 lg:col-span-1 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center">
          <Activity className="w-4 h-4 mr-2 text-blue-500" />
          Local Mesh Health
        </h3>
        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">MESH-01</span>
      </div>

      <div className="space-y-4 flex-1">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Gateway Status</span>
          <span className="flex items-center font-medium text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> ONLINE
          </span>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Nodes Connected</span>
          <span className="font-medium text-slate-700">{onlineNodes} / {totalNodes}</span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Packet Success</span>
          <span className="font-medium text-emerald-600">98.2%</span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Average Latency</span>
          <span className="font-medium text-amber-600">142 ms</span>
        </div>

        <div className="pt-3 border-t border-slate-100 space-y-3 mt-auto">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 flex items-center"><Wifi className="w-3.5 h-3.5 mr-1.5" /> Internet</span>
            <span className="font-medium text-emerald-600">ONLINE</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 flex items-center"><HardDrive className="w-3.5 h-3.5 mr-1.5" /> Local Storage</span>
            <span className="font-medium text-slate-700">34% Used</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 flex items-center"><Cloud className="w-3.5 h-3.5 mr-1.5" /> Cloud Sync</span>
            <span className="font-medium text-slate-500">Just now</span>
          </div>
        </div>
      </div>
    </div>
  );
};
