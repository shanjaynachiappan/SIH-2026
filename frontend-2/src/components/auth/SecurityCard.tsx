import React from 'react';
import { Shield } from 'lucide-react';

export const SecurityCard: React.FC = () => {
  return (
    <div className="mt-8 bg-blue-50/50 rounded-xl p-4 flex items-start space-x-3 border border-blue-100/50 relative overflow-hidden">
      <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
        <Shield className="w-5 h-5 text-[#1769E0]" />
      </div>
      <div className="relative z-10">
        <h4 className="text-sm font-bold text-[#14213D] mb-0.5">Secure Access</h4>
        <p className="text-xs text-slate-500">Your data is protected with enterprise-grade security</p>
      </div>
      <Shield className="absolute -right-4 -bottom-4 w-16 h-16 text-blue-100/50 transform rotate-12" />
    </div>
  );
};
