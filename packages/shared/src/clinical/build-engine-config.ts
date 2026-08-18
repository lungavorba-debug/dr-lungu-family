import { CLINICAL_THRESHOLDS } from './thresholds';

export type ClinicalThresholdsConfig = {
  bloodPressure: {
    elevatedSystolic: number;
    elevatedDiastolic: number;
    moderateSystolic: number;
    moderateDiastolic: number;
    urgentSystolic: number;
    urgentDiastolic: number;
    lowSystolic: number;
  };
  pulse: {
    low: number;
    high: number;
  };
  spo2: {
    low: number;
  };
  bmi: {
    elevated: number;
    moderate: number;
    elevatedObesity: number;
  };
  waist: {
    male: number;
    female: number;
  };
  glucose: {
    low: number;
    fastingModerate: number;
    fastingElevated: number;
    nonFastingModerate: number;
    nonFastingElevated: number;
  };
  sleepApnea: {
    elevatedBmi: number;
  };
};

export interface DbClinicalRuleInput {
  code: string;
  enabled: boolean;
  ruleType: string;
  thresholdKey: string | null;
  thresholdValue: number | null;
  recommendationText: string | null;
  severity: string;
  category: string;
}

export interface ClinicalRecommendationOverride {
  code: string;
  message: string;
  priority: 'routine' | 'soon' | 'urgent';
  category: string;
}

export interface ClinicalEngineConfig {
  ruleSetId: string;
  engineVersion: string;
  isDemo: boolean;
  thresholds: ClinicalThresholdsConfig;
  enabledRuleCodes: Set<string>;
  recommendationOverrides: ClinicalRecommendationOverride[];
}

export function cloneDefaultThresholds(): ClinicalThresholdsConfig {
  return JSON.parse(JSON.stringify(CLINICAL_THRESHOLDS)) as ClinicalThresholdsConfig;
}

function setNestedThreshold(
  thresholds: ClinicalThresholdsConfig,
  key: string,
  value: number,
): void {
  const [group, field] = key.split('.');
  const groupRecord = thresholds[group as keyof ClinicalThresholdsConfig] as Record<string, number>;
  if (groupRecord && field in groupRecord) {
    groupRecord[field] = value;
  }
}

function mapSeverityToPriority(severity: string): 'routine' | 'soon' | 'urgent' {
  if (severity === 'critical' || severity === 'elevated') return 'urgent';
  if (severity === 'attention' || severity === 'moderate') return 'soon';
  return 'routine';
}

export function buildEngineConfigFromRules(
  ruleSetId: string,
  rules: DbClinicalRuleInput[],
  options?: { isDemo?: boolean; engineVersion?: string },
): ClinicalEngineConfig {
  const thresholds = cloneDefaultThresholds();
  const enabledRuleCodes = new Set<string>();
  const recommendationOverrides: ClinicalRecommendationOverride[] = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;
    enabledRuleCodes.add(rule.code);

    if (rule.ruleType === 'threshold' && rule.thresholdKey && rule.thresholdValue !== null) {
      setNestedThreshold(thresholds, rule.thresholdKey, rule.thresholdValue);
    }

    if (rule.ruleType === 'recommendation' && rule.recommendationText) {
      recommendationOverrides.push({
        code: rule.code,
        message: rule.recommendationText,
        priority: mapSeverityToPriority(rule.severity),
        category: rule.category,
      });
    }
  }

  return {
    ruleSetId,
    engineVersion: options?.engineVersion ?? '1.0.0',
    isDemo: options?.isDemo ?? false,
    thresholds,
    enabledRuleCodes,
    recommendationOverrides,
  };
}

export function buildDefaultEngineConfig(): ClinicalEngineConfig {
  return buildEngineConfigFromRules('demo-placeholder-v1', [], { isDemo: true });
}
