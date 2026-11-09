import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { useToast } from '@/app/providers/ToastProvider';
import { ApiClientError } from '@/lib/api/client';
import {
  Lock,
  Mail,
  ShieldAlert,
  Info,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutMessage, setLockoutMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setIsLockedOut(false);

    try {
      await login(data);
      toast.success('Welcome back', 'Successfully authenticated');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 423 || err.code === 'ACCOUNT_LOCKED') {
          setIsLockedOut(true);
          setLockoutMessage(err.message || 'Account locked: 5 consecutive failed attempts. Locked for 15 minutes.');
          toast.error('Account Locked', lockoutMessage);
        } else if (err.status === 401) {
          toast.error('Invalid Credentials', 'The email or password you entered is incorrect.');
        } else if (err.status === 422) {
          toast.error('Validation Error', err.message || 'Please verify form inputs.');
        } else {
          toast.error('Authentication Error', err.message || 'Failed to authenticate with backend.');
        }
      } else {
        toast.error('Connection Error', 'Unable to reach backend service.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to fill demo credentials easily
  const fillCredentials = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
  };

  return (
    <Card className="border-slate-800 shadow-2xl bg-slate-900/90 backdrop-blur-xl">
      <CardHeader className="text-center pb-2">
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">Sign in to your account</h2>
        <p className="text-xs text-slate-400 mt-1">
          Real-Time Project Management Platform with Predictive Insights
        </p>
      </CardHeader>

      <CardContent className="space-y-5 pt-4">
        {/* Account lockout alert banner */}
        {isLockedOut && (
          <div className="p-3.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-start space-x-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">Account Lockout Activated (FR-AUTH-08)</p>
              <p className="mt-0.5 text-rose-300/90 leading-relaxed">{lockoutMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="admin@example.com"
            autoComplete="email"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            autoComplete="current-password"
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-200 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            error={errors.password?.message}
            {...register('password')}
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full mt-2"
            isLoading={isSubmitting}
            leftIcon={<KeyRound className="w-4 h-4" />}
          >
            Sign In
          </Button>
        </form>

        {/* Demo seed accounts quick-fill helper */}
        <div className="pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-indigo-400" /> Demo Quick-Fill
            </span>
            <span className="text-[10px] text-slate-400">Password: Password123!</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('admin@example.com', 'Password123!')}
              className="px-2.5 py-1.5 rounded-md bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-[11px] text-left text-purple-300 transition-colors flex items-center justify-between"
            >
              <span>Administrator</span>
              <span className="text-[9px] text-slate-400">Admin</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('pm@example.com', 'Password123!')}
              className="px-2.5 py-1.5 rounded-md bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-[11px] text-left text-blue-300 transition-colors flex items-center justify-between"
            >
              <span>Project Manager</span>
              <span className="text-[9px] text-slate-400">PM</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('dev1@example.com', 'Password123!')}
              className="px-2.5 py-1.5 rounded-md bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-[11px] text-left text-emerald-300 transition-colors flex items-center justify-between"
            >
              <span>Team Member 1</span>
              <span className="text-[9px] text-slate-400">Dev</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('viewer@example.com', 'Password123!')}
              className="px-2.5 py-1.5 rounded-md bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-[11px] text-left text-slate-300 transition-colors flex items-center justify-between"
            >
              <span>Viewer</span>
              <span className="text-[9px] text-slate-400">Read-only</span>
            </button>
          </div>
        </div>

        {/* Scope disclaimer */}
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 flex items-start space-x-2">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-300">Admin-Provisioned Accounts (CA-04):</strong> Public registration is disabled per specification. All user accounts must be provisioned by a System Administrator.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
