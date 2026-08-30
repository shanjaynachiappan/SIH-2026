import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MapPin, 
  ArrowLeftRight, 
  FileText, 
  Settings, 
  Hexagon, 
  ShieldAlert,
  Router,
  FileCheck2,
  Grid,
  Radio,
  Bell
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

export const CentralSidebar: React.FC = () => {
  const { user: currentUser } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col fixed left-0 top-0 overflow-y-auto z-30">
      {/* Logo */}
      <div className="p-6 flex items-center space-x-3">
        <div className="bg-gradient-to-tr from-emerald-600 to-cyan-500 p-2 rounded-xl text-white shadow-md shadow-emerald-500/20">
          <Hexagon className="w-6 h-6 fill-current" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
            MineGuard<span className="text-cyan-500">.ai</span>
          </h1>
          <div className="flex items-center space-x-1.5 mt-0.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              CENTRAL COMMAND
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-4">
        {/* Main Section */}
        <div className="space-y-1">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              clsx(
                'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-white shadow-md shadow-cyan-500/20 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )
            }
          >
            {({ isActive }) => (
              <div className="flex items-center space-x-3">
                <LayoutDashboard className={clsx("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
                <span>Central Dashboard</span>
              </div>
            )}
          </NavLink>
        </div>

        {/* Mines & Panels */}
        <div>
          <h4 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Hierarchy Directory
          </h4>
          <div className="space-y-1">
            <NavLink
              to="/central/panels"
              className={({ isActive }) =>
                clsx(
                  'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors duration-150',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-white shadow-md shadow-cyan-500/20 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              {({ isActive }) => (
                <div className="flex items-center space-x-2.5">
                  <Grid className={clsx("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
                  <span>Mines & Panels</span>
                </div>
              )}
            </NavLink>
          </div>
        </div>

        {/* Monitoring Directory */}
        <div>
          <h4 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Monitoring
          </h4>
          <div className="space-y-1">
            <NavLink
              to="/central/nodes"
              className={({ isActive }) =>
                clsx(
                  'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors duration-150',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-white shadow-md shadow-cyan-500/20 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              {({ isActive }) => (
                <div className="flex items-center space-x-2.5">
                  <Radio className={clsx("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
                  <span>Nodes</span>
                </div>
              )}
            </NavLink>

            <NavLink
              to="/central/gateways"
              className={({ isActive }) =>
                clsx(
                  'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors duration-150',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-white shadow-md shadow-cyan-500/20 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              {({ isActive }) => (
                <div className="flex items-center space-x-2.5">
                  <Router className={clsx("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
                  <span>Gateways / Meshes</span>
                </div>
              )}
            </NavLink>

            <NavLink
              to="/central/alerts"
              className={({ isActive }) =>
                clsx(
                  'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors duration-150',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-white shadow-md shadow-cyan-500/20 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              {({ isActive }) => (
                <div className="flex items-center space-x-2.5">
                  <Bell className={clsx("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
                  <span>Alerts</span>
                </div>
              )}
            </NavLink>
          </div>
        </div>

        {/* Planning Section */}
        <div>
          <h4 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Planning & Optimization
          </h4>
          <div className="space-y-1">
            <NavLink
              to="/planning/placement"
              className={({ isActive }) =>
                clsx(
                  'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors duration-150',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-white shadow-md shadow-cyan-500/20 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              {({ isActive }) => (
                <div className="flex items-center space-x-2.5">
                  <MapPin className={clsx("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
                  <span>Sensor Placement</span>
                </div>
              )}
            </NavLink>

            <NavLink
              to="/planning/relocation"
              className={({ isActive }) =>
                clsx(
                  'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors duration-150',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-white shadow-md shadow-cyan-500/20 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              {({ isActive }) => (
                <div className="flex items-center space-x-2.5">
                  <ArrowLeftRight className={clsx("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
                  <span>Node Relocation</span>
                </div>
              )}
            </NavLink>
          </div>
        </div>

        {/* Compliance & Reports */}
        <div>
          <h4 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Governance & Audits
          </h4>
          <div className="space-y-1">
            <NavLink
              to="/compliance"
              className={({ isActive }) =>
                clsx(
                  'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors duration-150',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-white shadow-md shadow-cyan-500/20 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              {({ isActive }) => (
                <div className="flex items-center space-x-2.5">
                  <FileCheck2 className={clsx("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
                  <span>Compliance</span>
                </div>
              )}
            </NavLink>

            <NavLink
              to="/reports"
              className={({ isActive }) =>
                clsx(
                  'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors duration-150',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-white shadow-md shadow-cyan-500/20 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              {({ isActive }) => (
                <div className="flex items-center space-x-2.5">
                  <FileText className={clsx("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
                  <span>Reports</span>
                </div>
              )}
            </NavLink>
          </div>
        </div>

        {/* System & Registry */}
        <div>
          <h4 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            System & Operations
          </h4>
          <div className="space-y-1">
            <NavLink
              to="/admin/gateways"
              className={({ isActive }) =>
                clsx(
                  'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors duration-150',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-white shadow-md shadow-cyan-500/20 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              {({ isActive }) => (
                <div className="flex items-center space-x-2.5">
                  <Router className={clsx("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
                  <span>Gateway Registry</span>
                </div>
              )}
            </NavLink>

            <NavLink
              to="/central/settings"
              className={({ isActive }) =>
                clsx(
                  'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors duration-150',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-white shadow-md shadow-cyan-500/20 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              {({ isActive }) => (
                <div className="flex items-center space-x-2.5">
                  <Settings className={clsx("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
                  <span>Settings</span>
                </div>
              )}
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Hierarchy Info Box */}
      <div className="p-4 mt-auto">
        <div className="bg-gradient-to-br from-[#2A3324] to-[#1C2118] rounded-xl p-3.5 text-white relative overflow-hidden shadow-md">
          <div className="relative z-10 text-xs">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-bold mb-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Strata Surveillance</span>
            </div>
            <p className="text-[10px] text-[#B8C2B2] leading-relaxed">
              Mine → Panel → Gateway → Node Hierarchy active.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-5 pt-1 border-t border-slate-100 text-[10px] text-slate-400">
        MineGuard Central v2.4 • Role: <span className="font-semibold text-slate-600">{currentUser?.role || 'PLANNER'}</span>
      </div>
    </aside>
  );
};
