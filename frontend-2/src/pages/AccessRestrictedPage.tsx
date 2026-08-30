import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut, Hexagon, ArrowRight } from 'lucide-react';
import { authService } from '../services/authService';

export const AccessRestrictedPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const canCentral = authService.canAccessCentral();
  const canLocal = authService.canAccessLocal();

  const handleSwitchAccount = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 font-sans">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-xl p-8 sm:p-10 text-center relative overflow-hidden">
        
        {/* Subtle decorative background accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <div className="bg-gradient-to-tr from-cyan-500 to-blue-500 p-2 rounded-xl text-white shadow-md shadow-blue-500/20">
            <Hexagon className="w-5 h-5 fill-current" />
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">MineGuard<span className="text-cyan-500">.ai</span></span>
        </div>

        {/* Icon */}
        <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>

        {/* Headings */}
        <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
          Access Restricted
        </h1>
        <p className="text-sm font-semibold text-slate-700 mb-2">
          Your current role does not have authorization for this area.
        </p>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
          Mine Controllers access Local Gateways, while Planners, Regulators, and Administrators access the Central Mine Dashboard.
        </p>

        {/* User context card */}
        {currentUser && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left mb-6 text-xs space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Logged in as:</span>
              <span className="font-semibold text-slate-800">{currentUser.email}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Assigned Role:</span>
              <span className="font-mono font-bold text-slate-900 bg-slate-200/80 px-2 py-0.5 rounded">
                {currentUser.role}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {canCentral && (
            <button
              onClick={() => navigate('/central')}
              className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 px-6 rounded-xl shadow-md transition-all text-sm cursor-pointer"
            >
              <span>Go to Central Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {canLocal && (
            <button
              onClick={() => navigate('/local')}
              className="w-full flex items-center justify-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-md transition-all text-sm cursor-pointer"
            >
              <span>Go to Local Gateway Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleSwitchAccount}
            className="w-full flex items-center justify-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-6 rounded-xl border border-slate-200 transition-all text-xs cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-1" />
            <span>Switch Account (Sign In)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
