import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../auth/AuthContext';
import { authService } from '@/lib/api/auth.service';
import { useToast } from '@/app/providers/ToastProvider';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { getRoleBadgeClass, getRoleDescription } from '@/lib/utils/roleHelpers';
import { formatDateTime, getInitials } from '@/lib/utils/formatters';
import { ApiClientError } from '@/lib/api/client';
import {
  Clock,
  Key,
  Lock,
  Mail,
  ShieldCheck,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertTriangle,
  Save,
  LogOut,
} from 'lucide-react';

const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100, 'Maximum 100 characters'),
  configuredCapacityHours: z
    .number()
    .min(10, 'Minimum 10 hours/week')
    .max(80, 'Maximum 80 hours/week'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least 1 uppercase letter')
      .regex(/[a-z]/, 'Must contain at least 1 lowercase letter')
      .regex(/[0-9]/, 'Must contain at least 1 number')
      .regex(/[^A-Za-z0-9]/, 'Must contain at least 1 special character'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export function ProfilePage() {
  const { user, updateCurrentUserState, logout } = useAuth();
  const toast = useToast();

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      configuredCapacityHours: user?.configuredCapacityHours ?? 40,
    },
  });

  // Password Form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onUpdateProfile = async (data: ProfileFormData) => {
    setIsUpdatingProfile(true);
    try {
      const updated = await authService.updateProfile({
        fullName: data.fullName,
        configuredCapacityHours: Number(data.configuredCapacityHours),
      });
      updateCurrentUserState(updated);
      toast.success('Profile Updated', 'Your profile details have been saved.');
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error('Update Failed', err.message || 'Unable to update profile.');
      } else {
        toast.error('Error', 'An unexpected error occurred.');
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onChangePassword = async (data: PasswordFormData) => {
    setIsChangingPassword(true);
    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success(
        'Password Changed',
        'Your password was updated. All active sessions have been rotated.'
      );
      resetPasswordForm();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 401) {
          toast.error('Incorrect Password', 'Your current password was not recognized.');
        } else if (err.status === 422) {
          toast.error('Validation Error', err.message || 'Password does not meet criteria.');
        } else {
          toast.error('Password Update Failed', err.message || 'Server error.');
        }
      } else {
        toast.error('Error', 'Unable to change password.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Profile Badge */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-600/30 ring-4 ring-slate-900 shrink-0">
                {getInitials(user?.fullName || 'User')}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold text-slate-100">{user?.fullName}</h1>
                  <Badge variant={user?.isActive ? 'success' : 'danger'}>
                    {user?.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.email}</p>
                <div className="mt-2 flex items-center space-x-2">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${getRoleBadgeClass(
                      user?.globalRole
                    )}`}
                  >
                    {user?.globalRole}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              leftIcon={<LogOut className="w-4 h-4 text-rose-400" />}
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Edit Profile Form */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-bold text-slate-100">Profile Information</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Update personal details and configured weekly workload capacity.
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="Your full name"
                leftIcon={<UserIcon className="w-4 h-4" />}
                error={profileErrors.fullName?.message}
                {...registerProfile('fullName')}
              />

              <Input
                label="Email Address (Login ID)"
                type="email"
                value={user?.email || ''}
                disabled
                helperText="Email address cannot be changed (assigned during provisioning)."
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Input
                label="Configured Weekly Capacity (Hours)"
                type="number"
                min={10}
                max={80}
                leftIcon={<Clock className="w-4 h-4" />}
                helperText="PIRAE workload baseline (valid range: 10–80 hours/week per GAP-06)."
                error={profileErrors.configuredCapacityHours?.message}
                {...registerProfile('configuredCapacityHours', { valueAsNumber: true })}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="w-full"
                  isLoading={isUpdatingProfile}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                >
                  Save Profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Change Password Form */}
        <Card id="password">
          <CardHeader>
            <h3 className="text-sm font-bold text-slate-100">Change Password</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Update your account password and rotate active sessions.
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4">
              <Input
                label="Current Password"
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Current account password"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="text-slate-400 hover:text-slate-200"
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={passwordErrors.currentPassword?.message}
                {...registerPassword('currentPassword')}
              />

              <Input
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Min 8 chars, 1 uppercase, 1 symbol"
                leftIcon={<Key className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="text-slate-400 hover:text-slate-200"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                helperText="Must satisfy bcrypt cost ≥ 12 policy (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)."
                error={passwordErrors.newPassword?.message}
                {...registerPassword('newPassword')}
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter new password"
                leftIcon={<Lock className="w-4 h-4" />}
                error={passwordErrors.confirmPassword?.message}
                {...registerPassword('confirmPassword')}
              />

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Session Revocation:</strong> Changing your password will immediately revoke all other active refresh sessions stored in Redis for security.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="w-full"
                  isLoading={isChangingPassword}
                  leftIcon={<Key className="w-3.5 h-3.5" />}
                >
                  Update Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Account System Details Card */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-bold text-slate-100">Account System Details</h3>
          <p className="text-xs text-slate-400 mt-0.5">Read-only attributes provisioned in PostgreSQL</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
              <span className="text-slate-400">Account ID (UUID)</span>
              <p className="font-mono text-slate-200 text-[11px] mt-1 truncate">{user?.id}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
              <span className="text-slate-400">System Role</span>
              <p className="font-semibold text-slate-200 mt-1">{user?.globalRole}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{user?.globalRole ? getRoleDescription(user.globalRole) : ''}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
              <span className="text-slate-400">Account Created</span>
              <p className="font-semibold text-slate-200 mt-1">{formatDateTime(user?.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
