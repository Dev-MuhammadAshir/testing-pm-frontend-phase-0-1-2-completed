import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { User } from '@/types/user';
import { getRoleBadgeClass, getRoleDescription } from '@/lib/utils/roleHelpers';
import { formatDateTime, getInitials } from '@/lib/utils/formatters';
import {
  Calendar,
  Clock,
  Key,
  Mail,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';

export interface UserDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onEditRole?: (user: User) => void;
  onToggleStatus?: (user: User) => void;
}

export function UserDetailsDrawer({
  isOpen,
  onClose,
  user,
  onEditRole,
  onToggleStatus,
}: UserDetailsDrawerProps) {
  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Account Details"
      description={`System record for ${user.fullName}`}
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Profile Card Header */}
        <div className="flex items-center space-x-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-base font-bold shadow-md shadow-indigo-600/20 shrink-0">
            {getInitials(user.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h4 className="text-base font-bold text-slate-100 truncate">{user.fullName}</h4>
              <Badge variant={user.isActive ? 'success' : 'danger'}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 font-mono truncate">{user.email}</p>
            <div className="mt-1.5 flex items-center space-x-2">
              <span className={`text-xs px-2.5 py-0.5 rounded-full border ${getRoleBadgeClass(user.globalRole)}`}>
                {user.globalRole}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Global Role Scope</span>
            </div>
            <p className="font-semibold text-slate-200">{user.globalRole}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{getRoleDescription(user.globalRole)}</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Configured Capacity (GAP-06)</span>
            </div>
            <p className="font-semibold text-slate-200 font-mono text-sm">
              {user.configuredCapacityHours ?? 40} hrs/week
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">PIRAE workload baseline</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Account Provisioned</span>
            </div>
            <p className="font-semibold text-slate-200">{formatDateTime(user.createdAt)}</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span>System Identifier (UUID)</span>
            </div>
            <p className="font-mono text-slate-300 text-[11px] truncate">{user.id}</p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="flex items-center space-x-2">
            {onEditRole && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onClose();
                  onEditRole(user);
                }}
              >
                Change Role
              </Button>
            )}
            {onToggleStatus && (
              <Button
                variant={user.isActive ? 'danger' : 'secondary'}
                size="sm"
                onClick={() => {
                  onClose();
                  onToggleStatus(user);
                }}
              >
                {user.isActive ? 'Deactivate' : 'Reactivate'}
              </Button>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
