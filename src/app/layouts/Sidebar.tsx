import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { isAdministrator } from '@/lib/utils/roleHelpers';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Shield,
  Activity,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  onOpenBackendConfig: () => void;
}

export function Sidebar({ onOpenBackendConfig }: SidebarProps) {
  const { user, logout } = useAuth();
  const isAdmin = isAdministrator(user?.globalRole);

  const navItems = [
    {
      name: 'Dashboard',
      to: '/dashboard',
      icon: LayoutDashboard,
      show: true,
      description: 'System & session overview',
    },
    {
      name: 'User Management',
      to: '/users',
      icon: Users,
      show: isAdmin,
      description: 'Admin-only directory & RBAC',
      badge: 'Admin',
    },
    {
      name: 'My Profile',
      to: '/profile',
      icon: UserCheck,
      show: true,
      description: 'Personal info & password',
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-600/30">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-slate-100 truncate tracking-tight">
            PulsePM
          </h1>
          <p className="text-[11px] text-slate-400 truncate font-mono">
            Phase 0–2 Foundation
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Core Modules
        </div>
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className="w-4 h-4 shrink-0 transition-colors group-hover:text-slate-200" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

        <div className="pt-4 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Platform Scope
        </div>
        <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/60 text-[11px] text-slate-400 space-y-1.5">
          <div className="flex items-center space-x-1.5 text-indigo-400 font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Phase 0–2 Verified</span>
          </div>
          <p className="leading-relaxed text-slate-400">
            Authentication, RBAC access control, admin user provisioning, and profile management.
          </p>
        </div>
      </nav>

      {/* Footer Info & API Diagnostics */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        <button
          type="button"
          onClick={onOpenBackendConfig}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 transition-colors border border-transparent hover:border-slate-700/60"
        >
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>API Diagnostics</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">v1</span>
        </button>

        <button
          type="button"
          onClick={() => logout()}
          className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
