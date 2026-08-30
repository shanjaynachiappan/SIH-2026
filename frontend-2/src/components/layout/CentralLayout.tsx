import React from 'react';
import { Outlet } from 'react-router-dom';
import { CentralSidebar } from './CentralSidebar';
import { CentralHeader } from './CentralHeader';

export const CentralLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <CentralSidebar />
      <div className="flex-1 flex flex-col pl-64">
        <CentralHeader />
        <main className="flex-1 p-6 overflow-y-auto max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
