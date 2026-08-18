/**
 * Clinical rules admin and DB-driven engine config tests.
 * Run: npm run test:clinical-rules
 */
import {
  CLINICAL_RULE_CATEGORIES,
  CLINICAL_RULE_SEVERITIES,
  CLINICAL_RULE_TYPES,
} from '@medscreen/types';
import {
  buildEngineConfigFromRules,
  cloneDefaultThresholds,
  evaluateClinicalEngine,
} from '@medscreen/shared';
import type { ClinicalEvaluationRequest } from '@medscreen/types';
import {
  CreateClinicalRuleUseCase,
  ListClinicalRuleChangesUseCase,
  ListClinicalRulesUseCase,
  SetClinicalRuleEnabledUseCase,
  UpdateClinicalRuleUseCase,
} from './clinical-rules.use-cases';
import type {
  ClinicalRuleChangeRecord,
  ClinicalRuleRecord,
  ClinicalRuleRepository,
  ClinicalRuleSetRecord,
  CreateClinicalRuleData,
  ListClinicalRuleChangesParams,
  ListClinicalRulesParams,
  UpdateClinicalRuleData,
} from '../../domain/repositories/clinical-rule.repository';

function assert(name: string, ok: boolean, detail = ''): void {
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
}

const ACTIVE_RULE_SET: ClinicalRuleSetRecord = {
  id: 'rule-set-1',
  name: 'Test set',
  version: 1,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

class InMemoryClinicalRuleRepository implements ClinicalRuleRepository {
  private ruleSet = ACTIVE_RULE_SET;
  private rules: ClinicalRuleRecord[] = [
    {
      id: 'rule-1',
      ruleSetId: ACTIVE_RULE_SET.id,
      code: 'bp.elevated_systolic',
      name: 'Tensiune sistolică ridicată',
      category: CLINICAL_RULE_CATEGORIES.CARDIOVASCULAR,
      severity: CLINICAL_RULE_SEVERITIES.ELEVATED,
      ruleType: CLINICAL_RULE_TYPES.THRESHOLD,
      thresholdKey: 'bloodPressure.elevatedSystolic',
      thresholdValue: 150,
      thresholdUnit: 'mmHg',
      recommendationText: null,
      enabled: true,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'rule-2',
      ruleSetId: ACTIVE_RULE_SET.id,
      code: 'anamnesis.chest_pain',
      name: 'Durere toracică',
      category: CLINICAL_RULE_CATEGORIES.ANAMNESIS,
      severity: CLINICAL_RULE_SEVERITIES.CRITICAL,
      ruleType: CLINICAL_RULE_TYPES.ANAMNESIS,
      thresholdKey: null,
      thresholdValue: null,
      thresholdUnit: null,
      recommendationText: null,
      enabled: true,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  private changes: ClinicalRuleChangeRecord[] = [];

  async getActiveRuleSet(): Promise<ClinicalRuleSetRecord | null> {
    return this.ruleSet;
  }

  async getRuleSetById(id: string): Promise<ClinicalRuleSetRecord | null> {
    return id === this.ruleSet.id ? this.ruleSet : null;
  }

  async listRules(params: ListClinicalRulesParams): Promise<{ items: ClinicalRuleRecord[]; total: number }> {
    let items = this.rules.filter((rule) => rule.ruleSetId === params.ruleSetId);
    if (params.search) {
      const term = params.search.toLowerCase();
      items = items.filter(
        (rule) => rule.name.toLowerCase().includes(term) || rule.code.toLowerCase().includes(term),
      );
    }
    if (params.category) {
      items = items.filter((rule) => rule.category === params.category);
    }
    if (params.enabled !== undefined) {
      items = items.filter((rule) => rule.enabled === params.enabled);
    }
    const total = items.length;
    return { items: items.slice(params.skip, params.skip + params.take), total };
  }

  async listAllRulesForRuleSet(ruleSetId: string): Promise<ClinicalRuleRecord[]> {
    return this.rules.filter((rule) => rule.ruleSetId === ruleSetId);
  }

  async findRuleById(id: string): Promise<ClinicalRuleRecord | null> {
    return this.rules.find((rule) => rule.id === id) ?? null;
  }

  async findRuleByCode(ruleSetId: string, code: string): Promise<ClinicalRuleRecord | null> {
    return this.rules.find((rule) => rule.ruleSetId === ruleSetId && rule.code === code) ?? null;
  }

  async createRule(data: CreateClinicalRuleData): Promise<ClinicalRuleRecord> {
    const rule: ClinicalRuleRecord = {
      id: `rule-${this.rules.length + 1}`,
      ruleSetId: data.ruleSetId,
      code: data.code,
      name: data.name,
      category: data.category,
      severity: data.severity,
      ruleType: data.ruleType,
      thresholdKey: data.thresholdKey ?? null,
      thresholdValue: data.thresholdValue ?? null,
      thresholdUnit: data.thresholdUnit ?? null,
      recommendationText: data.recommendationText ?? null,
      enabled: data.enabled,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.rules.push(rule);
    this.changes.unshift({
      id: `change-${this.changes.length + 1}`,
      ruleId: rule.id,
      ruleSetId: data.ruleSetId,
      version: 1,
      changedById: data.changedById,
      changedByName: data.changedByName,
      changeType: 'created',
      previousValue: null,
      newValue: { code: rule.code },
      occurredAt: new Date(),
      ruleCode: rule.code,
      ruleName: rule.name,
    });
    return rule;
  }

  async updateRule(id: string, data: UpdateClinicalRuleData): Promise<ClinicalRuleRecord> {
    const index = this.rules.findIndex((rule) => rule.id === id);
    if (index === -1) throw new Error('Rule not found');
    const previous = { ...this.rules[index] };
    this.rules[index] = {
      ...this.rules[index],
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.thresholdValue !== undefined ? { thresholdValue: data.thresholdValue } : {}),
      version: this.rules[index].version + 1,
      updatedAt: new Date(),
    };
    this.changes.unshift({
      id: `change-${this.changes.length + 1}`,
      ruleId: id,
      ruleSetId: previous.ruleSetId,
      version: this.rules[index].version,
      changedById: data.changedById,
      changedByName: data.changedByName,
      changeType: 'updated',
      previousValue: { threshold_value: previous.thresholdValue },
      newValue: { threshold_value: this.rules[index].thresholdValue },
      occurredAt: new Date(),
      ruleCode: previous.code,
      ruleName: previous.name,
    });
    return this.rules[index];
  }

  async setRuleEnabled(
    id: string,
    enabled: boolean,
    changedBy: { id: string; name: string },
  ): Promise<ClinicalRuleRecord> {
    const index = this.rules.findIndex((rule) => rule.id === id);
    if (index === -1) throw new Error('Rule not found');
    this.rules[index] = {
      ...this.rules[index],
      enabled,
      version: this.rules[index].version + 1,
      updatedAt: new Date(),
    };
    this.changes.unshift({
      id: `change-${this.changes.length + 1}`,
      ruleId: id,
      ruleSetId: this.rules[index].ruleSetId,
      version: this.rules[index].version,
      changedById: changedBy.id,
      changedByName: changedBy.name,
      changeType: enabled ? 'enabled' : 'disabled',
      previousValue: null,
      newValue: { enabled },
      occurredAt: new Date(),
      ruleCode: this.rules[index].code,
      ruleName: this.rules[index].name,
    });
    return this.rules[index];
  }

  async listChanges(params: ListClinicalRuleChangesParams): Promise<{
    items: ClinicalRuleChangeRecord[];
    total: number;
  }> {
    let items = this.changes.filter((change) => change.ruleSetId === params.ruleSetId);
    if (params.ruleId) {
      items = items.filter((change) => change.ruleId === params.ruleId);
    }
    const total = items.length;
    return { items: items.slice(params.skip, params.skip + params.take), total };
  }

  async countRules(ruleSetId: string): Promise<{ total: number; enabled: number }> {
    const items = this.rules.filter((rule) => rule.ruleSetId === ruleSetId);
    return {
      total: items.length,
      enabled: items.filter((rule) => rule.enabled).length,
    };
  }
}

const sampleRequest: ClinicalEvaluationRequest = {
  clinical_engine_input: {
    patient_id: '33333333-3333-4333-8333-333333333333',
    campaign_id: '11111111-1111-4111-8111-111111111111',
    screening_id: '44444444-4444-4444-8444-444444444444',
    captured_at: new Date().toISOString(),
    measurements: {
      systolic_bp: 145,
      diastolic_bp: 88,
      pulse: 78,
      oxygen_saturation: 97,
      blood_glucose: 110,
      blood_glucose_status: 'fasting',
      weight_kg: 82,
      height_cm: 175,
      bmi: 26.8,
      ideal_weight_kg: 70.7,
      waist_circumference_cm: 98,
      known_hypertension: false,
      known_diabetes: false,
      current_antihypertensive_treatment: false,
    },
  },
  patient: { age: 45, gender: 'M' },
  anamnesis: {
    smoking_status: '',
    alcohol_consumption: '',
    known_diabetes: null,
    chest_pain: false,
    dyspnea: null,
    snoring: null,
    current_treatment: '',
    free_notes: '',
  },
};

async function run(): Promise<void> {
  const repository = new InMemoryClinicalRuleRepository();
  const listRules = new ListClinicalRulesUseCase(repository);
  const updateRule = new UpdateClinicalRuleUseCase(repository);
  const disableRule = new SetClinicalRuleEnabledUseCase(repository);
  const createRule = new CreateClinicalRuleUseCase(repository);
  const listChanges = new ListClinicalRuleChangesUseCase(repository);

  const listed = await listRules.execute({ page: 1, limit: 20 });
  assert('lists active rule set rules', listed.rules.length === 2);
  assert('rule set metadata present', listed.rule_set.is_active === true);

  const updated = await updateRule.execute(
    'rule-1',
    { threshold_value: 160 },
    { id: 'admin-1', name: 'Admin Test' },
  );
  assert('updates threshold value', updated.rule.threshold_value === 160);

  const disabled = await disableRule.execute('rule-2', false, { id: 'admin-1', name: 'Admin Test' });
  assert('disables rule', disabled.rule.enabled === false);

  await createRule.execute(
    {
      code: 'custom.threshold',
      name: 'Prag personalizat',
      category: CLINICAL_RULE_CATEGORIES.MEASUREMENTS,
      severity: CLINICAL_RULE_SEVERITIES.ATTENTION,
      rule_type: CLINICAL_RULE_TYPES.THRESHOLD,
      threshold_key: 'pulse.high',
      threshold_value: 105,
      threshold_unit: 'bpm',
      enabled: true,
    },
    { id: 'admin-1', name: 'Admin Test' },
  );
  const afterCreate = await listRules.execute({ page: 1, limit: 20 });
  assert('creates new rule', afterCreate.total === 3);

  const history = await listChanges.execute({ page: 1, limit: 10 });
  assert('records change history', history.total >= 3);

  const config = buildEngineConfigFromRules('rule-set-1', [
    {
      code: 'bp.elevated_systolic',
      enabled: true,
      ruleType: 'threshold',
      thresholdKey: 'bloodPressure.elevatedSystolic',
      thresholdValue: 150,
      recommendationText: null,
      severity: 'elevated',
      category: 'cardiovascular',
    },
  ], { isDemo: false });

  assert('builds engine config from DB rules', config.thresholds.bloodPressure.elevatedSystolic === 150);
  assert('marks config as non-demo', config.isDemo === false);

  const defaults = cloneDefaultThresholds();
  const staticEval = evaluateClinicalEngine(sampleRequest);
  assert('static evaluate still works without config', staticEval.risks.cardiovascular.level !== undefined);

  const dbEval = evaluateClinicalEngine(sampleRequest, config);
  assert('db-driven evaluate uses custom threshold', dbEval.rule_set_id === 'rule-set-1');
  assert('db-driven evaluate is not demo', dbEval.is_demo === false);
  assert(
    'elevated systolic at 145 below custom 150 threshold',
    dbEval.risks.cardiovascular.level !== 'elevated' || defaults.bloodPressure.elevatedSystolic <= 145,
  );
}

void run();
