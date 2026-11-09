import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { User, GlobalRole } from '@/types/user';
import { GLOBAL_ROLES, getRoleDescription } from '@/lib/utils/roleHelpers';
import { usersService } from '@/lib/api/users.service';
import { useToast } from '@/app/providers/ToastProvider';
import { useAuth } from '../auth/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClientError } from '@/lib/api/client';
import { AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';

export interface EditUserRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: User | null;
}

export function EditUserRoleModal({ isOpen, onClose, targetUser }: EditUserRoleModalProps) {
  const { user: currentUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState<GlobalRole>('Team Member');
  const toast = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (targetUser) {
      setSelectedRole(targetUser.globalRole);
    }
  }, [targetUser]);

  const isSelf = currentUser?.id === targetUser?.id;

  const mutation = useMutation<User, unknown, void>({
    mutationFn: () => {
      if (!targetUser) throw new Error('No user selected');
      return usersService.updateUserRole(targetUser.id, selectedRole);
    },
    onSuccess: (updated: User) => {
      toast.success('Role Updated', `${updated.fullName}'s role changed to ${updated.globalRole}`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiClientError) {
        toast.error('Update Failed', err.message || 'Unable to update role.');
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
      title="Change System Role"
      description={`Update global permissions for ${targetUser.fullName}`}
      maxWidth="sm"
    >
      <div className="space-y-4">
        {isSelf && (
          <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-amber-200">Self-Demote Guard Active:</strong>
              <p className="mt-0.5 text-amber-300/90">
                You cannot modify your own administrator role to prevent accidental system lockout.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Select
            label="Global System Role"
            value={selectedRole}
            disabled={isSelf || mutation.isPending}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setSelectedRole(e.target.value as GlobalRole)
            }
            options={GLOBAL_ROLES.map((r: GlobalRole) => ({ value: r, label: r }))}
            helperText={getRoleDescription(selectedRole)}
          />
        </div>

        {/* Redis session revocation advisory */}
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <p>
            <strong>Session Invalidation (FR-AUTH-09):</strong> Changing role immediately revokes all active refresh tokens in Redis for this user. The user will be required to authenticate with their new role permissions on their next session.
          </p>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={isSelf || selectedRole === targetUser.globalRole}
            isLoading={mutation.isPending}
            onClick={() => mutation.mutate()}
            leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
          >
            Update Role
          </Button>
        </div>
      </div>
    </Modal>
  );
}
