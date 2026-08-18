import type {
  ClinicalRuleListItem,
  ClinicalRuleResponse,
  ClinicalRuleSetInfo,
  CreateClinicalRuleRequest,
  ListClinicalRuleChangesResponse,
  ListClinicalRulesResponse,
  PreviewClinicalEvaluationResponse,
  UpdateClinicalRuleRequest,
} from '@medscreen/types';
import type { ClinicalEvaluationRequestInput } from '@medscreen/shared';
import {
  CLINICAL_ENGINE_VERSION,
  buildEngineConfigFromRules,
  evaluateClinicalEngine,
} from '@medscreen/shared';
import type { ClinicalEvaluationRequest } from '@medscreen/types';
import { AppError } from '../../lib/app-error';
import type {
  ClinicalRuleRecord,
  ClinicalRuleRepository,
  ClinicalRuleSetRecord,
} from '../../domain/repositories/clinical-rule.repository';

function toListItem(rule: ClinicalRuleRecord): ClinicalRuleListItem {
  return {
    id: rule.id,
    code: rule.code,
    name: rule.name,
    category: rule.category,
    severity: rule.severity,
    rule_type: rule.ruleType,
    threshold_key: rule.thresholdKey,
    threshold_value: rule.thresholdValue,
    threshold_unit: rule.thresholdUnit,
    recommendation_text: rule.recommendationText,
    enabled: rule.enabled,
    version: rule.version,
    updated_at: rule.updatedAt.toISOString(),
  };
}

async function toRuleSetInfo(
  repository: ClinicalRuleRepository,
  ruleSet: ClinicalRuleSetRecord,
): Promise<ClinicalRuleSetInfo> {
  const counts = await repository.countRules(ruleSet.id);
  return {
    id: ruleSet.id,
    name: ruleSet.name,
    version: ruleSet.version,
    is_active: ruleSet.isActive,
    engine_version: CLINICAL_ENGINE_VERSION,
    rule_count: counts.total,
    enabled_count: counts.enabled,
  };
}

async function requireActiveRuleSet(repository: ClinicalRuleRepository): Promise<ClinicalRuleSetRecord> {
  const ruleSet = await repository.getActiveRuleSet();
  if (!ruleSet) {
    throw new AppError(404, 'NOT_FOUND', 'Nu există un set activ de reguli clinice.');
  }
  return ruleSet;
}

export class ListClinicalRulesUseCase {
  constructor(private readonly clinicalRuleRepository: ClinicalRuleRepository) {}

  async execute(params: {
    search?: string;
    category?: ClinicalRuleListItem['category'];
    enabled?: boolean;
    page: number;
    limit: number;
  }): Promise<ListClinicalRulesResponse> {
    const ruleSet = await requireActiveRuleSet(this.clinicalRuleRepository);
    const skip = (params.page - 1) * params.limit;
    const result = await this.clinicalRuleRepository.listRules({
      ruleSetId: ruleSet.id,
      search: params.search,
      category: params.category,
      enabled: params.enabled,
      skip,
      take: params.limit,
    });

    return {
      rule_set: await toRuleSetInfo(this.clinicalRuleRepository, ruleSet),
      rules: result.items.map(toListItem),
      total: result.total,
      page: params.page,
      limit: params.limit,
    };
  }
}

export class GetClinicalRuleUseCase {
  constructor(private readonly clinicalRuleRepository: ClinicalRuleRepository) {}

  async execute(ruleId: string): Promise<ClinicalRuleResponse> {
    const rule = await this.clinicalRuleRepository.findRuleById(ruleId);
    if (!rule) {
      throw new AppError(404, 'NOT_FOUND', 'Regula clinică nu a fost găsită.');
    }
    return { rule: toListItem(rule) };
  }
}

export class CreateClinicalRuleUseCase {
  constructor(private readonly clinicalRuleRepository: ClinicalRuleRepository) {}

  async execute(
    payload: CreateClinicalRuleRequest,
    changedBy: { id: string; name: string },
  ): Promise<ClinicalRuleResponse> {
    const ruleSet = await requireActiveRuleSet(this.clinicalRuleRepository);

    const existing = await this.clinicalRuleRepository.findRuleByCode(ruleSet.id, payload.code);
    if (existing) {
      throw new AppError(409, 'CONFLICT', 'Există deja o regulă cu acest cod.', [
        { field: 'code', issue: 'Codul este deja folosit.' },
      ]);
    }

    const rule = await this.clinicalRuleRepository.createRule({
      ruleSetId: ruleSet.id,
      code: payload.code,
      name: payload.name,
      category: payload.category,
      severity: payload.severity,
      ruleType: payload.rule_type,
      thresholdKey: payload.threshold_key ?? null,
      thresholdValue: payload.threshold_value ?? null,
      thresholdUnit: payload.threshold_unit ?? null,
      recommendationText: payload.recommendation_text ?? null,
      enabled: payload.enabled ?? true,
      changedById: changedBy.id,
      changedByName: changedBy.name,
    });

    return { rule: toListItem(rule) };
  }
}

export class UpdateClinicalRuleUseCase {
  constructor(private readonly clinicalRuleRepository: ClinicalRuleRepository) {}

  async execute(
    ruleId: string,
    payload: UpdateClinicalRuleRequest,
    changedBy: { id: string; name: string },
  ): Promise<ClinicalRuleResponse> {
    const existing = await this.clinicalRuleRepository.findRuleById(ruleId);
    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Regula clinică nu a fost găsită.');
    }

    const rule = await this.clinicalRuleRepository.updateRule(ruleId, {
      name: payload.name,
      category: payload.category,
      severity: payload.severity,
      thresholdValue: payload.threshold_value,
      thresholdUnit: payload.threshold_unit,
      recommendationText: payload.recommendation_text,
      changedById: changedBy.id,
      changedByName: changedBy.name,
    });

    return { rule: toListItem(rule) };
  }
}

export class SetClinicalRuleEnabledUseCase {
  constructor(private readonly clinicalRuleRepository: ClinicalRuleRepository) {}

  async execute(
    ruleId: string,
    enabled: boolean,
    changedBy: { id: string; name: string },
  ): Promise<ClinicalRuleResponse> {
    const existing = await this.clinicalRuleRepository.findRuleById(ruleId);
    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Regula clinică nu a fost găsită.');
    }

    const rule = await this.clinicalRuleRepository.setRuleEnabled(ruleId, enabled, changedBy);
    return { rule: toListItem(rule) };
  }
}

export class ListClinicalRuleChangesUseCase {
  constructor(private readonly clinicalRuleRepository: ClinicalRuleRepository) {}

  async execute(params: {
    ruleId?: string;
    page: number;
    limit: number;
  }): Promise<ListClinicalRuleChangesResponse> {
    const ruleSet = await requireActiveRuleSet(this.clinicalRuleRepository);
    const skip = (params.page - 1) * params.limit;
    const result = await this.clinicalRuleRepository.listChanges({
      ruleSetId: ruleSet.id,
      ruleId: params.ruleId,
      skip,
      take: params.limit,
    });

    return {
      changes: result.items.map((change) => ({
        id: change.id,
        rule_id: change.ruleId,
        rule_code: change.ruleCode,
        rule_name: change.ruleName,
        version: change.version,
        change_type: change.changeType,
        changed_by_id: change.changedById,
        changed_by_name: change.changedByName,
        previous_value: change.previousValue,
        new_value: change.newValue,
        occurred_at: change.occurredAt.toISOString(),
      })),
      total: result.total,
      page: params.page,
      limit: params.limit,
    };
  }
}

export class PreviewClinicalEvaluationUseCase {
  constructor(private readonly clinicalRuleRepository: ClinicalRuleRepository) {}

  async execute(input: ClinicalEvaluationRequestInput): Promise<PreviewClinicalEvaluationResponse> {
    const ruleSet = await requireActiveRuleSet(this.clinicalRuleRepository);
    const rules = await this.clinicalRuleRepository.listAllRulesForRuleSet(ruleSet.id);
    const config = buildEngineConfigFromRules(
      ruleSet.id,
      rules.map((rule) => ({
        code: rule.code,
        enabled: rule.enabled,
        ruleType: rule.ruleType,
        thresholdKey: rule.thresholdKey,
        thresholdValue: rule.thresholdValue,
        recommendationText: rule.recommendationText,
        severity: rule.severity,
        category: rule.category,
      })),
      { isDemo: false },
    );

    const evaluation = evaluateClinicalEngine(input as ClinicalEvaluationRequest, config);

    return {
      evaluation,
      rule_set: await toRuleSetInfo(this.clinicalRuleRepository, ruleSet),
    };
  }
}

export class LoadActiveClinicalEngineConfigUseCase {
  constructor(private readonly clinicalRuleRepository: ClinicalRuleRepository) {}

  async execute() {
    const ruleSet = await this.clinicalRuleRepository.getActiveRuleSet();
    if (!ruleSet) {
      return undefined;
    }

    const rules = await this.clinicalRuleRepository.listAllRulesForRuleSet(ruleSet.id);
    return buildEngineConfigFromRules(
      ruleSet.id,
      rules.map((rule) => ({
        code: rule.code,
        enabled: rule.enabled,
        ruleType: rule.ruleType,
        thresholdKey: rule.thresholdKey,
        thresholdValue: rule.thresholdValue,
        recommendationText: rule.recommendationText,
        severity: rule.severity,
        category: rule.category,
      })),
      { isDemo: false },
    );
  }
}
