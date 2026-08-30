import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Sun, Bell, ChevronDown, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Header: React.FC = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/welcome');
  };

  const handleProfile = () => {
    navigate('/local/profile');
    setIsProfileOpen(false);
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

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center space-x-6 flex-1">
        <button className="text-slate-500 hover:text-slate-700 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="relative max-w-md w-full hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search sensors... (36K)" 
            className="w-full bg-slate-100 text-slate-700 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-shadow"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            <span className="text-[10px] font-medium text-slate-400 border border-slate-300 rounded px-1.5 py-0.5">⌘</span>
            <span className="text-[10px] font-medium text-slate-400 border border-slate-300 rounded px-1.5 py-0.5">K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <Sun className="w-5 h-5" />
        </button>
        
        <button className="text-slate-400 hover:text-slate-600 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            3
          </span>
        </button>
        
        <div className="relative" ref={dropdownRef}>
          <div 
            className="flex items-center space-x-3 cursor-pointer pl-4 border-l border-slate-200"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <img 
              src="https://api.dicebear.com/7.x/notionists/svg?seed=MineController&backgroundColor=e2e8f0" 
              alt="Mine Controller" 
              className="w-9 h-9 rounded-full border border-slate-200 bg-slate-100"
            />
            <div className="hidden sm:block text-sm select-none">
              <p className="font-semibold text-slate-900 leading-tight">
                {currentUser?.name || 'Mine Controller'}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                {currentUser ? `${currentUser.gateway_id} • Panel ${currentUser.panel_id}` : 'GW-01 • Panel P-01'}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          </div>

            {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800">{currentUser?.name || 'Mine Controller'}</p>
                <p className="text-[10px] text-slate-400 font-mono">{currentUser?.role}</p>
              </div>

              {['ADMIN', 'CENTRAL_ADMIN', 'PLANNER', 'REGULATOR'].includes(currentUser?.role || '') && (
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/overview');
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-cyan-700 hover:bg-cyan-50 flex items-center transition-colors font-bold"
                >
                  <User className="w-3.5 h-3.5 mr-2 text-cyan-600" />
                  Open Central Dashboard
                </button>
              )}

              <button 
                onClick={handleProfile}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center transition-colors"
              >
                <User className="w-3.5 h-3.5 mr-2" />
                View Profile
              </button>
              <div className="h-px bg-slate-100 my-1 mx-2"></div>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center transition-colors font-medium"
              >
                <LogOut className="w-3.5 h-3.5 mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

