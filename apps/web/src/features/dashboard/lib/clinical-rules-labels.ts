import type {
  ClinicalRuleCategory,
  ClinicalRuleListItem,
  ClinicalRuleSeverity,
  ClinicalRuleType,
} from '@medscreen/types';
import {
  CLINICAL_RULE_CATEGORIES,
  CLINICAL_RULE_SEVERITIES,
  CLINICAL_RULE_TYPES,
} from '@medscreen/types';

export const CLINICAL_RULE_CATEGORY_OPTIONS: { value: ClinicalRuleCategory; label: string }[] = [
  { value: CLINICAL_RULE_CATEGORIES.CARDIOVASCULAR, label: 'Cardiovascular' },
  { value: CLINICAL_RULE_CATEGORIES.DIABETES, label: 'Diabet / metabolic' },
  { value: CLINICAL_RULE_CATEGORIES.SLEEP_APNEA, label: 'Apnee de somn' },
  { value: CLINICAL_RULE_CATEGORIES.MEASUREMENTS, label: 'Măsurători' },
  { value: CLINICAL_RULE_CATEGORIES.ANAMNESIS, label: 'Anamneză' },
  { value: CLINICAL_RULE_CATEGORIES.GENERAL, label: 'General' },
];

export const CLINICAL_RULE_SEVERITY_OPTIONS: { value: ClinicalRuleSeverity; label: string }[] = [
  { value: CLINICAL_RULE_SEVERITIES.INFO, label: 'Informativ' },
  { value: CLINICAL_RULE_SEVERITIES.ATTENTION, label: 'Atenție' },
  { value: CLINICAL_RULE_SEVERITIES.MODERATE, label: 'Moderat' },
  { value: CLINICAL_RULE_SEVERITIES.ELEVATED, label: 'Ridicat' },
  { value: CLINICAL_RULE_SEVERITIES.CRITICAL, label: 'Critic' },
];

export const CLINICAL_RULE_TYPE_OPTIONS: { value: ClinicalRuleType; label: string }[] = [
  { value: CLINICAL_RULE_TYPES.THRESHOLD, label: 'Prag numeric' },
  { value: CLINICAL_RULE_TYPES.ANAMNESIS, label: 'Semnal anamneză' },
  { value: CLINICAL_RULE_TYPES.RECOMMENDATION, label: 'Recomandare' },
];

export const CLINICAL_RULE_CHANGE_TYPE_LABELS: Record<string, string> = {
  created: 'Creată',
  updated: 'Actualizată',
  enabled: 'Activată',
  disabled: 'Dezactivată',
};

export function getCategoryLabel(category: ClinicalRuleCategory): string {
  return CLINICAL_RULE_CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? category;
}

export function getSeverityLabel(severity: ClinicalRuleSeverity): string {
  return CLINICAL_RULE_SEVERITY_OPTIONS.find((option) => option.value === severity)?.label ?? severity;
}

export function getRuleTypeLabel(ruleType: ClinicalRuleType): string {
  return CLINICAL_RULE_TYPE_OPTIONS.find((option) => option.value === ruleType)?.label ?? ruleType;
}

export function formatRuleValue(rule: ClinicalRuleListItem): string {
  if (rule.rule_type === 'threshold' && rule.threshold_value !== null) {
    return `${rule.threshold_value}${rule.threshold_unit ? ` ${rule.threshold_unit}` : ''}`;
  }
  if (rule.rule_type === 'recommendation' && rule.recommendation_text) {
    return rule.recommendation_text.length > 80
      ? `${rule.recommendation_text.slice(0, 80)}…`
      : rule.recommendation_text;
  }
  if (rule.rule_type === 'anamnesis') {
    return 'Semnal activ/inactiv';
  }
  return '—';
}
