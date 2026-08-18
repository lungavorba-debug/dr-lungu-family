import { AUDIT_ACTIONS, type AuditAction, type AuditEntityType } from '@medscreen/types';

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  [AUDIT_ACTIONS.LOGIN]: 'Autentificare',
  [AUDIT_ACTIONS.LOGIN_FAILED]: 'Autentificare eșuată',
  [AUDIT_ACTIONS.LOGOUT]: 'Deconectare',
  [AUDIT_ACTIONS.INITIAL_SETUP]: 'Configurare inițială',
  [AUDIT_ACTIONS.USER_CREATED]: 'Creare utilizator',
  [AUDIT_ACTIONS.USER_UPDATED]: 'Actualizare utilizator',
  [AUDIT_ACTIONS.PASSWORD_RESET]: 'Resetare parolă',
  [AUDIT_ACTIONS.PASSWORD_CHANGED]: 'Schimbare parolă',
  [AUDIT_ACTIONS.ACCOUNT_LOCKED]: 'Cont blocat',
  [AUDIT_ACTIONS.ACCOUNT_UNLOCKED]: 'Cont deblocat',
  [AUDIT_ACTIONS.USER_ACTIVATED]: 'Activare utilizator',
  [AUDIT_ACTIONS.USER_DEACTIVATED]: 'Dezactivare utilizator',
  [AUDIT_ACTIONS.USER_DELETED]: 'Ștergere utilizator',
  [AUDIT_ACTIONS.CAMPAIGN_CREATED]: 'Creare campanie',
  [AUDIT_ACTIONS.CAMPAIGN_UPDATED]: 'Actualizare campanie',
  [AUDIT_ACTIONS.CAMPAIGN_ACTIVATED]: 'Activare campanie',
  [AUDIT_ACTIONS.CAMPAIGN_CLOSED]: 'Închidere campanie',
  [AUDIT_ACTIONS.CAMPAIGN_ARCHIVED]: 'Arhivare campanie',
  [AUDIT_ACTIONS.CAMPAIGN_DELETED]: 'Ștergere campanie',
  [AUDIT_ACTIONS.SCREENING_STARTED]: 'Screening inițiat',
  [AUDIT_ACTIONS.SCREENING_COMPLETED]: 'Screening finalizat',
  [AUDIT_ACTIONS.REPORT_GENERATED]: 'Raport generat',
  [AUDIT_ACTIONS.REPORT_DOWNLOADED]: 'Raport descărcat',
  [AUDIT_ACTIONS.REPORT_DELIVERED]: 'Raport livrat',
  [AUDIT_ACTIONS.EXPORT_GENERATED]: 'Export generat',
};

export const AUDIT_ENTITY_TYPE_LABELS: Record<AuditEntityType, string> = {
  user: 'Utilizator',
  campaign: 'Campanie',
  screening: 'Screening',
  report: 'Raport',
  export: 'Export',
  session: 'Sesiune',
};

export const AUDIT_ACTION_OPTIONS = Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({
  value: value as AuditAction,
  label,
}));

export const AUDIT_ENTITY_TYPE_OPTIONS = Object.entries(AUDIT_ENTITY_TYPE_LABELS).map(
  ([value, label]) => ({
    value: value as AuditEntityType,
    label,
  }),
);
