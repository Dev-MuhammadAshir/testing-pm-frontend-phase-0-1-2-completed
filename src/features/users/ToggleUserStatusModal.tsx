import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { User } from '@/types/user';
import { usersService } from '@/lib/api/users.service';
import { useToast } from '@/app/providers/ToastProvider';
import { useAuth } from '../auth/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClientError } from '@/lib/api/client';
import { CheckCircle, ShieldAlert, UserX } from 'lucide-react';

export interface ToggleUserStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: User | null;
}

export function ToggleUserStatusModal({ isOpen, onClose, targetUser }: ToggleUserStatusModalProps) {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const isSelf = currentUser?.id === targetUser?.id;
  const isDeactivating = targetUser?.isActive;

  const mutation = useMutation<User, unknown, void>({
    mutationFn: () => {
      if (!targetUser) throw new Error('No user selected');
      return usersService.updateUserStatus(targetUser.id, !targetUser.isActive);
    },
    onSuccess: (updated: User) => {
      toast.success(
        updated.isActive ? 'Account Activated' : 'Account Deactivated',
        `${updated.fullName}'s status is now ${updated.isActive ? 'Active' : 'Inactive'}`
      );
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiClientError) {
        toast.error('Status Change Failed', err.message || 'Unable to update account status.');
      } else {
        toast.error('Error', 'An unexpected error occurred.');
      }
    },
  });

  if (!targetUser) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isDeactivating ? 'Deactivate User Account' : 'Reactivate User Account'}
      description={`Update status for ${targetUser.fullName}`}
      maxWidth="sm"
    >
      <div className="space-y-4">
        {isSelf && isDeactivating ? (
          <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-rose-200">Self-Deactivation Guard Active:</strong>
              <p className="mt-0.5 text-rose-300/90">
                You cannot deactivate your own administrative account.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start space-x-3 text-slate-300 text-xs">
            <div
              className={`p-2.5 rounded-lg shrink-0 ${
                isDeactivating ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
              }`}
            >
              {isDeactivating ? <UserX className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-100">
                {isDeactivating
                  ? `Are you sure you want to deactivate ${targetUser.fullName}?`
                  : `Are you sure you want to reactivate ${targetUser.fullName}?`}
              </p>
              <p className="text-slate-400 leading-relaxed">
                {isDeactivating
                  ? 'Deactivating an account immediately blocks authentication, revokes all refresh sessions, and invalidates active JWT tokens in Redis (FR-AUTH-07).'
                  : 'Reactivating the account allows the user to log in again using their existing credentials.'}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            variant={isDeactivating ? 'danger' : 'primary'}
            size="sm"
            disabled={isSelf && isDeactivating}
            isLoading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {isDeactivating ? 'Deactivate Account' : 'Reactivate Account'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
