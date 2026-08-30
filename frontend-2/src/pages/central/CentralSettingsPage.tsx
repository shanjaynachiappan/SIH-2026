import React, { useState } from 'react';
import { 
  Settings, 
  Layers, 
  Router, 
  Grid, 
  Bell, 
  Users, 
  Check, 
  Save
} from 'lucide-react';
import { centralGateways, centralPanels, centralMinesList } from '../../data/centralMockData';

export const CentralSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mine' | 'gateways' | 'panels' | 'alerts' | 'users'>('mine');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [mineName, setMineName] = useState(centralMinesList[0].name);
  const [colliery, setColliery] = useState(centralMinesList[0].colliery);
  const [location, setLocation] = useState(centralMinesList[0].location);
  const [syncIntervalSec, setSyncIntervalSec] = useState('5');
  const [staleThresholdSec, setStaleThresholdSec] = useState('180');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-slate-700" />
            <h1 className="text-2xl font-bold text-slate-900">Central MineGuard Configuration</h1>
          </div>
          <p className="text-sm text-slate-500">Manage mine spatial boundaries, gateway backhauls, sync thresholds, and role permissions</p>
        </div>

        {savedSuccess && (
          <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-bold animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm flex flex-wrap gap-1 text-xs font-bold">
        {[
          { id: 'mine', label: 'Mine Identity & Location', icon: Layers },
          { id: 'gateways', label: 'Gateway Registry (8)', icon: Router },
          { id: 'panels', label: 'Panel Boundaries (5)', icon: Grid },
          { id: 'alerts', label: 'Thresholds & Early Warning', icon: Bell },
          { id: 'users', label: 'User Roles & Access', icon: Users },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        {activeTab === 'mine' && (
          <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Mine Profile & Geolocation
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mine ID</label>
                <input 
                  type="text" 
                  value="MINE-01" 
                  disabled 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mine Name</label>
                <input 
                  type="text" 
                  value={mineName} 
                  onChange={e => setMineName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Operating Colliery / Agency</label>
                <input 
                  type="text" 
                  value={colliery} 
                  onChange={e => setColliery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">District & State</label>
                <input 
                  type="text" 
                  value={location} 
                  onChange={e => setLocation(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gateway Polling Interval (sec)</label>
                <input 
                  type="number" 
                  value={syncIntervalSec} 
                  onChange={e => setSyncIntervalSec(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Stale Data Warning Threshold (sec)</label>
                <input 
                  type="number" 
                  value={staleThresholdSec} 
                  onChange={e => setStaleThresholdSec(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </form>
        )}

        {activeTab === 'gateways' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Registered Central Gateways
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Gateway ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Panel</th>
                    <th className="px-4 py-3">Mesh Network</th>
                    <th className="px-4 py-3">IP Address</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Sync State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {centralGateways.map(gw => (
                    <tr key={gw.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{gw.id}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{gw.name}</td>
                      <td className="px-4 py-3 font-semibold">{gw.panelId}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{gw.meshId}</td>
                      <td className="px-4 py-3 font-mono">{gw.ipAddress}</td>
                      <td className="px-4 py-3">
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">{gw.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded font-bold ${gw.syncStatus === 'DELAYED' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {gw.syncStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'panels' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Mine Panels Spatial Registry
            </h3>
            <div className="space-y-3">
              {centralPanels.map(p => (
                <div key={p.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-sm text-slate-900">{p.id}</span>
                      <span className="font-bold text-slate-700">{p.name}</span>
                    </div>
                    <p className="text-slate-500 mt-1">Depth: {p.depthMeters}m • Gateways: {p.gateways.join(', ')} • Total Nodes: {p.totalNodes}</p>
                  </div>
                  <span className="font-bold text-slate-700 uppercase bg-white px-2.5 py-1 rounded border border-slate-200">
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-4 max-w-2xl text-xs">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Subsidence & Strata Risk Thresholds
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <div>
                  <div className="font-bold text-slate-800">Critical Displacement Threshold (mm)</div>
                  <p className="text-slate-500">Triggers mandatory work cessation and immediate area evacuation</p>
                </div>
                <span className="font-mono font-bold text-sm bg-white px-3 py-1 rounded border border-slate-200 text-red-600">
                  50.0 mm
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <div>
                  <div className="font-bold text-slate-800">Warning Displacement Threshold (mm)</div>
                  <p className="text-slate-500">Triggers automated SMS alerts to Shift Supervisor and surveyor check</p>
                </div>
                <span className="font-mono font-bold text-sm bg-white px-3 py-1 rounded border border-slate-200 text-amber-600">
                  25.0 mm
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <div>
                  <div className="font-bold text-slate-800">Angular Roof Tilt Rate (° / hr)</div>
                  <p className="text-slate-500">Critical strata tilting indicating delamination</p>
                </div>
                <span className="font-mono font-bold text-sm bg-white px-3 py-1 rounded border border-slate-200 text-slate-800">
                  1.5 °/hr
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Role-Based Access Hierarchy
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-mono font-bold text-slate-900">PLANNER (planner@mineguard.com)</span>
                  <p className="text-slate-500">Access: Central Mine Dashboard, Panels, Gateways, Nodes, Trends, Reports</p>
                </div>
                <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-200">CENTRAL</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-mono font-bold text-slate-900">REGULATOR (regulator@mineguard.com)</span>
                  <p className="text-slate-500">Access: Central Mine Dashboard, Risk Zones, Alerts, Compliance Reports</p>
                </div>
                <span className="bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded border border-amber-200">REGULATORY</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-mono font-bold text-slate-900">ADMIN (admin@mineguard.com)</span>
                  <p className="text-slate-500">Access: Full Central & Local Dashboards, Configuration, User Registries</p>
                </div>
                <span className="bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded border border-purple-200">ADMINISTRATOR</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-mono font-bold text-slate-900">MINE_CONTROLLER (controller@mineguard.com)</span>
                  <p className="text-slate-500">Access: Local Gateway Dashboard (GW-01 / MESH-01) exclusively</p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">LOCAL GATEWAY</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
