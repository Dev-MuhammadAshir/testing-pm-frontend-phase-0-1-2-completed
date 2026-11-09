import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { GlobalRole } from '@/types/user';
import { isAdministrator } from '@/lib/utils/roleHelpers';
import { ShieldAlert } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: GlobalRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-mono tracking-wider">Verifying Session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.globalRole !== requiredRole && !isAdministrator(user?.globalRole)) {
    return (
      <div className="p-8">
        <EmptyState
          icon={ShieldAlert}
          title="Access Restricted (FR-RBAC-01)"
          description={`This view requires the '${requiredRole}' role. Your account has '${user?.globalRole}' permissions.`}
        />
      </div>
    );
  }

  return <>{children}</>;
}
