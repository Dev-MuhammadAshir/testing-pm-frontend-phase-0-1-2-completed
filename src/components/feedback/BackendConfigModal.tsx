import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  getApiBaseUrl,
  setApiBaseUrl,
  resetApiBaseUrl,
  DEFAULT_API_BASE_URL,
  getFrontendOrigin,
} from '@/lib/api/config';
import { healthService } from '@/lib/api/health.service';
import { Activity, Check, CheckCircle2, Copy, Globe, RotateCcw, Server, XCircle } from 'lucide-react';
import { useToast } from '@/app/providers/ToastProvider';

export interface BackendConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function BackendConfigModal({ isOpen, onClose, onSaved }: BackendConfigModalProps) {
  const [url, setUrl] = useState('');
  const [isPinging, setIsPinging] = useState(false);
  const [hasCopiedOrigin, setHasCopiedOrigin] = useState(false);
  const [pingResult, setPingResult] = useState<{
    tested: boolean;
    isHealthy: boolean;
    latencyMs?: number;
    error?: string;
  }>({ tested: false, isHealthy: false });

  const toast = useToast();
  const frontendOrigin = getFrontendOrigin();

  useEffect(() => {
    if (isOpen) {
      setUrl(getApiBaseUrl());
      setPingResult({ tested: false, isHealthy: false });
    }
  }, [isOpen]);

  async function handleTestConnection() {
    setIsPinging(true);
    setPingResult({ tested: false, isHealthy: false });
    try {
      const res = await healthService.checkHealth();
      setPingResult({
        tested: true,
        isHealthy: res.isHealthy,
        latencyMs: res.latencyMs,
        error: res.error,
      });
      if (res.isHealthy) {
        toast.success('Connected', `Backend reachable in ${res.latencyMs}ms`);
      } else {
        toast.error('Connection Failed', res.error || 'Server did not respond with 200 OK');
      }
    } finally {
      setIsPinging(false);
    }
  }

  function handleSave() {
    if (!url.trim()) {
      toast.error('Invalid URL', 'Please enter a valid API URL');
      return;
    }
    setApiBaseUrl(url);
    toast.success('Saved', `API Base URL updated`);
    if (onSaved) onSaved();
    onClose();
  }

  function handleReset() {
    resetApiBaseUrl();
    setUrl(DEFAULT_API_BASE_URL);
    toast.info('Reset', `API Base URL reset to default: ${DEFAULT_API_BASE_URL}`);
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setHasCopiedOrigin(true);
      toast.success('Copied', 'Frontend URL copied to clipboard for CORS configuration');
      setTimeout(() => setHasCopiedOrigin(false), 2500);
    } catch {
      toast.error('Copy Failed', 'Unable to copy to clipboard');
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Backend API Configuration & CORS"
      description="Configure your backend target and get your frontend URL for CORS allowlisting."
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Frontend Origin for CORS */}
        <div className="p-3.5 bg-slate-950/70 rounded-xl border border-indigo-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Frontend URL (Add to Backend CORS)
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(frontendOrigin)}
              className="text-xs flex items-center gap-1 text-slate-300 hover:text-white bg-indigo-600/30 hover:bg-indigo-600/50 px-2 py-1 rounded transition-colors"
            >
              {hasCopiedOrigin ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{hasCopiedOrigin ? 'Copied' : 'Copy URL'}</span>
            </button>
          </div>
          <p className="font-mono text-xs text-slate-200 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 break-all select-all">
            {frontendOrigin}
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            In Railway, add this URL to your backend environment variable (e.g. <code className="text-indigo-300 font-mono">CORS_ORIGIN</code> or <code className="text-indigo-300 font-mono">ALLOWED_ORIGINS</code>) so the browser can make requests without CORS blocks.
          </p>
        </div>

        {/* API Target Input */}
        <div>
          <Input
            label="API Base URL (REST API v1)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://phase0-fyp-pm-backend-2-production.up.railway.app/api/v1"
            helperText={`Default: ${DEFAULT_API_BASE_URL}`}
            leftIcon={<Server className="w-4 h-4" />}
          />
        </div>

        {/* Live ping result */}
        {pingResult.tested && (
          <div
            className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
              pingResult.isHealthy
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              {pingResult.isHealthy ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>
                {pingResult.isHealthy
                  ? `Backend live (Latency: ${pingResult.latencyMs}ms)`
                  : `Backend unreachable (${pingResult.error || 'Connection refused or CORS error'})`}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Default
          </Button>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTestConnection}
              isLoading={isPinging}
              leftIcon={<Activity className="w-3.5 h-3.5" />}
            >
              Test Ping
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              Save & Apply
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
