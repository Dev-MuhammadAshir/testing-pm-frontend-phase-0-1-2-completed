import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { getRoleBadgeClass } from '@/lib/utils/roleHelpers';
import { getInitials } from '@/lib/utils/formatters';
import { healthService } from '@/lib/api/health.service';
import { Activity, LogOut, Server, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TopNavbarProps {
  onOpenBackendConfig: () => void;
}

export function TopNavbar({ onOpenBackendConfig }: TopNavbarProps) {
  const { user, logout } = useAuth();
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    async function check() {
      try {
        const res = await healthService.checkHealth();
        if (mounted) setIsBackendHealthy(res.isHealthy);
      } catch {
        if (mounted) setIsBackendHealthy(false);
      }
    }
    check();
    const interval = setInterval(check, 25000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="h-16 bg-slate-900/80 border-b border-slate-800/80 px-6 flex items-center justify-between shrink-0 backdrop-blur-md">
      {/* Left side info */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-300">Workspace</span>
          <span className="text-slate-600">/</span>
          <span className="text-xs font-medium text-slate-400">University of Sindh (2K23/SWEE/21)</span>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center space-x-4">
        {/* Backend health pill button */}
        <button
          type="button"
          onClick={onOpenBackendConfig}
          className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950/40 hover:bg-slate-800/60 text-xs transition-colors"
          title="Click to check backend health and configure API URL"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isBackendHealthy === true
                ? 'bg-emerald-400 shadow-xs shadow-emerald-400/50'
                : isBackendHealthy === false
                ? 'bg-rose-500 shadow-xs shadow-rose-500/50'
                : 'bg-amber-400 animate-pulse'
            }`}
          />
          <span className="text-slate-400 font-mono text-[11px]">
            {isBackendHealthy === true ? 'API Connected' : isBackendHealthy === false ? 'API Offline' : 'Checking API'}
          </span>
          <Server className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* Global role badge */}
        {user?.globalRole && (
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium border ${getRoleBadgeClass(
              user.globalRole
            )}`}
          >
            {user.globalRole}
          </span>
        )}

        {/* User profile dropdown trigger */}
        <Link
          to="/profile"
          className="flex items-center space-x-2.5 pl-2 group"
          title="View profile"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-slate-800 group-hover:ring-indigo-500/50 transition-all">
            {getInitials(user?.fullName || 'User')}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
              {user?.fullName}
            </p>
            <p className="text-[10px] text-slate-400 truncate max-w-[130px]">{user?.email}</p>
          </div>
        </Link>

        {/* Logout button */}
        <button
          type="button"
          onClick={() => logout()}
          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
