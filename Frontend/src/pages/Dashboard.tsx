import React from 'react';
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
  mockNodes, 
  mockAlerts, 
  deformationTrend, 
  riskDistribution, 
  sensorStatusData, 
  environmentalData 
} from '../data/mockData';

export const Dashboard: React.FC = () => {
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
          value={summaryData.totalNodes} 
          subtitle="Across 1 Panel" 
          icon={Radio} 
          iconBgColor="bg-blue-50" 
          iconColor="text-blue-500"
          sparklineData={[{value: 10}, {value: 12}, {value: 15}, {value: 14}, {value: 18}, {value: 20}, {value: 24}]}
          sparklineColor="#3b82f6"
        />
        <SummaryCard 
          title="Online Nodes" 
          value={summaryData.onlineNodes} 
          subtitle="91.7% Online" 
          icon={CheckCircle2} 
          iconBgColor="bg-emerald-50" 
          iconColor="text-emerald-500"
          sparklineData={[{value: 20}, {value: 22}, {value: 21}, {value: 24}, {value: 22}, {value: 23}, {value: 22}]}
          sparklineColor="#22c55e"
        />
        <SummaryCard 
          title="Active Warnings" 
          value={summaryData.activeWarnings} 
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
          <LiveMap nodes={mockNodes} />
        </div>
        <div className="lg:col-span-1">
          <RecentAlerts alerts={mockAlerts} />
        </div>
      </div>

      {/* Bottom Grid: Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DeformationChart data={deformationTrend} />
        <RiskDistribution data={riskDistribution} total={24} />
        <NodeStatus data={sensorStatusData} total={24} />
        <EnvironmentalTelemetry data={environmentalData} />
      </div>
    </div>
  );
};
