import React, { useState } from 'react';
import { 
  Save, 
  Server, 
  Wifi, 
  HardDrive, 
  Bell, 
  Smartphone, 
  Volume2, 
  Download, 
  Trash2, 
  CheckCircle2
} from 'lucide-react';

type SettingsTab = 'gateway' | 'connectivity' | 'alerts' | 'storage';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('gateway');
  const [syncInterval, setSyncInterval] = useState('60');
  const [offlineMode, setOfflineMode] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [sirenEnabled, setSirenEnabled] = useState(true);
  const [strobeLight, setStrobeLight] = useState(true);
  const [sirenVolume, setSirenVolume] = useState('85');
  const [smsNumbers, setSmsNumbers] = useState('+91 98765 43210, +91 94321 09876');
  const [loraFrequency, setLoraFrequency] = useState('865.200');
  const [spreadingFactor, setSpreadingFactor] = useState('SF8');
  const [txPower, setTxPower] = useState('20');
  const [retentionDays, setRetentionDays] = useState('90');
  const [ipMode, setIpMode] = useState('static');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gateway Settings & Operations</h1>
          <p className="text-sm text-slate-500">Configure local mesh radio, hardware triggers, storage, and cloud sync for GW-01.</p>
        </div>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Changes saved
            </span>
          )}
          <button 
            onClick={handleSave}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition-all w-full sm:w-auto"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-1.5">
          <button 
            onClick={() => setActiveTab('gateway')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all text-left ${
              activeTab === 'gateway' 
                ? 'bg-white text-blue-600 font-semibold shadow-sm border border-slate-200 border-l-4 border-l-blue-600' 
                : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Server className={`w-4 h-4 ${activeTab === 'gateway' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Gateway Config</span>
            </div>
            {activeTab === 'gateway' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
          </button>

          <button 
            onClick={() => setActiveTab('connectivity')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all text-left ${
              activeTab === 'connectivity' 
                ? 'bg-white text-blue-600 font-semibold shadow-sm border border-slate-200 border-l-4 border-l-blue-600' 
                : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Wifi className={`w-4 h-4 ${activeTab === 'connectivity' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Connectivity</span>
            </div>
            {activeTab === 'connectivity' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
          </button>

          <button 
            onClick={() => setActiveTab('alerts')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all text-left ${
              activeTab === 'alerts' 
                ? 'bg-white text-blue-600 font-semibold shadow-sm border border-slate-200 border-l-4 border-l-blue-600' 
                : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Bell className={`w-4 h-4 ${activeTab === 'alerts' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Alert Preferences</span>
            </div>
            {activeTab === 'alerts' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
          </button>

          <button 
            onClick={() => setActiveTab('storage')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all text-left ${
              activeTab === 'storage' 
                ? 'bg-white text-blue-600 font-semibold shadow-sm border border-slate-200 border-l-4 border-l-blue-600' 
                : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <HardDrive className={`w-4 h-4 ${activeTab === 'storage' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Storage & Logs</span>
            </div>
            {activeTab === 'storage' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
          </button>

          {/* Device Telemetry card */}
          <div className="p-4 bg-slate-100/70 border border-slate-200 rounded-xl mt-6 text-xs text-slate-600 space-y-2">
            <div className="font-semibold text-slate-800 flex items-center justify-between">
              <span>Hardware Status</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Core Temp:</span>
              <span className="font-mono font-medium text-slate-700">43.8 °C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">RAM Load:</span>
              <span className="font-mono font-medium text-slate-700">284 MB / 1 GB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Firmware:</span>
              <span className="font-mono font-medium text-slate-700">v2.4.1-mine</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          
          {/* TAB 1: GATEWAY CONFIG */}
          {activeTab === 'gateway' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Identity & Panel Mapping</h2>
                    <p className="text-xs text-slate-500">Local node boundaries strictly scoped to this unit</p>
                  </div>
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-full">
                    PRIMARY NODE
                  </span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gateway ID</label>
                      <input type="text" disabled value="GW-01" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm font-mono font-semibold cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Panel ID</label>
                      <input type="text" disabled value="P-01" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm font-mono font-semibold cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">LoRa Mesh ID</label>
                      <input type="text" disabled value="MESH-01" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm font-mono font-semibold cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mine Sector / Underground Zone</label>
                      <input type="text" defaultValue="North East Seam 3, Sub-Level 2" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-sm font-bold text-slate-800">Operational Mode & Sync Policy</h2>
                </div>
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Local Autonomous Edge Mode</h4>
                      <p className="text-xs text-slate-500 mt-1">Allows real-time sensor processing and sirens to trigger even when internet is disconnected.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={offlineMode} onChange={(e) => setOfflineMode(e.target.checked)} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <hr className="border-slate-100" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Central Cloud Sync Interval</label>
                      <select 
                        value={syncInterval}
                        onChange={(e) => setSyncInterval(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="10">Every 10 seconds (High Bandwidth)</option>
                        <option value="30">Every 30 seconds</option>
                        <option value="60">Every 1 minute (Standard)</option>
                        <option value="300">Every 5 minutes (Low Power)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Local Polling Frequency</label>
                      <select defaultValue="2" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="1">Real-time (1 second)</option>
                        <option value="2">Standard (2 seconds)</option>
                        <option value="5">Eco Mode (5 seconds)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONNECTIVITY */}
          {activeTab === 'connectivity' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">LoRa 865MHz Mesh Radio Concentrator</h2>
                    <p className="text-xs text-slate-500">Underground wireless mesh communication parameters</p>
                  </div>
                  <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                    SX1302 ONLINE
                  </span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Center Frequency (MHz)</label>
                      <select 
                        value={loraFrequency} 
                        onChange={(e) => setLoraFrequency(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="865.200">865.200 MHz (IN865 Ch1)</option>
                        <option value="865.400">865.400 MHz (IN865 Ch2)</option>
                        <option value="865.600">865.600 MHz (IN865 Ch3)</option>
                        <option value="866.000">866.000 MHz (IN865 Ch4)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Spreading Factor (SF)</label>
                      <select 
                        value={spreadingFactor} 
                        onChange={(e) => setSpreadingFactor(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="SF7">SF7 (Highest Speed / Short Range)</option>
                        <option value="SF8">SF8 (Balanced Underground)</option>
                        <option value="SF9">SF9 (Extended Tunnel Range)</option>
                        <option value="SF12">SF12 (Maximum Penetration)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">TX Output Power (dBm)</label>
                      <select 
                        value={txPower} 
                        onChange={(e) => setTxPower(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="14">+14 dBm (25 mW)</option>
                        <option value="17">+17 dBm (50 mW)</option>
                        <option value="20">+20 dBm (100 mW Max Safe)</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 mt-4 flex flex-wrap justify-between items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold uppercase block text-[10px]">Mesh Noise Floor</span>
                      <span className="font-mono font-bold text-slate-800 text-sm">-118.4 dBm</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase block text-[10px]">Average Packet RSSI</span>
                      <span className="font-mono font-bold text-emerald-600 text-sm">-72.1 dBm</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase block text-[10px]">Active Mesh Nodes</span>
                      <span className="font-mono font-bold text-slate-800 text-sm">24 / 24 Configured</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase block text-[10px]">Channel Utilization</span>
                      <span className="font-mono font-bold text-blue-600 text-sm">14.2% Duty Cycle</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-sm font-bold text-slate-800">LAN & Uplink Network Configuration</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center space-x-2 text-sm text-slate-700 font-medium cursor-pointer">
                      <input 
                        type="radio" 
                        name="ipmode" 
                        checked={ipMode === 'static'} 
                        onChange={() => setIpMode('static')} 
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Static IP (Recommended for Local Gateway)</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm text-slate-700 font-medium cursor-pointer">
                      <input 
                        type="radio" 
                        name="ipmode" 
                        checked={ipMode === 'dhcp'} 
                        onChange={() => setIpMode('dhcp')} 
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>DHCP Automatic</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gateway Local IP</label>
                      <input 
                        type="text" 
                        disabled={ipMode === 'dhcp'}
                        defaultValue="192.168.1.100" 
                        className={`w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${ipMode === 'dhcp' ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subnet Mask</label>
                      <input 
                        type="text" 
                        disabled={ipMode === 'dhcp'}
                        defaultValue="255.255.255.0" 
                        className={`w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${ipMode === 'dhcp' ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Default Gateway Router</label>
                      <input 
                        type="text" 
                        disabled={ipMode === 'dhcp'}
                        defaultValue="192.168.1.1" 
                        className={`w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${ipMode === 'dhcp' ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ALERTS PREFERENCES */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Hardware Siren & Underground Strobe Triggers</h2>
                    <p className="text-xs text-slate-500">Physical GPIO relay outputs connected to Gateway GW-01</p>
                  </div>
                  <button className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg border border-slate-200 transition-colors flex items-center">
                    <Volume2 className="w-3.5 h-3.5 mr-1" /> Test Siren (2s)
                  </button>
                </div>
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Acoustic Siren Relay (Relay #1)</h4>
                      <p className="text-xs text-slate-500 mt-1">Automatically blare 110dB evacuation siren on CRITICAL risk classification.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={sirenEnabled} onChange={(e) => setSirenEnabled(e.target.checked)} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <hr className="border-slate-100" />

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Visual Strobe Flasher (Relay #2)</h4>
                      <p className="text-xs text-slate-500 mt-1">Flash amber beacon light during WARNING state, red strobe during CRITICAL state.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={strobeLight} onChange={(e) => setStrobeLight(e.target.checked)} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <hr className="border-slate-100" />

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                      <span>Internal Speaker Buzzer Volume</span>
                      <span>{sirenVolume}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="20" 
                      max="100" 
                      value={sirenVolume} 
                      onChange={(e) => setSirenVolume(e.target.value)}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-sm font-bold text-slate-800">GSM Emergency SMS Broadcast</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Direct GSM Modem Dispatch</h4>
                      <p className="text-xs text-slate-500 mt-1">Directly sends emergency dispatch SMS via SIM7600 module without requiring cloud.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={alertsEnabled} onChange={(e) => setAlertsEnabled(e.target.checked)} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center">
                      <Smartphone className="w-3.5 h-3.5 mr-1" /> Shift Incharge & Safety Officer Mobile Numbers
                    </label>
                    <input 
                      type="text" 
                      value={smsNumbers}
                      onChange={(e) => setSmsNumbers(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" 
                      placeholder="+91 9876543210, +91 9876543211"
                    />
                    <p className="text-[10px] text-slate-400 mt-1.5">Comma-separated international format (+91 for India)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STORAGE & LOGS */}
          {activeTab === 'storage' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Local Gateway Storage & Buffer Memory</h2>
                    <p className="text-xs text-slate-500">Internal Industrial eMMC / SD storage partition</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                    64.0 GB eMMC
                  </span>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                      <span>Disk Space Utilized</span>
                      <span>21.7 GB of 64.0 GB (34%)</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full" style={{ width: '34%' }}></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Buffered Sensor Records</span>
                      <span className="text-lg font-black text-slate-800">142,890</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Historical Range Cached</span>
                      <span className="text-lg font-black text-slate-800">45 Days</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">SQLite DB Health</span>
                      <span className="text-lg font-black text-emerald-600">OPTIMAL</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Automated Retention Pruning</label>
                    <select 
                      value={retentionDays}
                      onChange={(e) => setRetentionDays(e.target.value)}
                      className="w-full sm:w-1/2 px-4 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="30">Retain Last 30 Days</option>
                      <option value="60">Retain Last 60 Days</option>
                      <option value="90">Retain Last 90 Days (Recommended)</option>
                      <option value="180">Retain Last 180 Days</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h2 className="text-sm font-bold text-slate-800">Data Export & Maintenance Actions</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <button className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 transition-colors">
                      <Download className="w-4 h-4 text-slate-500" />
                      <span>Export Sensor CSV (Last 30 Days)</span>
                    </button>
                    <button className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 transition-colors">
                      <Download className="w-4 h-4 text-slate-500" />
                      <span>Download Gateway Diagnostic Bundle</span>
                    </button>
                    <button className="flex items-center space-x-2 text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl text-sm font-semibold border border-red-200 transition-colors ml-auto">
                      <Trash2 className="w-4 h-4" />
                      <span>Flush Synced Records</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
