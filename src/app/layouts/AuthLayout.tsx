import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sparkles, Server, ShieldCheck } from 'lucide-react';
import { BackendConfigModal } from '@/components/feedback/BackendConfigModal';
import { getApiBaseUrl } from '@/lib/api/config';

export function AuthLayout() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  return (
    <div className="min-h-screen w-screen bg-slate-950 flex flex-col justify-between p-4 md:p-8 relative overflow-hidden select-none">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold text-slate-100 tracking-tight">PulsePM</span>
            <span className="text-xs text-indigo-400 font-mono ml-2 border border-indigo-500/30 px-1.5 py-0.5 rounded-full">
              Phase 0–2
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsConfigOpen(true)}
          className="flex items-center space-x-2 text-xs font-mono text-slate-400 hover:text-slate-200 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors"
          title="Configure backend API target"
        >
          <Server className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">API:</span>
          <span className="truncate max-w-[140px] text-slate-300">{getApiBaseUrl()}</span>
        </button>
      </div>

      {/* Main Form Center */}
      <div className="flex-1 flex items-center justify-center py-8 z-10">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-4 z-10 gap-2">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>FYP 2K23/SWEE/21 • University of Sindh</span>
        </div>
        <p className="text-center sm:text-right text-[11px] text-slate-400">
          Strict Scope: Foundation, Real-Time Gateway, Auth & User Administration (Phases 0–2)
        </p>
      </div>

      <BackendConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
    </div>
  );
}
