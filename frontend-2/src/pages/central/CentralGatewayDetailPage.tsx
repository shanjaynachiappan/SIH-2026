import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Router, 
  ArrowLeft, 
  ChevronRight, 
  ExternalLink
} from 'lucide-react';
import { centralApiService } from '../../services/centralApiService';
import { GatewayInfo } from '../../types/central';
import { MonitoringNode } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const CentralGatewayDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canAccessLocal } = useAuth();

  const [gateway, setGateway] = useState<GatewayInfo | null>(null);
  const [nodes, setNodes] = useState<MonitoringNode[]>([]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const gw = await centralApiService.getGatewayById('MINE-01', id);
      if (gw) {
        setGateway(gw);
        const gwNodes = await centralApiService.getCentralNodes({ gatewayId: gw.id });
        setNodes(gwNodes);
      }
    };
    load();
  }, [id]);

  if (!gateway) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <Router className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Gateway Not Found</h2>
        <button 
          onClick={() => navigate('/central/gateways')}
          className="mt-4 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl"
        >
          Back to Gateways
        </button>
      </div>
    );
  }

  const isCritical = gateway.currentRisk === 'CRITICAL';
  const isWarning = gateway.currentRisk === 'WARNING';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumbs & Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/central/gateways')}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Gateways</span>
        </button>

        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
          <span>MINE-01</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span 
            onClick={() => navigate(`/central/panels/${gateway.panelId}`)}
            className="hover:text-cyan-600 cursor-pointer"
          >
            {gateway.panelId}
          </span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-900 font-bold">{gateway.id}</span>
        </div>
      </div>

      {/* Gateway Overview Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <span className="font-mono font-black text-base bg-slate-100 text-slate-800 px-3 py-1 rounded-xl border border-slate-200">
              {gateway.id}
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{gateway.name}</h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isCritical ? 'bg-red-50 text-red-700 border border-red-200' :
              isWarning ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {gateway.currentRisk} RISK
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Panel: <span className="font-bold text-slate-700">{gateway.panelId}</span> • Mesh Network: <span className="font-mono font-bold text-slate-700">{gateway.meshId}</span> • IP: <span className="font-mono">{gateway.ipAddress}</span>
          </p>
        </div>

        {/* Action: Open Local Dashboard */}
        <div className="flex items-center space-x-3">
          {canAccessLocal && (
            <button
              onClick={() => navigate('/local')}
              className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Local Dashboard</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync Health & Telemetry Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Sync Status</div>
          <div className="text-xl font-black text-emerald-700 mt-1 flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
            {gateway.syncStatus}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Last Synced: {gateway.lastSyncSecondsAgo}s ago</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Connected Nodes</div>
          <div className="text-xl font-black text-slate-800 mt-1">
            {gateway.connectedNodes} <span className="text-xs text-slate-400 font-medium">/ {gateway.totalNodes}</span>
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5 font-semibold">
            {((gateway.connectedNodes / gateway.totalNodes) * 100).toFixed(0)}% Mesh Coverage
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">LoRa Mesh Quality</div>
          <div className="text-xl font-black text-emerald-600 mt-1">{gateway.meshHealth}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Signal: {gateway.signalStrengthDbm} dBm</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Firmware & Hardware</div>
          <div className="text-xl font-black text-slate-800 mt-1">{gateway.firmwareVersion}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Battery: {gateway.batteryLevel}% (Solar float)</div>
        </div>
      </div>

      {/* Nodes Connected to this Gateway */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">Connected Sensor Nodes ({nodes.length})</h2>
            <p className="text-xs text-slate-500">Live multi-tier sensors communicating through {gateway.id}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Node ID</th>
                <th className="px-4 py-3">Tier / Type</th>
                <th className="px-4 py-3">Status / Risk</th>
                <th className="px-4 py-3">Displacement</th>
                <th className="px-4 py-3">Strata Tilt</th>
                <th className="px-4 py-3">Vibration</th>
                <th className="px-4 py-3">Battery</th>
                <th className="px-4 py-3">Signal</th>
                <th className="px-4 py-3">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {nodes.map(node => {
                const isOff = node.status === 'offline';
                const isCrit = node.status === 'critical';
                const isWarn = node.status === 'warning';

                return (
                  <tr key={node.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {node.id}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {node.nodeTier || node.nodeType}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isCrit ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse' :
                        isWarn ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        isOff ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {node.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold font-mono">
                      {isOff || node.displacement === undefined ? '--' : `${node.displacement.toFixed(1)} mm`}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {isOff || node.tilt === undefined ? '--' : `${node.tilt.toFixed(2)}°`}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {isOff || node.vibration === undefined ? '--' : `${node.vibration.toFixed(2)} g`}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      <span className={node.battery < 20 ? 'text-red-500' : 'text-slate-700'}>
                        {node.battery}%
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">
                      {node.signalDbm || -70} dBm
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-500">
                      {node.lastSeenAgo || '15s ago'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
