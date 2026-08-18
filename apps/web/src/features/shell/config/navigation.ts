import type { RoleName } from '@medscreen/types';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: 'dashboard' | 'screening' | 'patients' | 'sync' | 'users' | 'rules' | 'export' | 'audit' | 'cases' | 'settings' | 'reports' | 'campaigns';
  roles: RoleName[];
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Panou principal',
    path: '/',
    icon: 'dashboard',
    roles: ['ADMIN', 'OPERATOR', 'MEDIC'],
  },
  {
    id: 'screening',
    label: 'Screening Nou',
    path: '/screening',
    icon: 'screening',
    roles: ['ADMIN', 'OPERATOR', 'MEDIC'],
  },
  {
    id: 'patients',
    label: 'Pacienți',
    path: '/patients',
    icon: 'patients',
    roles: ['ADMIN', 'OPERATOR', 'MEDIC'],
  },
  {
    id: 'reports',
    label: 'Rapoarte',
    path: '/reports',
    icon: 'reports',
    roles: ['ADMIN', 'OPERATOR', 'MEDIC'],
  },
  {
    id: 'sync',
    label: 'Sincronizare',
    path: '/sync',
    icon: 'sync',
    roles: ['ADMIN', 'OPERATOR', 'MEDIC'],
  },
  {
    id: 'cases',
    label: 'Cazuri Critice',
    path: '/cases',
    icon: 'cases',
    roles: ['ADMIN', 'MEDIC'],
  },
  {
    id: 'export',
    label: 'Export Excel',
    path: '/export',
    icon: 'export',
    roles: ['ADMIN', 'MEDIC'],
  },
  {
    id: 'users',
    label: 'Utilizatori',
    path: '/users',
    icon: 'users',
    roles: ['ADMIN'],
  },
  {
    id: 'campaigns',
    label: 'Campanii',
    path: '/campaigns',
    icon: 'campaigns',
    roles: ['ADMIN'],
  },
  {
    id: 'rules',
    label: 'Reguli Clinice',
    path: '/clinical-rules',
    icon: 'rules',
    roles: ['ADMIN'],
  },
  {
    id: 'audit',
    label: 'Jurnal Audit',
    path: '/audit',
    icon: 'audit',
    roles: ['ADMIN'],
  },
  {
    id: 'settings',
    label: 'Setări',
    path: '/settings',
    icon: 'settings',
    roles: ['ADMIN'],
  },
];

export function getNavItemsForRole(role: RoleName): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export const ROLE_LABELS: Record<RoleName, string> = {
  ADMIN: 'Administrator',
  OPERATOR: 'Operator',
  MEDIC: 'Medic',
};

export const BREADCRUMB_LABELS: Record<string, string> = {
  '': 'Panou principal',
  screening: 'Screening — Participant',
  anamnesis: 'Întrebări screening',
  measurements: 'Măsurători',
  results: 'Rezultate',
  report: 'Raport',
  signature: 'Semnătură',
  complete: 'Finalizare',
  'screening/anamnesis': 'Întrebări screening',
  'screening/measurements': 'Măsurători',
  'screening/results': 'Rezultate',
  'screening/report': 'Raport participant',
  'screening/signature': 'Semnătură participant',
  'screening/complete': 'Screening finalizat',
  patients: 'Pacienți',
  sync: 'Sincronizare',
  cases: 'Cazuri Critice',
  export: 'Export Excel',
  users: 'Utilizatori',
  campaigns: 'Campanii',
  'campaigns/select': 'Selectare Campanie',
  'clinical-rules': 'Reguli Clinice',
  audit: 'Jurnal Audit',
  settings: 'Setări',
  reports: 'Rapoarte',
  profile: 'Profil profesional',
  'change-password': 'Schimbare parolă',
};
