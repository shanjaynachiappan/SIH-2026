import React, { useState, useEffect } from 'react';
import { CentralMineGISMap } from '../../components/gis/CentralMineGISMap';
import { centralApiService } from '../../services/centralApiService';
import { MinePanel, GatewayInfo } from '../../types/central';
import { MonitoringNode } from '../../types';
import { Layers, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CentralMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [panels, setPanels] = useState<MinePanel[]>([]);
  const [gateways, setGateways] = useState<GatewayInfo[]>([]);
  const [nodes, setNodes] = useState<MonitoringNode[]>([]);
  const [selectedPanelId, setSelectedPanelId] = useState<string>('ALL');
  const [selectedGatewayId, setSelectedGatewayId] = useState<string>('ALL');

  useEffect(() => {
    let isMounted = true;
    const loadMapData = async () => {
      const [pList, gList, nList] = await Promise.all([
        centralApiService.getPanels(),
        centralApiService.getGateways(),
        centralApiService.getCentralNodes()
      ]);
      if (isMounted) {
        setPanels(pList);
        setGateways(gList);
        setNodes(nList);
      }
    };
    loadMapData();
  }, []);

  const selectedPanel = panels.find(p => p.id === selectedPanelId);

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-white border border-slate-200 px-5 py-3.5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-cyan-600" />
            <h1 className="text-xl font-bold text-slate-900">Mine-Wide GIS Strata & Subsidence Portal</h1>
          </div>
          <p className="text-xs text-slate-500">Spatial telemetry mapping across all 5 active panels and 8 LoRa mesh gateways</p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-slate-100 px-3 py-1.5 rounded-xl font-semibold text-slate-700">
            Mine: <span className="font-bold text-slate-900">MINE-01 (Jharia)</span>
          </div>
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
            240 Nodes Mapped
          </div>
        </div>
      </div>

      {/* Main Map Body with Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
        {/* Full Interactive Map */}
        <div className="lg:col-span-3 h-full min-h-[500px] flex flex-col">
          <CentralMineGISMap 
            panels={panels}
            gateways={gateways}
            nodes={nodes}
            selectedPanelId={selectedPanelId}
            selectedGatewayId={selectedGatewayId}
            onSelectPanel={(pid) => setSelectedPanelId(pid)}
            onSelectGateway={(gid) => setSelectedGatewayId(gid)}
            heightClass="h-full flex-1"
            showControls={true}
          />
        </div>

        {/* Sidebar Quick Inspection Panel */}
        <div className="space-y-4 flex flex-col h-full overflow-y-auto">
          {/* Active Panel Details Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Selected Spatial Scope
            </h3>
            {selectedPanel ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-mono font-bold text-slate-900 text-sm">{selectedPanel.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                    selectedPanel.riskLevel === 'CRITICAL' ? 'bg-red-50 text-red-700 border border-red-200' :
                    selectedPanel.riskLevel === 'WARNING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {selectedPanel.riskLevel}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-800">{selectedPanel.name}</p>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Depth:</span>
                    <span className="font-bold">{selectedPanel.depthMeters}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Deformation:</span>
                    <span className="font-bold text-red-600">{selectedPanel.maxDeformationMm} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Gateways:</span>
                    <span className="font-mono font-semibold">{selectedPanel.gateways.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nodes Online:</span>
                    <span className="font-bold">{selectedPanel.onlineNodes} / {selectedPanel.totalNodes}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/central/panels/${selectedPanel.id}`)}
                  className="w-full mt-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 rounded-xl transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <span>Open Full Panel View</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-2">
                <p className="font-semibold text-slate-700">All Panels Overview (5 active)</p>
                <p className="text-[11px] text-slate-400 mt-1">Click any panel polygon or select from top filter dropdown to zoom and focus.</p>
              </div>
            )}
          </div>

          {/* Quick Panels Switcher List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex-1 overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Mine Panels (5)
            </h3>
            <div className="space-y-2">
              {panels.map(p => (
                <div 
                  key={p.id}
                  onClick={() => setSelectedPanelId(p.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer text-xs ${
                    selectedPanelId === p.id 
                      ? 'bg-cyan-50/80 border-cyan-300 ring-1 ring-cyan-400' 
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono font-bold text-slate-800">{p.id}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      p.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                      p.riskLevel === 'WARNING' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {p.riskLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium truncate">{p.name}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Max Def: <span className="font-bold text-slate-700">{p.maxDeformationMm}mm</span> • Nodes: {p.onlineNodes}/{p.totalNodes}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
