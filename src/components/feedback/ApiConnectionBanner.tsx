import React, { useState, useEffect } from 'react';
import { healthService } from '@/lib/api/health.service';
import { getApiBaseUrl } from '@/lib/api/config';
import { AlertCircle, RefreshCw, Settings } from 'lucide-react';
import { BackendConfigModal } from './BackendConfigModal';

export function ApiConnectionBanner() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function check() {
    setIsChecking(true);
    try {
      const res = await healthService.checkHealth();
      setIsHealthy(res.isHealthy);
    } catch {
      setIsHealthy(false);
    } finally {
      setIsChecking(false);
    }
  }

  useEffect(() => {
    check();
    // Poll every 30 seconds
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isHealthy === true || isHealthy === null) {
    return (
      <>
        <BackendConfigModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={check}
        />
      </>
    );
  }

  return (
    <>
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-300 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Backend unreachable at <code className="font-mono bg-amber-500/20 px-1 py-0.5 rounded text-amber-200">{getApiBaseUrl()}</code>. Ensure your local backend server is running.
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={check}
            disabled={isChecking}
            className="flex items-center space-x-1 hover:text-amber-100 transition-colors p-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Retry</span>
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 px-2 py-1 rounded transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configure URL</span>
          </button>
        </div>
      </div>
      <BackendConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={check}
      />
    </>
  );
}
