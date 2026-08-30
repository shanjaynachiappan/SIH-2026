import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut, UserCheck, Hexagon } from 'lucide-react';
import { authService } from '../services/authService';

export const AccessRestrictedPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

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
          This dashboard is available only to authorized Mine Controllers.
        </p>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
          Contact your Shift Supervisor or system administrator.
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
              <span className="font-mono font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                {currentUser.role}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Required Role:</span>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center">
                <UserCheck className="w-3 h-3 mr-1" /> MINE_CONTROLLER
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="space-y-3">
          <button
            onClick={handleSwitchAccount}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-md shadow-blue-500/20 transition-all text-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-1" />
            <span>Back to Sign In</span>
          </button>
        </div>

      </div>
    </div>
  );
};
