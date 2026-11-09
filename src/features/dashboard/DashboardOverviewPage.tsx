import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { isAdministrator, getRoleBadgeClass, getRoleDescription } from '@/lib/utils/roleHelpers';
import { formatDate, formatDateTime, getInitials } from '@/lib/utils/formatters';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Link } from 'react-router-dom';
import { healthService } from '@/lib/api/health.service';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  ShieldCheck,
  Clock,
  Activity,
  Server,
  Key,
  Database,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { BackendConfigModal } from '@/components/feedback/BackendConfigModal';

export function DashboardOverviewPage() {
  const { user } = useAuth();
  const isAdmin = isAdministrator(user?.globalRole);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Live backend health probe query
  const {
    data: health,
    isLoading: isHealthLoading,
    refetch: refetchHealth,
  } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => healthService.checkHealth(),
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-slate-800 p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-indigo-600/30 ring-4 ring-slate-900 shrink-0">
              {getInitials(user?.fullName || 'User')}
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight">
                  Welcome back, {user?.fullName}
                </h1>
                <Badge variant={user?.isActive ? 'success' : 'danger'}>
                  {user?.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Real-Time Team Project Management Platform with Predictive Insights • FYP 2K23/SWEE/21
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <Link to="/profile">
              <Button variant="secondary" size="sm" leftIcon={<UserCheck className="w-3.5 h-3.5" />}>
                My Profile
              </Button>
            </Link>
            {isAdmin && (
              <Link to="/users">
                <Button variant="primary" size="sm" leftIcon={<Users className="w-3.5 h-3.5" />}>
                  Manage Users
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Overview Metric Cards (Strictly Phase 0-2 Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Global Role Card */}
        <Card>
          <CardContent className="p-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Assigned System Role
              </p>
              <h3 className="text-lg font-bold text-slate-100 mt-1.5 flex items-center gap-2">
                {user?.globalRole}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                {user?.globalRole ? getRoleDescription(user.globalRole) : ''}
              </p>
            </div>
            <div className={`p-2.5 rounded-xl border ${getRoleBadgeClass(user?.globalRole)} shrink-0`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Configured Weekly Capacity Card (GAP-06 / SRS §6.2) */}
        <Card>
          <CardContent className="p-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Weekly Capacity
              </p>
              <h3 className="text-lg font-bold text-slate-100 mt-1.5 font-mono">
                {user?.configuredCapacityHours ?? 40} hrs
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Configured PIRAE baseline (10–80 hrs)
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Session Security Posture Card */}
        <Card>
          <CardContent className="p-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Session Model
              </p>
              <h3 className="text-lg font-bold text-slate-100 mt-1.5 font-mono">
                JWT + Redis
              </h3>
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                15m access + 7d refresh
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <Key className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Backend Connectivity Status Card */}
        <Card>
          <CardContent className="p-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Backend Status
              </p>
              <h3 className="text-lg font-bold text-slate-100 mt-1.5 flex items-center gap-2">
                {isHealthLoading ? (
                  <span className="text-slate-400">Probing...</span>
                ) : health?.isHealthy ? (
                  <span className="text-emerald-400">Online</span>
                ) : (
                  <span className="text-rose-400">Unreachable</span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                {health?.latencyMs !== undefined ? `Response time: ${health.latencyMs}ms` : 'Checking connectivity'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors shrink-0"
              title="Click to configure API Base URL"
            >
              <Server className="w-5 h-5" />
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: User Profile & Security Details + System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Account Identity & Scope Specifications */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Account Identity & Specifications</h3>
                <p className="text-xs text-slate-400 mt-0.5">Authenticated user record from PostgreSQL</p>
              </div>
              <Link to="/profile">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Edit Profile
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800/80">
                  <span className="text-slate-400">Full Name</span>
                  <p className="font-semibold text-slate-100 text-sm mt-1">{user?.fullName}</p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800/80">
                  <span className="text-slate-400">Email Address</span>
                  <p className="font-semibold text-slate-100 text-sm mt-1 font-mono">{user?.email}</p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800/80">
                  <span className="text-slate-400">Account ID (UUID)</span>
                  <p className="font-semibold text-slate-300 font-mono text-[11px] mt-1 truncate">
                    {user?.id}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800/80">
                  <span className="text-slate-400">Created At</span>
                  <p className="font-semibold text-slate-200 mt-1">
                    {formatDateTime(user?.createdAt)}
                  </p>
                </div>
              </div>

              {/* Scope Compliance Banner */}
              <div className="mt-5 p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-indigo-300">Phase 0–2 Strict Scope Enforcement:</strong>
                  <p className="mt-1 text-slate-400">
                    This frontend interface interacts exclusively with the completed Phase 0 (Foundation), Phase 1 (Real-Time Infrastructure), and Phase 2 (Authentication & User Administration) backend services. Teams, Projects, Tasks, and Kanban boards are slated for Phase 3 and beyond.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions for Role */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-bold text-slate-100">Authorized Operations (Phase 0–2)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Actions available for role: {user?.globalRole}</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {isAdmin ? (
                  <>
                    <Link
                      to="/users"
                      className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 transition-all text-left group"
                    >
                      <Users className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                      <h4 className="text-xs font-semibold text-slate-200">User Administration</h4>
                      <p className="text-[11px] text-slate-400 mt-1">List, search, filter, and paginate accounts</p>
                    </Link>

                    <Link
                      to="/users?create=true"
                      className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 transition-all text-left group"
                    >
                      <UserCheck className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                      <h4 className="text-xs font-semibold text-slate-200">Provision User</h4>
                      <p className="text-[11px] text-slate-400 mt-1">Create user accounts with role & capacity</p>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setIsConfigModalOpen(true)}
                      className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 transition-all text-left group"
                    >
                      <Activity className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                      <h4 className="text-xs font-semibold text-slate-200">API Health Diagnostics</h4>
                      <p className="text-[11px] text-slate-400 mt-1">Live ping and configure backend target</p>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/profile"
                      className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 transition-all text-left group"
                    >
                      <UserCheck className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                      <h4 className="text-xs font-semibold text-slate-200">Manage Profile</h4>
                      <p className="text-[11px] text-slate-400 mt-1">Update display name and capacity hours</p>
                    </Link>

                    <Link
                      to="/profile#password"
                      className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 transition-all text-left group"
                    >
                      <Key className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                      <h4 className="text-xs font-semibold text-slate-200">Change Password</h4>
                      <p className="text-[11px] text-slate-400 mt-1">Update credential & rotate sessions</p>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setIsConfigModalOpen(true)}
                      className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 transition-all text-left group"
                    >
                      <Activity className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                      <h4 className="text-xs font-semibold text-slate-200">Connection Status</h4>
                      <p className="text-[11px] text-slate-400 mt-1">Probe API connectivity and latency</p>
                    </button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Security & Architecture Traceability */}
        <div className="space-y-6">
          {/* Architecture Verification Card */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-bold text-slate-100">Backend Deliverables (13 Endpoints)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Tested & verified via 179 automated tests</p>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-mono text-slate-200">POST /auth/login</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Lockout 5 fails</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-mono text-slate-200">POST /auth/refresh</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Token rotation</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-mono text-slate-200">POST /auth/logout</span>
                  </div>
                  <span className="text-[10px] text-slate-400">JTI Blacklist</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-mono text-slate-200">GET /users</span>
                  </div>
                  <span className="text-[10px] text-purple-400">Admin RBAC</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-mono text-slate-200">POST /users</span>
                  </div>
                  <span className="text-[10px] text-purple-400">CA-04 Provision</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-mono text-slate-200">PATCH /users/:id/role</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Self-guard</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-mono text-slate-200">PATCH /users/:id/status</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Deactivate</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => refetchHealth()}
                  leftIcon={<Activity className="w-3.5 h-3.5 text-emerald-400" />}
                >
                  Re-Probe Probes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <BackendConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  );
}
