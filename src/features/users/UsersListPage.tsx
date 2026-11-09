import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { usersService } from '@/lib/api/users.service';
import { User, GlobalRole } from '@/types/user';
import { useAuth } from '../auth/AuthContext';
import { isAdministrator, getRoleBadgeClass, GLOBAL_ROLES } from '@/lib/utils/roleHelpers';
import { formatDate, getInitials } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { CreateUserModal } from './CreateUserModal';
import { EditUserRoleModal } from './EditUserRoleModal';
import { ToggleUserStatusModal } from './ToggleUserStatusModal';
import { UserDetailsDrawer } from './UserDetailsDrawer';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  Users,
  UserX,
  Eye,
  RefreshCw,
  Clock,
} from 'lucide-react';

export function UsersListPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = isAdministrator(currentUser?.globalRole);

  const [searchParams, setSearchParams] = useSearchParams();

  // Filters & Pagination state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [roleModalUser, setRoleModalUser] = useState<User | null>(null);
  const [statusModalUser, setStatusModalUser] = useState<User | null>(null);
  const [detailsModalUser, setDetailsModalUser] = useState<User | null>(null);

  // Auto-open create modal if query param ?create=true is present
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setIsCreateOpen(true);
      searchParams.delete('create');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset to page 1 on new search
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch users query
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'users',
      {
        page,
        limit,
        search: debouncedSearch,
        role: selectedRole,
        isActive: selectedStatus === '' ? '' : selectedStatus === 'true',
      },
    ],
    queryFn: () =>
      usersService.listUsers({
        page,
        limit,
        search: debouncedSearch,
        role: (selectedRole as GlobalRole) || undefined,
        isActive: selectedStatus === '' ? '' : selectedStatus === 'true',
      }),
    enabled: isAdmin,
  });

  // Guard: If not an administrator, display unauthorized banner
  if (!isAdmin) {
    return (
      <div className="p-8">
        <EmptyState
          icon={ShieldAlert}
          title="Access Restricted (FR-RBAC-01)"
          description="The User Administration module is strictly restricted to System Administrators. Your current role is not authorized to manage system accounts."
        />
      </div>
    );
  }

  const usersList: User[] = data?.data || [];
  const meta = data?.meta || { page: 1, limit: 20, total: 0, totalPages: 1 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">User Administration</h1>
            <Badge variant="purple">Admin Only</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Provision, manage roles, and monitor account status across the platform (FR-AUTH-05..09).
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Provision User
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="sm:col-span-6">
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            {/* Role Filter */}
            <div className="sm:col-span-3">
              <Select
                value={selectedRole}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setSelectedRole(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'All Global Roles' },
                  ...GLOBAL_ROLES.map((r: GlobalRole) => ({ value: r, label: r })),
                ]}
              />
            </div>

            {/* Status Filter */}
            <div className="sm:col-span-3">
              <Select
                value={selectedStatus}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'true', label: 'Active Only' },
                  { value: 'false', label: 'Inactive Only' },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={6} />
          </div>
        ) : error ? (
          <div className="p-8">
            <EmptyState
              icon={ShieldAlert}
              title="Failed to Load Users"
              description="Unable to fetch user directory from the backend. Ensure your backend server is running."
              actionLabel="Retry"
              onAction={() => refetch()}
            />
          </div>
        ) : usersList.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Users}
              title="No Users Found"
              description={
                debouncedSearch || selectedRole || selectedStatus
                  ? 'No user records match your selected search or filter criteria.'
                  : 'No user accounts found in the database.'
              }
              actionLabel={debouncedSearch || selectedRole || selectedStatus ? 'Clear Filters' : 'Provision User'}
              onAction={() => {
                if (debouncedSearch || selectedRole || selectedStatus) {
                  setSearch('');
                  setSelectedRole('');
                  setSelectedStatus('');
                } else {
                  setIsCreateOpen(true);
                }
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">System Role</th>
                  <th className="py-3.5 px-4">Weekly Capacity</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Provisioned</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {usersList.map((u: User) => {
                  const isCurrent = currentUser?.id === u.id;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* User Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {getInitials(u.fullName)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-slate-200 truncate">{u.fullName}</span>
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono truncate block">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Column */}
                      <td className="py-3.5 px-4">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${getRoleBadgeClass(u.globalRole)}`}>
                          {u.globalRole}
                        </span>
                      </td>

                      {/* Capacity Column (GAP-06 / SRS §6.2) */}
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.configuredCapacityHours ?? 40} hrs/wk</span>
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="py-3.5 px-4">
                        <Badge variant={u.isActive ? 'success' : 'danger'}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-slate-400 font-mono">
                        {formatDate(u.createdAt)}
                      </td>

                      {/* Action Menu Column */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            type="button"
                            onClick={() => setDetailsModalUser(u)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                            title="View user details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setRoleModalUser(u)}
                            disabled={isCurrent}
                            className="p-1.5 rounded-md text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title={isCurrent ? 'Self-demote guard active' : 'Change global role'}
                          >
                            <Shield className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setStatusModalUser(u)}
                            disabled={isCurrent && u.isActive}
                            className={`p-1.5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                              u.isActive
                                ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                                : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                            title={
                              isCurrent
                                ? 'Self-deactivate guard active'
                                : u.isActive
                                ? 'Deactivate account'
                                : 'Activate account'
                            }
                          >
                            {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!isLoading && usersList.length > 0 && (
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
            <div className="flex items-center space-x-2">
              <span>Showing</span>
              <span className="font-semibold text-slate-200">
                {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)}
              </span>
              <span>of</span>
              <span className="font-semibold text-slate-200">{meta.total}</span>
              <span>users</span>

              <span className="text-slate-600 px-1">|</span>

              <div className="flex items-center space-x-1">
                <span>Page size:</span>
                <select
                  value={limit}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-mono">
                Page {meta.page} of {Math.max(1, meta.totalPages)}
              </span>
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* User Modals */}
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <EditUserRoleModal
        isOpen={!!roleModalUser}
        onClose={() => setRoleModalUser(null)}
        targetUser={roleModalUser}
      />

      <ToggleUserStatusModal
        isOpen={!!statusModalUser}
        onClose={() => setStatusModalUser(null)}
        targetUser={statusModalUser}
      />

      <UserDetailsDrawer
        isOpen={!!detailsModalUser}
        onClose={() => setDetailsModalUser(null)}
        user={detailsModalUser}
        onEditRole={(u: User) => setRoleModalUser(u)}
        onToggleStatus={(u: User) => setStatusModalUser(u)}
      />
    </div>
  );
}
