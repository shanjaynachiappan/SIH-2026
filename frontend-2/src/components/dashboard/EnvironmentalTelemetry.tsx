import React from 'react';
import { Thermometer, Droplets, CloudRain, Wind } from 'lucide-react';
import { EnvironmentalData } from '../../types';

interface EnvironmentalDataProps {
  data: EnvironmentalData;
}

export const EnvironmentalTelemetry: React.FC<EnvironmentalDataProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-slate-800 font-bold text-sm">Environmental Telemetry</h3>
      </div>
      
      <div className="flex-1 flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
          <div className="flex items-center space-x-3 text-slate-600">
            <Thermometer className="w-4 h-4" />
            <span className="text-xs font-medium">Temperature</span>
          </div>
          <span className="text-sm font-bold text-slate-800">{data.temperature} °C</span>
        </div>
        
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
          <div className="flex items-center space-x-3 text-slate-600">
            <Droplets className="w-4 h-4" />
            <span className="text-xs font-medium">Humidity</span>
          </div>
          <span className="text-sm font-bold text-slate-800">{data.humidity}%</span>
        </div>
        
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
          <div className="flex items-center space-x-3 text-slate-600">
            <CloudRain className="w-4 h-4" />
            <span className="text-xs font-medium">Rainfall</span>
          </div>
          <span className="text-sm font-bold text-slate-800">{data.rainfall} mm</span>
        </div>
        
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
          <div className="flex items-center space-x-3 text-slate-600">
            <Wind className="w-4 h-4" />
            <span className="text-xs font-medium">Wind Speed</span>
          </div>
          <span className="text-sm font-bold text-slate-800">{data.windSpeed} km/h</span>
        </div>
      </div>
    </div>
  );
};
