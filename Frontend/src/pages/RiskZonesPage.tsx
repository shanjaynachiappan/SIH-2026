import React from 'react';
import { AlertTriangle, Map, ShieldAlert, Activity, ChevronRight, MapPin, Maximize, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const mockRiskZones = [
  {
    id: 'RZ-01-ALPHA',
    name: 'Sector Alpha North',
    riskLevel: 'CRITICAL',
    score: 92,
    maxDeformation: 45.2,
    affectedNodes: 4,
    area: 12.5,
    trend: 'increasing',
    lastUpdate: '2 mins ago',
    coordinates: '23.7584° N, 86.4152° E'
  },
  {
    id: 'RZ-02-BETA',
    name: 'Sector Beta West',
    riskLevel: 'HIGH',
    score: 78,
    maxDeformation: 32.1,
    affectedNodes: 3,
    area: 8.2,
    trend: 'stable',
    lastUpdate: '5 mins ago',
    coordinates: '23.7561° N, 86.4110° E'
  },
  {
    id: 'RZ-03-GAMMA',
    name: 'Main Haulage Drift',
    riskLevel: 'MODERATE',
    score: 45,
    maxDeformation: 18.5,
    affectedNodes: 6,
    area: 24.0,
    trend: 'decreasing',
    lastUpdate: '12 mins ago',
    coordinates: '23.7590° N, 86.4180° E'
  },
  {
    id: 'RZ-04-DELTA',
    name: 'Ventilation Shaft 3',
    riskLevel: 'LOW',
    score: 15,
    maxDeformation: 4.2,
    affectedNodes: 2,
    area: 5.5,
    trend: 'stable',
    lastUpdate: '1 hr ago',
    coordinates: '23.7610° N, 86.4195° E'
  },
  {
    id: 'RZ-05-EPSILON',
    name: 'Eastern Panel Edge',
    riskLevel: 'HIGH',
    score: 81,
    maxDeformation: 35.8,
    affectedNodes: 2,
    area: 6.8,
    trend: 'increasing',
    lastUpdate: 'Just now',
    coordinates: '23.7550° N, 86.4210° E'
  }
];

export const RiskZonesPage: React.FC = () => {
  const navigate = useNavigate();

  const getRiskColor = (level: string) => {
    switch(level) {
      case 'CRITICAL': return 'bg-red-50 border-red-200 text-red-700';
      case 'HIGH': return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'MODERATE': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'LOW': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const getProgressColor = (level: string) => {
    switch(level) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MODERATE': return 'bg-yellow-500';
      case 'LOW': return 'bg-emerald-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Risk Zones Analysis</h1>
          <p className="text-sm text-slate-500">Real-time identification and tracking of subsidence hazards.</p>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={() => navigate('/live-map')}
            className="flex items-center space-x-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            <Map className="w-4 h-4" />
            <span>View on Map</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-slate-50 rounded-lg text-slate-500">
            <Maximize className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Total Zones Active</div>
            <div className="text-2xl font-black text-slate-800">{mockRiskZones.length}</div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-red-50 rounded-lg text-red-500">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-red-500 uppercase">Critical Zones</div>
            <div className="text-2xl font-black text-red-600">
              {mockRiskZones.filter(z => z.riskLevel === 'CRITICAL').length}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-orange-50 rounded-lg text-orange-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-orange-500 uppercase">High Risk Zones</div>
            <div className="text-2xl font-black text-orange-600">
              {mockRiskZones.filter(z => z.riskLevel === 'HIGH').length}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-500">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Total Area Affected</div>
            <div className="text-2xl font-black text-slate-800">
              {mockRiskZones.reduce((acc, curr) => acc + curr.area, 0).toFixed(1)} <span className="text-sm text-slate-500 font-medium">ha</span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {mockRiskZones.some(z => z.riskLevel === 'CRITICAL') && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0 animate-pulse" />
          <div>
            <h4 className="text-sm font-bold text-red-800">Critical Intervention Required</h4>
            <p className="text-xs text-red-600 mt-1">Sector Alpha North has exceeded maximum safe deformation thresholds. Evacuation protocols should be on standby.</p>
          </div>
        </div>
      )}

      {/* Grid of Risk Zones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockRiskZones.map((zone) => (
          <div key={zone.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
            <div className={`px-5 py-4 border-b flex justify-between items-center ${getRiskColor(zone.riskLevel)} border-opacity-50`}>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black opacity-70">{zone.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/50 border border-current`}>
                    {zone.riskLevel}
                  </span>
                </div>
                <h3 className="text-lg font-bold mt-1">{zone.name}</h3>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black">{zone.score}<span className="text-sm font-medium opacity-70">%</span></div>
                <div className="text-[10px] font-bold uppercase opacity-80">Risk Score</div>
              </div>
            </div>
            
            <div className="p-5">
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-6">
                <div>
                  <div className="text-xs text-slate-500 font-medium mb-1">Max Deformation</div>
                  <div className="flex items-end space-x-1">
                    <span className="text-lg font-bold text-slate-800">{zone.maxDeformation.toFixed(1)}</span>
                    <span className="text-xs text-slate-500 mb-1">mm</span>
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-slate-500 font-medium mb-1">Affected Area</div>
                  <div className="flex items-end space-x-1">
                    <span className="text-lg font-bold text-slate-800">{zone.area}</span>
                    <span className="text-xs text-slate-500 mb-1">hectares</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 font-medium mb-1">Nodes in Zone</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-slate-800">{zone.affectedNodes}</span>
                    <div className="flex -space-x-1">
                      {[...Array(Math.min(zone.affectedNodes, 3))].map((_, i) => (
                        <div key={i} className={`w-4 h-4 rounded-full border border-white ${getProgressColor(zone.riskLevel)}`}></div>
                      ))}
                      {zone.affectedNodes > 3 && (
                        <div className="w-4 h-4 rounded-full border border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-600">
                          +{zone.affectedNodes - 3}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 font-medium mb-1">Location</div>
                  <div className="flex items-center space-x-1 text-sm font-medium text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{zone.coordinates}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-slate-500">Risk Threshold</span>
                  <span className="font-bold text-slate-700">{zone.score}/100</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${getProgressColor(zone.riskLevel)} transition-all duration-1000`} 
                    style={{ width: `${zone.score}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-xs font-medium text-slate-400 flex items-center">
                  Updated {zone.lastUpdate}
                </span>
                <button 
                  onClick={() => navigate('/live-map')}
                  className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center group-hover:underline"
                >
                  Locate Zone <ChevronRight className="w-4 h-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
