import React from 'react';
import { Alert } from '../../types';
import { TrendingUp, AlertTriangle, Radio, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

interface RecentAlertsProps {
  alerts: Alert[];
}

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'deformation': return TrendingUp;
    case 'tilt': return AlertTriangle;
    case 'vibration': return Radio;
    case 'system': return CheckCircle2;
    default: return AlertTriangle;
  }
};

const getSeverityStyles = (severity: string) => {
  switch (severity) {
    case 'high': return 'bg-red-50 text-red-600 border-red-100';
    case 'medium': return 'bg-orange-50 text-orange-500 border-orange-100';
    case 'low': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    default: return 'bg-slate-50 text-slate-600 border-slate-100';
  }
};

export const RecentAlerts: React.FC<RecentAlertsProps> = ({ alerts }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card flex flex-col h-full">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800">Recent Alerts</h2>
        <button onClick={() => navigate('/alerts')} className="text-sm text-blue-600 font-medium hover:text-blue-700">View All</button>
      </div>

      <div className="flex-1 p-3 flex flex-col space-y-2 overflow-y-auto">
        {alerts.slice(0, 4).map((alert) => {
          const Icon = getAlertIcon(alert.type);
          const severityStyle = getSeverityStyles(alert.severity);

          return (
            <div key={alert.id} className="flex items-start p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group">
              <div className={clsx("p-2.5 rounded-xl border flex-shrink-0 mt-0.5", severityStyle)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="ml-4 flex-1">
                <h4 className="text-sm font-semibold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{alert.title}</h4>
                <p className="text-xs text-slate-500 mb-1">{alert.description}</p>
                <p className="text-[10px] text-slate-400 font-medium">{alert.timestamp}</p>
              </div>
              <div className={clsx(
                "px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ml-2",
                alert.severity === 'high' ? 'bg-red-50 border-red-100 text-red-600' :
                  alert.severity === 'medium' ? 'bg-orange-50 border-orange-100 text-orange-500' :
                    'bg-emerald-50 border-emerald-100 text-emerald-600'
              )}>
                {alert.severity}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-100 text-center">
        <button onClick={() => navigate('/alerts')} className="text-sm text-blue-600 font-semibold hover:text-blue-700 flex items-center justify-center w-full">
          View all alerts <span className="ml-1">→</span>
        </button>
      </div>
    </div>
  );
};
