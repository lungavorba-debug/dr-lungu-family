import type { ClinicalEvaluationResult } from './clinical';

export const CLINICAL_RULE_CATEGORIES = {
  CARDIOVASCULAR: 'cardiovascular',
  DIABETES: 'diabetes',
  SLEEP_APNEA: 'sleep_apnea',
  MEASUREMENTS: 'measurements',
  ANAMNESIS: 'anamnesis',
  GENERAL: 'general',
} as const;

export type ClinicalRuleCategory =
  (typeof CLINICAL_RULE_CATEGORIES)[keyof typeof CLINICAL_RULE_CATEGORIES];

export const CLINICAL_RULE_SEVERITIES = {
  INFO: 'info',
  ATTENTION: 'attention',
  CRITICAL: 'critical',
  MODERATE: 'moderate',
  ELEVATED: 'elevated',
} as const;

export type ClinicalRuleSeverity =
  (typeof CLINICAL_RULE_SEVERITIES)[keyof typeof CLINICAL_RULE_SEVERITIES];

export const CLINICAL_RULE_TYPES = {
  THRESHOLD: 'threshold',
  ANAMNESIS: 'anamnesis',
  RECOMMENDATION: 'recommendation',
} as const;

export type ClinicalRuleType = (typeof CLINICAL_RULE_TYPES)[keyof typeof CLINICAL_RULE_TYPES];

export const CLINICAL_RULE_CHANGE_TYPES = {
  CREATED: 'created',
  UPDATED: 'updated',
  ENABLED: 'enabled',
  DISABLED: 'disabled',
} as const;

export type ClinicalRuleChangeType =
  (typeof CLINICAL_RULE_CHANGE_TYPES)[keyof typeof CLINICAL_RULE_CHANGE_TYPES];

export interface ClinicalRuleListItem {
  id: string;
  code: string;
  name: string;
  category: ClinicalRuleCategory;
  severity: ClinicalRuleSeverity;
  rule_type: ClinicalRuleType;
  threshold_key: string | null;
  threshold_value: number | null;
  threshold_unit: string | null;
  recommendation_text: string | null;
  enabled: boolean;
  version: number;
  updated_at: string;
}

export interface ClinicalRuleSetInfo {
  id: string;
  name: string;
  version: number;
  is_active: boolean;
  engine_version: string;
  rule_count: number;
  enabled_count: number;
}

export interface ListClinicalRulesResponse {
  rule_set: ClinicalRuleSetInfo;
  rules: ClinicalRuleListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ClinicalRuleChangeItem {
  id: string;
  rule_id: string;
  rule_code: string;
  rule_name: string;
  version: number;
  change_type: ClinicalRuleChangeType;
  changed_by_id: string;
  changed_by_name: string;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown>;
  occurred_at: string;
}

export interface ListClinicalRuleChangesResponse {
  changes: ClinicalRuleChangeItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateClinicalRuleRequest {
  code: string;
  name: string;
  category: ClinicalRuleCategory;
  severity: ClinicalRuleSeverity;
  rule_type: ClinicalRuleType;
  threshold_key?: string | null;
  threshold_value?: number | null;
  threshold_unit?: string | null;
  recommendation_text?: string | null;
  enabled?: boolean;
}

export interface UpdateClinicalRuleRequest {
  name?: string;
  category?: ClinicalRuleCategory;
  severity?: ClinicalRuleSeverity;
  threshold_value?: number | null;
  threshold_unit?: string | null;
  recommendation_text?: string | null;
}

export interface ClinicalRuleResponse {
  rule: ClinicalRuleListItem;
}

export interface PreviewClinicalEvaluationResponse {
  evaluation: ClinicalEvaluationResult;
  rule_set: ClinicalRuleSetInfo;
}
