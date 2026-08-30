import React from 'react';
import { HeroPanel } from './HeroPanel';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#F7FAFF] font-sans">
      {/* Left Authentication Panel */}
      <div className="w-full lg:w-[48%] flex flex-col justify-between px-8 sm:px-16 lg:px-24 py-12 h-screen overflow-y-auto">
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full relative z-10">
          {children}
        </div>
        <div className="text-center mt-12">
          <p className="text-xs font-medium text-slate-400">
            © 2025 MineGuard. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Hero Panel */}
      <div className="hidden lg:block lg:w-[52%] relative bg-slate-100">
        <HeroPanel />
      </div>
    </div>
  );
};
