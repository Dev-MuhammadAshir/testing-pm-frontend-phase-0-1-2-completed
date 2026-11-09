import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { ApiConnectionBanner } from '@/components/feedback/ApiConnectionBanner';
import { BackendConfigModal } from '@/components/feedback/BackendConfigModal';

export function AppLayout() {
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <Sidebar onOpenBackendConfig={() => setIsBackendModalOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Connection status banner (shows only if unreachable) */}
        <ApiConnectionBanner />

        {/* Top Navbar */}
        <TopNavbar onOpenBackendConfig={() => setIsBackendModalOpen(true)} />

        {/* Scrollable Page Outlet */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950/70">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Backend Configuration Modal */}
      <BackendConfigModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
      />
    </div>
  );
}
