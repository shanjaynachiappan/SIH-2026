import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MonitoringNode } from '../../types';
import { SeverityBadge } from './SeverityBadge';
import { 
  getTiltSeverity, 
  getDisplacementSeverity, 
  getVibrationSeverity, 
  getBatterySeverity 
} from '../../utils/sensorHelpers';

interface NodePopupProps {
  node: MonitoringNode;
}

export const NodePopup: React.FC<NodePopupProps> = ({ node }) => {
  const navigate = useNavigate();

  const handleViewAlert = () => {
    navigate('/alerts');
  };

  const isHighRisk = ['high', 'critical'].includes(node.status.toLowerCase());
  const formattedDate = new Date(node.lastUpdated);
  const timeString = formattedDate.toLocaleTimeString();

  return (
    <div className="font-sans text-slate-800 bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg leading-tight m-0 mb-1">Node {node.id}</h3>
          <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">
            {node.nodeType || 'Multi-Parameter Node'}
          </div>
        </div>
        <SeverityBadge level={node.status} />
      </div>

      {/* Content Body */}
      <div className="px-4 py-3 space-y-4 max-h-[350px] overflow-y-auto">
        
        {/* Location */}
        <div className="text-xs text-slate-500">
          <span className="block font-semibold text-slate-700 mb-1">Location</span>
          <div className="flex gap-4">
            <span>Lat: {node.latitude.toFixed(4)}</span>
            <span>Lng: {node.longitude.toFixed(4)}</span>
          </div>
        </div>

        {/* Measurements */}
        <div>
          <span className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide border-b pb-1">Current Measurements</span>
          <div className="space-y-1">
            {node.tilt !== undefined && (
              <MeasurementRow 
                label="Tilt" 
                value={`${node.tilt.toFixed(2)}°`} 
                severity={getTiltSeverity(node.tilt)} 
              />
            )}
            {node.displacement !== undefined && (
              <MeasurementRow 
                label="Displacement" 
                value={`${node.displacement.toFixed(1)} mm`} 
                severity={getDisplacementSeverity(node.displacement)} 
              />
            )}
            {node.vibration !== undefined && (
              <MeasurementRow 
                label="Vibration" 
                value={`${node.vibration.toFixed(2)} mm/s`} 
                severity={getVibrationSeverity(node.vibration)} 
              />
            )}
            <MeasurementRow 
              label="Crack Status" 
              value={node.crackDetected ? 'Detected' : 'No'} 
              severity={node.crackDetected ? 'Critical' : 'Normal'} 
            />
          </div>
        </div>

        {/* Risk Assessment */}
        <div>
          <span className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide border-b pb-1">Risk Assessment</span>
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="text-slate-500">Risk Score</span>
            <span className="font-bold text-slate-800">{node.riskScore !== undefined ? Math.round(node.riskScore * 100) : '--'}%</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Confidence</span>
            <span className="font-medium text-slate-700">{node.riskConfidence !== undefined ? Math.round(node.riskConfidence * 100) : '--'}%</span>
          </div>
        </div>

        {/* Health / Communication */}
        <div>
          <span className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide border-b pb-1">System Health</span>
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="text-slate-500">Battery</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700">{Math.round(node.battery)}%</span>
              <span className={`text-[10px] uppercase font-bold ${getBatterySeverity(node.battery) === 'Critical' ? 'text-red-500' : getBatterySeverity(node.battery) === 'Low' ? 'text-yellow-500' : 'text-green-500'}`}>
                {getBatterySeverity(node.battery)}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Connection</span>
            <span className={`font-bold text-xs uppercase ${node.status === 'offline' ? 'text-gray-500' : 'text-green-600'}`}>
              {node.status === 'offline' ? 'Offline' : 'Online'}
            </span>
          </div>
        </div>
        
      </div>

      {/* Footer */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-col gap-3">
        <div className="text-[10px] text-slate-400 flex justify-between items-center w-full">
          <span>Last Updated</span>
          <span>{timeString}</span>
        </div>
        
        {isHighRisk && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleViewAlert();
            }}
            className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-sm font-bold transition-colors shadow-sm"
          >
            View Alert Details
          </button>
        )}
      </div>
    </div>
  );
};

const MeasurementRow = ({ label, value, severity }: { label: string, value: string, severity: string }) => {
  let colorClass = 'text-green-600';
  if (severity === 'Elevated') colorClass = 'text-yellow-600';
  if (severity === 'High') colorClass = 'text-orange-600';
  if (severity === 'Critical') colorClass = 'text-red-600';

  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium text-slate-800">{value}</span>
        {severity !== 'Normal' && (
          <span className={`text-[10px] uppercase font-bold ${colorClass}`}>
            {severity}
          </span>
        )}
      </div>
    </div>
  );
};
