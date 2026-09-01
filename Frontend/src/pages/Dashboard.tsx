import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Radio, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { SummaryCard } from '../components/dashboard/SummaryCard';
import { LiveMap } from '../components/dashboard/LiveMap';
import { RecentAlerts } from '../components/dashboard/RecentAlerts';
import { DeformationChart } from '../components/dashboard/DeformationChart';
import { RiskDistribution } from '../components/dashboard/RiskDistribution';
import { MeshHealthPanel } from '../components/dashboard/MeshHealthPanel';

import { deformationTrend } from '../data/mockData';
import { fetchLiveNodes, fetchLiveAlerts, fetchTelemetryHistory } from '../services/apiService';
import { MonitoringNode, Alert } from '../types';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<MonitoringNode[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [trendData, setTrendData] = useState<{ time: string; deformation: number }[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = useMemo(() => {
    const dateStr = currentTime.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${dateStr}, ${timeStr}`;
  }, [currentTime]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const liveNodes = await fetchLiveNodes();
      const liveAlerts = await fetchLiveAlerts();
      const historyPayloads = await fetchTelemetryHistory(undefined, 20);

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

        if (historyPayloads && historyPayloads.length > 0) {
          const formattedTrend = [...historyPayloads]
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .map(h => ({
              time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              deformation: parseFloat(Number(h.displacement_mm ?? h.displacement ?? 0).toFixed(2))
            }));
          setTrendData(formattedTrend);
        }
      }
    };
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const totalNodes = nodes.length;
  const onlineNodes = nodes.filter(n => n.status !== 'offline').length;
  const activeWarnings = nodes.filter(n => ['warning', 'high', 'critical'].includes(n.status?.toLowerCase() || '')).length;

  const activeTrend = trendData.length > 0 ? trendData : deformationTrend;

  const overallRisk = useMemo(() => {
    if (nodes.length === 0) {
      return { level: 'NORMAL', score: 0, color: 'text-emerald-500', bgColor: 'bg-emerald-50', sparklineColor: '#10b981' };
    }
    
    // Find the max risk score among all nodes (normalized to 100)
    const maxScore = Math.max(...nodes.map(n => Math.round((n.riskScore || 0) * 100)));
    
    let level = 'NORMAL';
    let color = 'text-emerald-500';
    let bgColor = 'bg-emerald-50';
    let sparklineColor = '#10b981';
    
    const hasCritical = nodes.some(n => n.status === 'critical');
    const hasWarning = nodes.some(n => n.status === 'warning' || n.status === 'high');
    
    if (hasCritical) {
      level = 'CRITICAL';
      color = 'text-red-500';
      bgColor = 'bg-red-50';
      sparklineColor = '#ef4444';
    } else if (hasWarning) {
      level = 'WARNING';
      color = 'text-orange-500';
      bgColor = 'bg-orange-50';
      sparklineColor = '#f97316';
    }
    
    return { level, score: maxScore, color, bgColor, sparklineColor };
  }, [nodes]);

  const dynamicRiskDistribution = useMemo(() => {
    if (nodes.length === 0) return [];

    let low = 0, mod = 0, high = 0, crit = 0;
    nodes.forEach(n => {
      const status = (n.status || '').toLowerCase();
      if (status === 'critical') crit++;
      else if (status === 'warning' || status === 'high') high++;
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

  return (
    <div className="space-y-6">
      {/* Date and Export Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Local Gateway Dashboard</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gateway: {user?.gateway_id || 'GW-01'} | Panel: {user?.panel_id || 'P-01'} | Mesh: {user?.mesh_id || 'MESH-01'}
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-700 dark:text-slate-300 font-medium shadow-sm w-full sm:w-auto justify-center">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>{formattedTime}</span>
          <span className="text-slate-400 text-[10px] ml-2">⌄</span>
        </div>
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
          sparklineData={[{ value: 10 }, { value: 12 }, { value: 15 }, { value: 14 }, { value: 18 }, { value: 20 }, { value: 24 }]}
          sparklineColor="#3b82f6"
        />
        <SummaryCard
          title="Online Nodes"
          value={onlineNodes}
          subtitle="91.7% Online"
          icon={CheckCircle2}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-500"
          sparklineData={[{ value: 20 }, { value: 22 }, { value: 21 }, { value: 24 }, { value: 22 }, { value: 23 }, { value: 22 }]}
          sparklineColor="#22c55e"
        />
        <SummaryCard
          title="Active Warnings"
          value={activeWarnings}
          subtitle="Needs Attention"
          icon={AlertTriangle}
          iconBgColor="bg-orange-50"
          iconColor="text-orange-500"
          sparklineData={[{ value: 0 }, { value: 1 }, { value: 1 }, { value: 3 }, { value: 2 }, { value: 4 }, { value: 2 }]}
          sparklineColor="#f97316"
        />
        <SummaryCard
          title="Overall Risk Level"
          value={overallRisk.level}
          subtitle={`Risk Score: ${overallRisk.score}%`}
          icon={ShieldAlert}
          iconBgColor={overallRisk.bgColor}
          iconColor={overallRisk.color}
          sparklineData={[{ value: 50 }, { value: 48 }, { value: 65 }, { value: 60 }, { value: 75 }, { value: 72 }, { value: overallRisk.score }]}
          sparklineColor={overallRisk.sparklineColor}
          valueColor={overallRisk.color}
        />
      </div>

      {/* Main Grid: Map and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 h-full min-h-[500px]">
          <LiveMap nodes={nodes} />
        </div>
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          <MeshHealthPanel onlineNodes={onlineNodes} totalNodes={totalNodes} />
        </div>
      </div>

      {/* Bottom Grid: Alerts and Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2">
          <RecentAlerts alerts={alerts} />
        </div>
        <DeformationChart data={activeTrend} />
        <RiskDistribution data={dynamicRiskDistribution} total={totalNodes} />
      </div>
    </div>
  );
};
