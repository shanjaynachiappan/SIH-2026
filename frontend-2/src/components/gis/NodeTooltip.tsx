import React from 'react';
import { MonitoringNode } from '../../types';

interface NodeTooltipProps {
  node: MonitoringNode;
}

export const NodeTooltip: React.FC<NodeTooltipProps> = ({ node }) => {
  return (
    <div className="font-sans w-52 text-sm text-slate-800 dark:text-slate-200">
      <div className="font-bold text-base border-b border-slate-200 dark:border-slate-700 pb-2 mb-2 text-center">
        NODE {node.id.toUpperCase()}
      </div>
      
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500 dark:text-slate-400">Final Risk</span>
          <span className="font-bold uppercase" style={{ color: getStatusColor(node.status) }}>
            {node.status}
          </span>
        </div>
        
        {node.zoneName && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">Zone</span>
            <span className="font-medium text-slate-700 dark:text-slate-300 text-right max-w-[120px] truncate" title={node.zoneName}>
              {node.zoneName}
            </span>
          </div>
        )}

        {node.lstmRisk && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">LSTM Risk</span>
            <span className="font-medium uppercase" style={{ color: getStatusColor(node.lstmRisk) }}>{node.lstmRisk}</span>
          </div>
        )}
        
        {node.rfRisk && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">RF Risk</span>
            <span className="font-medium uppercase" style={{ color: getStatusColor(node.rfRisk) }}>{node.rfRisk}</span>
          </div>
        )}

        {node.riskScore !== undefined && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">Risk Score</span>
            <span className="font-medium">{Math.round(node.riskScore * 100)}%</span>
          </div>
        )}
        
        {node.riskConfidence !== undefined && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">Confidence</span>
            <span className="font-medium">{Math.round(node.riskConfidence * 100)}%</span>
          </div>
        )}

        <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>

        {node.displacement !== undefined && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">Displacement</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">{node.displacement.toFixed(2)} mm</span>
          </div>
        )}

        {node.tilt !== undefined && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">Tilt</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">{node.tilt.toFixed(2)}°</span>
          </div>
        )}

        {node.vibration !== undefined && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">Vibration</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">{node.vibration.toFixed(2)}</span>
          </div>
        )}

        <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>

        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500 dark:text-slate-400">Battery</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">{node.battery}%</span>
        </div>

        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500 dark:text-slate-400">Last Updated</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {new Date(node.lastUpdated).toLocaleTimeString()}
          </span>
        </div>

        <div className="flex flex-col mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
          <span className="text-slate-500 dark:text-slate-400 mb-1">Location</span>
          <span className="font-mono text-slate-700 dark:text-slate-300 text-right">
            {node.latitude.toFixed(4)}, {node.longitude.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
};

// Local helper just for this component to keep it standalone if preferred,
// or we can import getSensorColor. Let's use the same logic.
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'normal':
    case 'low': return '#22c55e';
    case 'warning':
    case 'moderate': return '#eab308';
    case 'high': return '#f97316';
    case 'critical': return '#ef4444';
    case 'offline': return '#94a3b8';
    default: return '#22c55e';
  }
};
