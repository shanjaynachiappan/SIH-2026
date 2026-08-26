import React from 'react';
import { Wifi, Cpu, ShieldAlert } from 'lucide-react';

const features = [
  { icon: Wifi, title: "Real-time\nMonitoring", color: "text-[#1769E0]", bg: "bg-blue-50" },
  { icon: Cpu, title: "AI Risk\nPrediction", color: "text-[#1769E0]", bg: "bg-blue-50" },
  { icon: ShieldAlert, title: "Early Warning\nAlerts", color: "text-emerald-500", bg: "bg-emerald-50" }
];

export const HeroFeature: React.FC = () => {
  return (
    <div className="flex items-center space-x-12 mt-8 z-10 relative">
      {features.map((item, idx) => (
        <div key={idx} className="flex flex-col items-center text-center group">
          <div className={`w-14 h-14 ${item.bg} rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform duration-300`}>
            <item.icon className={`w-6 h-6 ${item.color}`} />
          </div>
          <p className="text-xs font-bold text-[#14213D] whitespace-pre-line leading-tight">
            {item.title}
          </p>
        </div>
      ))}
    </div>
  );
};
