import { Prisma } from '@prisma/client';
import type {
  ClinicalRuleCategory,
  ClinicalRuleChangeType,
  ClinicalRuleSeverity,
  ClinicalRuleType,
} from '@medscreen/types';
import type {
  ClinicalRuleChangeRecord,
  ClinicalRuleRecord,
  ClinicalRuleRepository,
  ClinicalRuleSetRecord,
  CreateClinicalRuleData,
  ListClinicalRuleChangesParams,
  ListClinicalRulesParams,
  UpdateClinicalRuleData,
} from '../../../domain/repositories/clinical-rule.repository';
import { prisma } from '../prisma.client';

function mapRuleSet(record: {
  id: string;
  name: string;
  version: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ClinicalRuleSetRecord {
  return {
    id: record.id,
    name: record.name,
    version: record.version,
    isActive: record.isActive,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapRule(record: {
  id: string;
  ruleSetId: string;
  code: string;
  name: string;
  category: string;
  severity: string;
  ruleType: string;
  thresholdKey: string | null;
  thresholdValue: Prisma.Decimal | null;
  thresholdUnit: string | null;
  recommendationText: string | null;
  enabled: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}): ClinicalRuleRecord {
  return {
    id: record.id,
    ruleSetId: record.ruleSetId,
    code: record.code,
    name: record.name,
    category: record.category as ClinicalRuleCategory,
    severity: record.severity as ClinicalRuleSeverity,
    ruleType: record.ruleType as ClinicalRuleType,
    thresholdKey: record.thresholdKey,
    thresholdValue: record.thresholdValue !== null ? Number(record.thresholdValue) : null,
    thresholdUnit: record.thresholdUnit,
    recommendationText: record.recommendationText,
    enabled: record.enabled,
    version: record.version,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function snapshotRule(rule: ClinicalRuleRecord): Record<string, unknown> {
  return {
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
  };
}

export class PrismaClinicalRuleRepository implements ClinicalRuleRepository {
  async getActiveRuleSet(): Promise<ClinicalRuleSetRecord | null> {
    const record = await prisma.clinicalRuleSet.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
    return record ? mapRuleSet(record) : null;
  }

  async getRuleSetById(id: string): Promise<ClinicalRuleSetRecord | null> {
    const record = await prisma.clinicalRuleSet.findUnique({ where: { id } });
    return record ? mapRuleSet(record) : null;
  }

  async listRules(params: ListClinicalRulesParams): Promise<{ items: ClinicalRuleRecord[]; total: number }> {
    const where = {
      ruleSetId: params.ruleSetId,
      ...(params.category ? { category: params.category } : {}),
      ...(params.enabled !== undefined ? { enabled: params.enabled } : {}),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' as const } },
              { code: { contains: params.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.clinicalRule.findMany({
        where,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
        skip: params.skip,
        take: params.take,
      }),
      prisma.clinicalRule.count({ where }),
    ]);

    return { items: rows.map(mapRule), total };
  }

  async listAllRulesForRuleSet(ruleSetId: string): Promise<ClinicalRuleRecord[]> {
    const rows = await prisma.clinicalRule.findMany({
      where: { ruleSetId },
      orderBy: { code: 'asc' },
    });
    return rows.map(mapRule);
  }

  async findRuleById(id: string): Promise<ClinicalRuleRecord | null> {
    const record = await prisma.clinicalRule.findUnique({ where: { id } });
    return record ? mapRule(record) : null;
  }

  async findRuleByCode(ruleSetId: string, code: string): Promise<ClinicalRuleRecord | null> {
    const record = await prisma.clinicalRule.findUnique({
      where: { ruleSetId_code: { ruleSetId, code } },
    });
    return record ? mapRule(record) : null;
  }

  async createRule(data: CreateClinicalRuleData): Promise<ClinicalRuleRecord> {
    const created = await prisma.$transaction(async (tx) => {
      const rule = await tx.clinicalRule.create({
        data: {
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
        },
      });

      const mapped = mapRule(rule);
      await tx.clinicalRuleChange.create({
        data: {
          ruleId: rule.id,
          ruleSetId: data.ruleSetId,
          version: 1,
          changedById: data.changedById,
          changedByName: data.changedByName,
          changeType: 'created',
          previousValue: Prisma.JsonNull,
          newValue: snapshotRule(mapped) as Prisma.InputJsonValue,
        },
      });

      return mapped;
    });

    return created;
  }

  async updateRule(id: string, data: UpdateClinicalRuleData): Promise<ClinicalRuleRecord> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.clinicalRule.findUnique({ where: { id } });
      if (!existing) {
        throw new Error('Rule not found');
      }

      const previous = mapRule(existing);
      const nextVersion = existing.version + 1;

      const updated = await tx.clinicalRule.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.category !== undefined ? { category: data.category } : {}),
          ...(data.severity !== undefined ? { severity: data.severity } : {}),
          ...(data.thresholdValue !== undefined ? { thresholdValue: data.thresholdValue } : {}),
          ...(data.thresholdUnit !== undefined ? { thresholdUnit: data.thresholdUnit } : {}),
          ...(data.recommendationText !== undefined ? { recommendationText: data.recommendationText } : {}),
          version: nextVersion,
        },
      });

      const mapped = mapRule(updated);
      await tx.clinicalRuleChange.create({
        data: {
          ruleId: id,
          ruleSetId: existing.ruleSetId,
          version: nextVersion,
          changedById: data.changedById,
          changedByName: data.changedByName,
          changeType: 'updated',
          previousValue: snapshotRule(previous) as Prisma.InputJsonValue,
          newValue: snapshotRule(mapped) as Prisma.InputJsonValue,
        },
      });

      await tx.clinicalRuleSet.update({
        where: { id: existing.ruleSetId },
        data: { version: { increment: 1 } },
      });

      return mapped;
    });
  }

  async setRuleEnabled(
    id: string,
    enabled: boolean,
    changedBy: { id: string; name: string },
  ): Promise<ClinicalRuleRecord> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.clinicalRule.findUnique({ where: { id } });
      if (!existing) {
        throw new Error('Rule not found');
      }

      const previous = mapRule(existing);
      const nextVersion = existing.version + 1;

      const updated = await tx.clinicalRule.update({
        where: { id },
        data: { enabled, version: nextVersion },
      });

      const mapped = mapRule(updated);
      await tx.clinicalRuleChange.create({
        data: {
          ruleId: id,
          ruleSetId: existing.ruleSetId,
          version: nextVersion,
          changedById: changedBy.id,
          changedByName: changedBy.name,
          changeType: enabled ? 'enabled' : 'disabled',
          previousValue: snapshotRule(previous) as Prisma.InputJsonValue,
          newValue: snapshotRule(mapped) as Prisma.InputJsonValue,
        },
      });

      await tx.clinicalRuleSet.update({
        where: { id: existing.ruleSetId },
        data: { version: { increment: 1 } },
      });

      return mapped;
    });
  }

  async listChanges(params: ListClinicalRuleChangesParams): Promise<{
    items: ClinicalRuleChangeRecord[];
    total: number;
  }> {
    const where = {
      ruleSetId: params.ruleSetId,
      ...(params.ruleId ? { ruleId: params.ruleId } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.clinicalRuleChange.findMany({
        where,
        include: { rule: { select: { code: true, name: true } } },
        orderBy: { occurredAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      prisma.clinicalRuleChange.count({ where }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        ruleId: row.ruleId,
        ruleSetId: row.ruleSetId,
        version: row.version,
        changedById: row.changedById,
        changedByName: row.changedByName,
        changeType: row.changeType as ClinicalRuleChangeType,
        previousValue: row.previousValue as Record<string, unknown> | null,
        newValue: row.newValue as Record<string, unknown>,
        occurredAt: row.occurredAt,
        ruleCode: row.rule.code,
        ruleName: row.rule.name,
      })),
      total,
    };
  }

  async countRules(ruleSetId: string): Promise<{ total: number; enabled: number }> {
    const [total, enabled] = await Promise.all([
      prisma.clinicalRule.count({ where: { ruleSetId } }),
      prisma.clinicalRule.count({ where: { ruleSetId, enabled: true } }),
    ]);
    return { total, enabled };
  }
}
