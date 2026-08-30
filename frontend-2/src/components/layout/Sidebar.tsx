import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Radio, 
  Bell, 
  BarChart2, 
  Settings,
  Hexagon
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { name: 'Dashboard', path: '/local', icon: LayoutDashboard },
  { name: 'Alerts', path: '/local/alerts', icon: Bell, badge: 2 },
  { name: 'Nodes', path: '/local/nodes', icon: Radio },
  { name: 'Trend', path: '/local/trend', icon: BarChart2 },
  { name: 'Settings', path: '/local/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { user: currentUser } = useAuth();
  const gatewayBadge = currentUser 
    ? `${currentUser.gateway_id} • ${currentUser.mesh_id || 'MESH-01'} • ${currentUser.panel_id}` 
    : 'GW-01 • MESH-01 • P-01';

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col fixed left-0 top-0 overflow-y-auto">
      {/* Logo */}
      <div className="p-6 flex items-center space-x-3">
        <div className="bg-gradient-to-tr from-cyan-500 to-blue-500 p-2 rounded-xl text-white">
          <Hexagon className="w-6 h-6 fill-current" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">MineGuard<span className="text-cyan-500">.ai</span></h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">SMART MONITORING</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center space-x-3">
                  <item.icon className={clsx("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={clsx(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                    isActive ? "bg-white text-blue-600" : "bg-red-500 text-white"
                  )}>
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Promo Card */}
      <div className="p-4 mt-auto">
        <div className="bg-gradient-to-br from-blue-700 to-slate-900 rounded-xl p-4 text-white relative overflow-hidden shadow-md">
          <div className="relative z-10">
            <h3 className="font-semibold text-sm mb-1">Underground Safety</h3>
            <p className="text-[10px] text-blue-100 mb-3 opacity-90">Powered by IoT, AI & GIS</p>
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-xs">→</span>
            </div>
          </div>
          {/* Abstract illustration shapes */}
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute right-8 -bottom-8 w-16 h-16 bg-white/10 rounded-full" />
        </div>
      </div>

      {/* System Health */}
      <div className="px-6 pb-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">System Health</h4>
        <ul className="space-y-2 text-xs text-slate-600 font-medium">
          <li className="flex justify-between items-center text-[10px] text-slate-400 mb-2 border-b border-slate-100 pb-2">
            <span>{gatewayBadge}</span>
          </li>
          <li className="flex justify-between items-center">
            <span>Gateway</span>
            <span className="flex items-center text-emerald-500"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>Online</span>
          </li>
          <li className="flex justify-between items-center">
            <span>Data Sync</span>
            <span className="flex items-center text-emerald-500"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>Just sync</span>
          </li>
          <li className="flex justify-between items-center">
            <span>Uptime</span>
            <span className="flex items-center text-emerald-500"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>99.8%</span>
          </li>
          <li className="flex justify-between items-center">
            <span>Mesh Health</span>
            <span className="flex items-center text-emerald-500"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>Good</span>
          </li>
        </ul>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 pt-2">
        <p className="text-[10px] text-slate-400">© 2025 MineGuard<br/>All rights reserved.</p>
      </div>
    </aside>
  );
};
