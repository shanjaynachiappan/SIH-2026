import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, ShieldAlert, Activity, CheckCircle2, Search, Filter, Clock, MapPin, MoreVertical } from 'lucide-react';
import { fetchLiveAlerts } from '../services/apiService';
import { Alert } from '../types';

export const AlertsPage: React.FC = () => {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadAlerts = async () => {
      const liveAlerts = await fetchLiveAlerts();
      if (isMounted) {
        const mappedAlerts: Alert[] = liveAlerts.map((a: any, idx: number) => {
          let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
          if (a.risk_level === 'CRITICAL') severity = 'critical';
          else if (a.risk_level === 'WARNING') severity = 'high';
          
          return {
            id: `alert-${idx}`,
            title: `Safety Level: ${a.risk_level}`,
            description: `Node ${a.node_id} reported ${a.risk_level} conditions with ${(a.probability * 100).toFixed(1)}% confidence.`,
            timestamp: new Date(a.timestamp).toLocaleTimeString(),
            severity: severity,
            type: 'system',
            nodeId: a.node_id
          };
        });
        // Sort by most recent first
        mappedAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAlerts(mappedAlerts);
      }
    };
    loadAlerts();
    const interval = setInterval(loadAlerts, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const getSeverityConfig = (severity: string) => {
    switch(severity) {
      case 'critical': 
        return { icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' };
      case 'high': 
        return { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' };
      case 'medium': 
        return { icon: Activity, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' };
      case 'low': 
      default:
        return { icon: Bell, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter !== 'all' && alert.severity !== filter) return false;
    if (search && !alert.title.toLowerCase().includes(search.toLowerCase()) && !alert.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Alerts & Notifications</h1>
          <p className="text-sm text-slate-500">Manage and respond to operational and safety alerts for GW-01.</p>
        </div>
        
        <div className="flex space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search alerts..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center space-x-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setFilter('all')}
          className={`bg-white rounded-xl border ${filter === 'all' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'} p-4 shadow-sm cursor-pointer transition-all`}
        >
          <div className="text-xs font-bold text-slate-500 uppercase mb-1">Total Alerts</div>
          <div className="text-2xl font-black text-slate-800">{alerts.length}</div>
        </div>
        <div 
          onClick={() => setFilter('critical')}
          className={`bg-white rounded-xl border ${filter === 'critical' ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'} p-4 shadow-sm cursor-pointer transition-all`}
        >
          <div className="text-xs font-bold text-red-500 uppercase mb-1">Critical</div>
          <div className="text-2xl font-black text-red-600">
            {alerts.filter(a => a.severity === 'critical').length}
          </div>
        </div>
        <div 
          onClick={() => setFilter('high')}
          className={`bg-white rounded-xl border ${filter === 'high' ? 'border-orange-500 ring-1 ring-orange-500' : 'border-slate-200'} p-4 shadow-sm cursor-pointer transition-all`}
        >
          <div className="text-xs font-bold text-orange-500 uppercase mb-1">High Risk</div>
          <div className="text-2xl font-black text-orange-600">
            {alerts.filter(a => a.severity === 'high').length}
          </div>
        </div>
        <div 
          onClick={() => setFilter('medium')}
          className={`bg-white rounded-xl border ${filter === 'medium' ? 'border-yellow-500 ring-1 ring-yellow-500' : 'border-slate-200'} p-4 shadow-sm cursor-pointer transition-all`}
        >
          <div className="text-xs font-bold text-yellow-500 uppercase mb-1">Warnings</div>
          <div className="text-2xl font-black text-yellow-600">
            {alerts.filter(a => a.severity === 'medium').length}
          </div>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-700">Recent Activity</h2>
          <button className="text-xs font-bold text-blue-600 hover:text-blue-800">Mark all as read</button>
        </div>
        
        <div className="divide-y divide-slate-100">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => {
              const { icon: Icon, color, bg, border } = getSeverityConfig(alert.severity);
              
              return (
                <div key={alert.id} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-start gap-4 sm:gap-6">
                    {/* Icon */}
                    <div className={`p-3 rounded-xl flex-shrink-0 border ${bg} ${border}`}>
                      <Icon className={`w-6 h-6 ${color}`} />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1 gap-2 sm:gap-0">
                        <h3 className="text-base font-bold text-slate-800 truncate pr-4">
                          {alert.title}
                        </h3>
                        <span className="flex items-center text-xs font-semibold text-slate-400 whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {alert.timestamp}
                        </span>
                      </div>
                      
                      <p className="text-sm text-slate-600 mb-3">{alert.description}</p>
                      
                      {/* Meta info & Actions */}
                      <div className="flex flex-wrap items-center gap-3">
                        {alert.nodeId && (
                          <span className="flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-xs font-bold text-slate-600 border border-slate-200">
                            <MapPin className="w-3 h-3 mr-1" />
                            Node {alert.nodeId}
                          </span>
                        )}
                        <span className="flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-xs font-bold text-slate-600 border border-slate-200 uppercase tracking-wide">
                          {alert.type}
                        </span>
                        
                        <div className="w-full sm:w-auto mt-3 sm:mt-0 sm:ml-auto flex items-center space-x-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors">
                            Acknowledge
                          </button>
                          <button className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md flex items-center justify-center transition-colors">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Resolve
                          </button>
                          <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-slate-500">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="font-semibold text-lg">No alerts found</p>
              <p className="text-sm">You're all caught up! There are no alerts matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
