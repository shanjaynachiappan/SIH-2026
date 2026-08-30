import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, ChevronDown, User, LogOut, Layers, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMine } from '../../context/MineContext';

export const CentralHeader: React.FC = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState('Just now');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  const { mines, selectedMineId, setSelectedMineId, selectedMine } = useMine();

  const handleLogout = () => {
    logout();
    navigate('/welcome');
  };

  const handleSyncNow = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSync('Just now');
    }, 800);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'ADMIN':
      case 'CENTRAL_ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'REGULATOR':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'PLANNER':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <header className="h-20 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40 gap-4">
      {/* Left Area: Context & Search */}
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <button className="text-slate-500 hover:text-slate-700 transition-colors lg:hidden flex-shrink-0">
          <Menu className="w-5 h-5" />
        </button>

        {/* Mine Scope Indicator */}
        <div className="hidden sm:flex items-center space-x-2.5 bg-slate-50 border border-slate-200/90 px-3 py-1.5 rounded-xl flex-shrink-0 shadow-sm">
          <div className="bg-emerald-500/10 p-1.5 rounded-lg text-emerald-600 flex-shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="whitespace-nowrap">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-400">Mine:</span>
              <select
                value={selectedMineId}
                onChange={(e) => setSelectedMineId(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
              >
                <option value="ALL">All Mines ({mines.length})</option>
                {mines.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.id} - {m.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
              {selectedMine ? `${selectedMine.totalPanels} Panels • ${selectedMine.totalGateways} Gateways • ${selectedMine.totalNodes} Nodes` : 'Multi-Mine Aggregate'}
            </p>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative max-w-sm w-full hidden md:block flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search panels, gateways, node IDs..." 
            className="w-full bg-slate-100/80 text-slate-700 text-xs rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:bg-white transition-all border border-transparent focus:border-slate-300"
          />
        </div>
      </div>

      {/* Right Area: Sync, Alerts, Role & User */}
      <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0">
        {/* Central Sync Badge & Action */}
        <div className="hidden xl:flex items-center space-x-2 bg-emerald-50/90 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs flex-shrink-0 whitespace-nowrap">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-emerald-800 text-[11px]">ONLINE</span>
          <span className="text-emerald-600 font-medium text-[11px]">Synced {lastSync}</span>
          <button 
            onClick={handleSyncNow} 
            disabled={isSyncing}
            className="p-1 hover:bg-emerald-100 rounded text-emerald-700 transition-colors" 
            title="Force Synchronize with All Gateways"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Role Pill */}
        <div className="hidden sm:block flex-shrink-0 whitespace-nowrap">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${getRoleBadgeStyle(currentUser?.role)}`}>
            {currentUser?.role || 'PLANNER'}
          </span>
        </div>

        {/* Alerts Bell */}
        <button 
          onClick={() => navigate('/central/alerts')}
          className="text-slate-500 hover:text-slate-700 transition-colors relative p-2 hover:bg-slate-100 rounded-xl flex-shrink-0"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            2
          </span>
        </button>
        
        {/* User Profile Menu */}
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <div 
            className="flex items-center space-x-2.5 cursor-pointer pl-3 border-l border-slate-200"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <img 
              src={`https://api.dicebear.com/7.x/notionists/svg?seed=${currentUser?.name || 'CentralOfficer'}&backgroundColor=e2e8f0`} 
              alt={currentUser?.name || 'User'} 
              className="w-9 h-9 rounded-full border border-slate-200 bg-slate-100 flex-shrink-0"
            />
            <div className="hidden sm:block text-xs select-none whitespace-nowrap">
              <p className="font-semibold text-slate-900 leading-tight">
                {currentUser?.name || 'Mine Planner'}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                {currentUser?.email || 'planner@mineguard.com'}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block flex-shrink-0" />
          </div>

          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{currentUser?.name || 'Mine Planner'}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getRoleBadgeStyle(currentUser?.role)}`}>
                  {currentUser?.role || 'PLANNER'}
                </span>
              </div>

              <button 
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate('/central/settings');
                }}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center transition-colors font-medium"
              >
                <User className="w-3.5 h-3.5 mr-2" />
                Central Settings & Profile
              </button>

              <div className="h-px bg-slate-100 my-1 mx-2"></div>
              
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center transition-colors font-semibold"
              >
                <LogOut className="w-3.5 h-3.5 mr-2" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
