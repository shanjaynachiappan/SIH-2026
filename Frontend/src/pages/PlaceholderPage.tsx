import React from 'react';
import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-white rounded-2xl border border-slate-200 shadow-card">
      <div className="p-4 bg-slate-50 rounded-full mb-4">
        <Construction className="w-12 h-12 text-slate-400" />
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">{title}</h2>
      <p className="text-slate-500 font-medium">This module is currently under development.</p>
    </div>
  );
};
