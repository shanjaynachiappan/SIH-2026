import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  ShieldAlert, 
  AlertTriangle, 
  Activity, 
  CheckCircle2, 
  Search, 
  Clock, 
  MapPin, 
  Check, 
  RefreshCw
} from 'lucide-react';
import { centralApiService } from '../../services/centralApiService';
import { CentralAlert, MinePanel } from '../../types/central';

export const CentralAlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<CentralAlert[]>([]);
  const [panels, setPanels] = useState<MinePanel[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [panelFilter, setPanelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadAlerts = async () => {
    const [aList, pList] = await Promise.all([
      centralApiService.getCentralAlerts({
        severity: severityFilter,
        panelId: panelFilter,
        status: statusFilter,
        search: search
      }),
      centralApiService.getPanels()
    ]);
    setAlerts(aList);
    setPanels(pList);
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 3000);
    return () => clearInterval(interval);
  }, [severityFilter, panelFilter, statusFilter, search]);

  const handleAcknowledge = async (id: string) => {
    await centralApiService.acknowledgeAlert(id);
    loadAlerts();
  };

  const handleResolve = async (id: string) => {
    await centralApiService.resolveAlert(id);
    loadAlerts();
  };

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'critical':
        return { icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
      case 'high':
        return { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
      case 'medium':
        return { icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
      case 'low':
      default:
        return { icon: Bell, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    }
  };

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const highCount = alerts.filter(a => a.severity === 'high').length;
  const activeCount = alerts.filter(a => a.status === 'active').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6 text-red-600" />
            <h1 className="text-2xl font-bold text-slate-900">Central Early Warning & Alert Center</h1>
          </div>
          <p className="text-sm text-slate-500">Aggregated mine-wide strata alerts, tension crack warnings, and mitigation actions</p>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={loadAlerts}
            className="flex items-center space-x-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Alerts</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setSeverityFilter('all')}
          className={`bg-white border rounded-2xl p-4 shadow-sm cursor-pointer transition-all ${severityFilter === 'all' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'}`}
        >
          <div className="text-xs font-bold text-slate-400 uppercase">Total Mine Alerts</div>
          <div className="text-2xl font-black text-slate-800 mt-1">{alerts.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{activeCount} Currently Active</div>
        </div>

        <div 
          onClick={() => setSeverityFilter('critical')}
          className={`bg-white border rounded-2xl p-4 shadow-sm cursor-pointer transition-all ${severityFilter === 'critical' ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'}`}
        >
          <div className="text-xs font-bold text-red-600 uppercase">Critical Early Warnings</div>
          <div className="text-2xl font-black text-red-600 mt-1">{criticalCount}</div>
          <div className="text-[11px] text-red-500 mt-0.5">Immediate evacuation advisory</div>
        </div>

        <div 
          onClick={() => setSeverityFilter('high')}
          className={`bg-white border rounded-2xl p-4 shadow-sm cursor-pointer transition-all ${severityFilter === 'high' ? 'border-orange-500 ring-1 ring-orange-500' : 'border-slate-200'}`}
        >
          <div className="text-xs font-bold text-orange-600 uppercase">High Risk Alerts</div>
          <div className="text-2xl font-black text-orange-600 mt-1">{highCount}</div>
          <div className="text-[11px] text-orange-500 mt-0.5">Strata tilt / displacement</div>
        </div>

        <div 
          onClick={() => setStatusFilter('resolved')}
          className={`bg-white border rounded-2xl p-4 shadow-sm cursor-pointer transition-all ${statusFilter === 'resolved' ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-200'}`}
        >
          <div className="text-xs font-bold text-emerald-600 uppercase">Resolved In Shifts</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {alerts.filter(a => a.status === 'resolved').length}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Stabilized or inspected</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search alerts, messages, node IDs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>

        <select
          value={panelFilter}
          onChange={(e) => setPanelFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl outline-none"
        >
          <option value="all">All Panels</option>
          {panels.map(p => (
            <option key={p.id} value={p.id}>{p.id} ({p.name})</option>
          ))}
        </select>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl outline-none"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Alerts Feed */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {alerts.map(alert => {
            const { icon: Icon, color, bg, border } = getSeverityStyle(alert.severity);

            return (
              <div key={alert.id} className="p-5 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl flex-shrink-0 ${bg} ${border}`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900">{alert.title}</h3>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          alert.severity === 'critical' ? 'bg-red-100 text-red-800 border border-red-200 animate-pulse' :
                          alert.severity === 'high' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                          'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {alert.severity}
                        </span>
                        {alert.confidencePercent && (
                          <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                            {alert.confidencePercent}% Confidence
                          </span>
                        )}
                      </div>

                      <span className="text-xs text-slate-400 flex items-center font-medium">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-sm text-slate-700 leading-relaxed mb-2">{alert.message}</p>

                    {/* Scope Metadata */}
                    <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                      <span className="bg-slate-100 font-mono font-semibold px-2 py-0.5 rounded text-slate-700 border border-slate-200">
                        Panel {alert.panelId}
                      </span>
                      <span className="bg-slate-100 font-mono font-semibold px-2 py-0.5 rounded text-slate-700 border border-slate-200">
                        Gateway {alert.gatewayId}
                      </span>
                      {alert.nodeId && (
                        <span className="bg-cyan-50 text-cyan-800 font-mono font-bold px-2 py-0.5 rounded border border-cyan-200 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          Node {alert.nodeId}
                        </span>
                      )}
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {alert.type}
                      </span>
                    </div>

                    {/* Recommended Action Banner */}
                    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start space-x-2">
                      <span className="font-bold flex-shrink-0">Recommended Action:</span>
                      <span className="leading-relaxed">{alert.recommendedAction}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-3 flex items-center justify-end space-x-2">
                      {alert.status === 'active' && (
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                      {alert.status !== 'resolved' && (
                        <button
                          onClick={() => handleResolve(alert.id)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl flex items-center space-x-1 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Resolve Alert</span>
                        </button>
                      )}
                      {alert.status === 'resolved' && (
                        <span className="text-xs font-bold text-emerald-600 flex items-center">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Resolved
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
