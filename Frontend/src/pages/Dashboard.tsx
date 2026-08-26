import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Download, Radio, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { SummaryCard } from '../components/dashboard/SummaryCard';
import { LiveMap } from '../components/dashboard/LiveMap';
import { RecentAlerts } from '../components/dashboard/RecentAlerts';
import { DeformationChart } from '../components/dashboard/DeformationChart';
import { RiskDistribution } from '../components/dashboard/RiskDistribution';
import { NodeStatus } from '../components/dashboard/NodeStatus';
import { EnvironmentalTelemetry } from '../components/dashboard/EnvironmentalTelemetry';

import { 
  summaryData, 
  deformationTrend, 
  riskDistribution, 
  sensorStatusData, 
  environmentalData 
} from '../data/mockData';
import { fetchLiveNodes, fetchLiveAlerts } from '../services/apiService';
import { MonitoringNode, Alert } from '../types';

export const Dashboard: React.FC = () => {
  const [nodes, setNodes] = useState<MonitoringNode[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const liveNodes = await fetchLiveNodes();
      const liveAlerts = await fetchLiveAlerts();
      if (isMounted) {
        setNodes(liveNodes);
        
        const mappedAlerts: Alert[] = liveAlerts.map((a: any, idx: number) => {
          let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
          if (a.risk_level === 'CRITICAL') severity = 'critical';
          else if (a.risk_level === 'WARNING') severity = 'high';
          
          return {
            id: `alert-${idx}`,
            title: `Safety Level: ${a.risk_level}`,
            description: `Node ${a.node_id} reported ${a.risk_level} conditions.`,
            timestamp: new Date(a.timestamp).toLocaleTimeString(),
            severity: severity,
            type: 'system',
            nodeId: a.node_id
          };
        });
        mappedAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAlerts(mappedAlerts);
      }
    };
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const totalNodes = nodes.length > 0 ? nodes.length : summaryData.totalNodes;
  const onlineNodes = nodes.length > 0 ? nodes.filter(n => n.status !== 'offline').length : summaryData.onlineNodes;
  const activeWarnings = nodes.length > 0 ? nodes.filter(n => ['warning', 'high', 'critical'].includes(n.status?.toLowerCase() || '')).length : summaryData.activeWarnings;

  const dynamicRiskDistribution = useMemo(() => {
    if (nodes.length === 0) return riskDistribution;
    
    let low = 0, mod = 0, high = 0, crit = 0;
    nodes.forEach(n => {
      const status = (n.status || '').toLowerCase();
      if (status === 'critical') crit++;
      else if (status === 'warning') high++;
      else if (status === 'moderate') mod++;
      else low++;
    });

    return [
      { name: 'Low (0-30%)', value: low, color: '#22c55e' },
      { name: 'Moderate (30-60%)', value: mod, color: '#eab308' },
      { name: 'High (60-80%)', value: high, color: '#f97316' },
      { name: 'Critical (80-100%)', value: crit, color: '#ef4444' }
    ];
  }, [nodes]);

  const dynamicNodeStatus = useMemo(() => {
    if (nodes.length === 0) return sensorStatusData;
    
    let online = 0, offline = 0;
    nodes.forEach(n => {
      if (n.status === 'offline') offline++;
      else online++;
    });

    return [
      { name: 'Online', value: online, color: '#22c55e' },
      { name: 'Offline', value: offline, color: '#94a3b8' },
      { name: 'Maintenance', value: 0, color: '#3b82f6' }
    ];
  }, [nodes]);

  return (
    <div className="space-y-6">
      {/* Date and Export Controls */}
      <div className="flex flex-col sm:flex-row justify-end items-center space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 font-medium shadow-sm w-full sm:w-auto justify-center">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>21 May 2026, 10:30 AM</span>
          <span className="text-slate-400 text-[10px] ml-2">⌄</span>
        </div>
        <button className="flex items-center justify-center space-x-2 bg-teal-900 hover:bg-teal-950 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm w-full sm:w-auto">
          <Download className="w-4 h-4" />
          <span>Export Report</span>
          <span className="text-teal-300 text-[10px] ml-1">⌄</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          title="Total Nodes" 
          value={totalNodes} 
          subtitle="Across 1 Panel" 
          icon={Radio} 
          iconBgColor="bg-blue-50" 
          iconColor="text-blue-500"
          sparklineData={[{value: 10}, {value: 12}, {value: 15}, {value: 14}, {value: 18}, {value: 20}, {value: 24}]}
          sparklineColor="#3b82f6"
        />
        <SummaryCard 
          title="Online Nodes" 
          value={onlineNodes} 
          subtitle="91.7% Online" 
          icon={CheckCircle2} 
          iconBgColor="bg-emerald-50" 
          iconColor="text-emerald-500"
          sparklineData={[{value: 20}, {value: 22}, {value: 21}, {value: 24}, {value: 22}, {value: 23}, {value: 22}]}
          sparklineColor="#22c55e"
        />
        <SummaryCard 
          title="Active Warnings" 
          value={activeWarnings} 
          subtitle="Needs Attention" 
          icon={AlertTriangle} 
          iconBgColor="bg-orange-50" 
          iconColor="text-orange-500"
          sparklineData={[{value: 0}, {value: 1}, {value: 1}, {value: 3}, {value: 2}, {value: 4}, {value: 2}]}
          sparklineColor="#f97316"
        />
        <SummaryCard 
          title="Overall Risk Level" 
          value="HIGH" 
          subtitle="Risk Score: 78%" 
          icon={ShieldAlert} 
          iconBgColor="bg-red-50" 
          iconColor="text-red-500"
          sparklineData={[{value: 50}, {value: 48}, {value: 65}, {value: 60}, {value: 75}, {value: 72}, {value: 78}]}
          sparklineColor="#ef4444"
          valueColor="text-red-500"
        />
      </div>

      {/* Main Grid: Map and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LiveMap nodes={nodes} />
        </div>
        <div className="lg:col-span-1">
          <RecentAlerts alerts={alerts} />
        </div>
      </div>

      {/* Bottom Grid: Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DeformationChart data={deformationTrend} />
        <RiskDistribution data={dynamicRiskDistribution} total={totalNodes} />
        <NodeStatus data={dynamicNodeStatus} total={totalNodes} />
        <EnvironmentalTelemetry data={environmentalData} />
      </div>
    </div>
  );
};
