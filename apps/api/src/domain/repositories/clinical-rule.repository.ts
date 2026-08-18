import type {
  ClinicalRuleCategory,
  ClinicalRuleChangeType,
  ClinicalRuleSeverity,
  ClinicalRuleType,
} from '@medscreen/types';

export interface ClinicalRuleSetRecord {
  id: string;
  name: string;
  version: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClinicalRuleRecord {
  id: string;
  ruleSetId: string;
  code: string;
  name: string;
  category: ClinicalRuleCategory;
  severity: ClinicalRuleSeverity;
  ruleType: ClinicalRuleType;
  thresholdKey: string | null;
  thresholdValue: number | null;
  thresholdUnit: string | null;
  recommendationText: string | null;
  enabled: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClinicalRuleChangeRecord {
  id: string;
  ruleId: string;
  ruleSetId: string;
  version: number;
  changedById: string;
  changedByName: string;
  changeType: ClinicalRuleChangeType;
  previousValue: Record<string, unknown> | null;
  newValue: Record<string, unknown>;
  occurredAt: Date;
  ruleCode: string;
  ruleName: string;
}

export interface CreateClinicalRuleData {
  ruleSetId: string;
  code: string;
  name: string;
  category: ClinicalRuleCategory;
  severity: ClinicalRuleSeverity;
  ruleType: ClinicalRuleType;
  thresholdKey?: string | null;
  thresholdValue?: number | null;
  thresholdUnit?: string | null;
  recommendationText?: string | null;
  enabled: boolean;
  changedById: string;
  changedByName: string;
}

export interface UpdateClinicalRuleData {
  name?: string;
  category?: ClinicalRuleCategory;
  severity?: ClinicalRuleSeverity;
  thresholdValue?: number | null;
  thresholdUnit?: string | null;
  recommendationText?: string | null;
  changedById: string;
  changedByName: string;
}

export interface ListClinicalRulesParams {
  ruleSetId: string;
  search?: string;
  category?: ClinicalRuleCategory;
  enabled?: boolean;
  skip: number;
  take: number;
}

export interface ListClinicalRuleChangesParams {
  ruleSetId: string;
  ruleId?: string;
  skip: number;
  take: number;
}

export interface ClinicalRuleRepository {
  getActiveRuleSet(): Promise<ClinicalRuleSetRecord | null>;
  getRuleSetById(id: string): Promise<ClinicalRuleSetRecord | null>;
  listRules(params: ListClinicalRulesParams): Promise<{ items: ClinicalRuleRecord[]; total: number }>;
  listAllRulesForRuleSet(ruleSetId: string): Promise<ClinicalRuleRecord[]>;
  findRuleById(id: string): Promise<ClinicalRuleRecord | null>;
  findRuleByCode(ruleSetId: string, code: string): Promise<ClinicalRuleRecord | null>;
  createRule(data: CreateClinicalRuleData): Promise<ClinicalRuleRecord>;
  updateRule(id: string, data: UpdateClinicalRuleData): Promise<ClinicalRuleRecord>;
  setRuleEnabled(
    id: string,
    enabled: boolean,
    changedBy: { id: string; name: string },
  ): Promise<ClinicalRuleRecord>;
  listChanges(params: ListClinicalRuleChangesParams): Promise<{
    items: ClinicalRuleChangeRecord[];
    total: number;
  }>;
  countRules(ruleSetId: string): Promise<{ total: number; enabled: number }>;
}
