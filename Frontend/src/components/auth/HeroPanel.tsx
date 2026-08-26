import React from 'react';
import { HeroFeature } from './HeroFeature';
import { MetricBar } from './MetricBar';
import { Radio } from 'lucide-react';

export const HeroPanel: React.FC = () => {
  return (
    <div className="relative h-full w-full bg-slate-900 overflow-hidden flex flex-col">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-60 mix-blend-overlay"
        style={{ 
          backgroundImage: 'url(https://images.unsplash.com/photo-1578330554522-8356942c7e0b?q=80&w=2070&auto=format&fit=crop)',
          filter: 'contrast(1.1) brightness(0.8)'
        }}
      />
      
      {/* Network overlay simulation */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
      
      {/* Network Nodes Simulation (Absolute positioned dots & lines) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <svg width="100%" height="100%" className="absolute inset-0">
          <line x1="20%" y1="60%" x2="50%" y2="80%" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" />
          <line x1="50%" y1="80%" x2="80%" y2="65%" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" />
          <line x1="20%" y1="60%" x2="35%" y2="40%" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" />
          <line x1="80%" y1="65%" x2="65%" y2="45%" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" />
          <line x1="35%" y1="40%" x2="65%" y2="45%" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" />
        </svg>
        
        {/* Nodes */}
        {[
          { top: '60%', left: '20%' },
          { top: '80%', left: '50%' },
          { top: '65%', left: '80%' },
          { top: '40%', left: '35%' },
          { top: '45%', left: '65%' },
        ].map((pos, idx) => (
          <div key={idx} className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2" style={pos}>
            <Radio className="w-10 h-10 text-blue-400 mb-1 animate-pulse" />
            <div className="w-8 h-10 bg-slate-300 rounded-sm border-2 border-slate-400 shadow-xl relative">
              <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
            </div>
          </div>
        ))}
      </div>

      {/* Top Content */}
      <div className="relative z-10 p-12 lg:p-16 flex-1 flex flex-col justify-start">
        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 leading-[1.1]">
          <span className="text-[#1769E0]">Smarter</span> <span className="text-[#14213D]">Monitoring.</span><br />
          <span className="text-[#1769E0]">Safer</span> <span className="text-[#14213D]">Mining.</span>
        </h1>
        
        <p className="text-sm lg:text-base text-[#14213D] font-medium max-w-md leading-relaxed">
          AI-powered real-time subsidence monitoring for underground coal mines using IoT, GIS and advanced analytics.
        </p>

        <HeroFeature />
      </div>

      <MetricBar />
    </div>
  );
};
