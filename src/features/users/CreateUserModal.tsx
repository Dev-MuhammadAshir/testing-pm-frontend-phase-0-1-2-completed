import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { usersService } from '@/lib/api/users.service';
import { useToast } from '@/app/providers/ToastProvider';
import { GLOBAL_ROLES } from '@/lib/utils/roleHelpers';
import { GlobalRole, User as UserModel } from '@/types/user';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClientError } from '@/lib/api/client';
import { Lock, Mail, User, Shield, Clock, Eye, EyeOff } from 'lucide-react';

const createUserSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100, 'Maximum 100 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least 1 uppercase letter')
    .regex(/[a-z]/, 'Must contain at least 1 lowercase letter')
    .regex(/[0-9]/, 'Must contain at least 1 number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least 1 special character'),
  globalRole: z.enum(['Administrator', 'Project Manager', 'Team Member', 'Viewer'] as const),
  configuredCapacityHours: z
    .number()
    .min(10, 'Minimum 10 hours/week')
    .max(80, 'Maximum 80 hours/week'),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

export interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateUserModal({ isOpen, onClose }: CreateUserModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const toast = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      globalRole: 'Team Member',
      configuredCapacityHours: 40,
    },
  });

  const mutation = useMutation<UserModel, unknown, CreateUserFormData>({
    mutationFn: (data: CreateUserFormData) =>
      usersService.createUser({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        globalRole: data.globalRole as GlobalRole,
        configuredCapacityHours: Number(data.configuredCapacityHours),
      }),
    onSuccess: (newUser: UserModel) => {
      toast.success('User Provisioned', `Account for ${newUser.fullName} was created successfully.`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      reset();
      onClose();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiClientError) {
        if (err.status === 409) {
          toast.error('Conflict', 'A user with this email address already exists.');
        } else if (err.status === 422) {
          toast.error('Validation Error', err.message || 'Please check the entered values.');
        } else {
          toast.error('Provisioning Failed', err.message || 'Server error occurred.');
        }
      } else {
        toast.error('Error', 'Unable to create user.');
      }
    },
  });

  const onSubmit = (data: CreateUserFormData) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Provision User Account"
      description="Admin account creation conforming to CA-04 (Admin-provisioned accounts only)."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="e.g. John Doe"
          leftIcon={<User className="w-4 h-4" />}
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="john.doe@company.com"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Initial Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Min 8 chars, 1 uppercase, 1 number, 1 symbol"
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
          helperText="Must satisfy bcrypt cost ≥ 12 password policy (min 8 chars, uppercase, lowercase, digit, special char)."
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="System Global Role"
            options={GLOBAL_ROLES.map((role: GlobalRole) => ({ value: role, label: role }))}
            error={errors.globalRole?.message}
            {...register('globalRole')}
          />

          <Input
            label="Weekly Capacity (Hours)"
            type="number"
            min={10}
            max={80}
            leftIcon={<Clock className="w-4 h-4" />}
            helperText="Default 40 hrs (Valid 10–80 hrs)."
            error={errors.configuredCapacityHours?.message}
            {...register('configuredCapacityHours', { valueAsNumber: true })}
          />
        </div>

        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={mutation.isPending}
            leftIcon={<Shield className="w-3.5 h-3.5" />}
          >
            Provision User
          </Button>
        </div>
      </form>
    </Modal>
  );
}
