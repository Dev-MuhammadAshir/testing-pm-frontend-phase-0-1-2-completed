import { GlobalRole } from '@/types/user';

export const GLOBAL_ROLES: GlobalRole[] = [
  'Administrator',
  'Project Manager',
  'Team Member',
  'Viewer',
];

export function isAdministrator(role?: GlobalRole | null): boolean {
  return role === 'Administrator';
}

export function canManageUsers(role?: GlobalRole | null): boolean {
  return role === 'Administrator';
}

export function getRoleBadgeClass(role?: GlobalRole | null): string {
  switch (role) {
    case 'Administrator':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    case 'Project Manager':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'Team Member':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'Viewer':
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    default:
      return 'bg-slate-800 text-slate-400 border-slate-700';
  }
}

export function getRoleDescription(role: GlobalRole): string {
  switch (role) {
    case 'Administrator':
      return 'Full governance over users, roles, system configuration, and account provisioning.';
    case 'Project Manager':
      return 'Manages assigned teams, projects, and execution workflows in upcoming phases.';
    case 'Team Member':
      return 'Collaborates on assigned tasks, workflows, and contributes to projects.';
    case 'Viewer':
      return 'Read-only access across assigned projects, reports, and public information.';
    default:
      return 'Standard platform participant.';
  }
}
