import type { PrismaClient } from '@prisma/client';
import {
  DEFAULT_CLINICAL_RULES,
  DEFAULT_CLINICAL_RULE_SET_ID,
  DEFAULT_CLINICAL_RULE_SET_NAME,
} from '@medscreen/shared';

export async function seedClinicalRules(prisma: PrismaClient): Promise<void> {
  const ruleSet = await prisma.clinicalRuleSet.upsert({
    where: { id: DEFAULT_CLINICAL_RULE_SET_ID },
    update: {
      name: DEFAULT_CLINICAL_RULE_SET_NAME,
      isActive: true,
    },
    create: {
      id: DEFAULT_CLINICAL_RULE_SET_ID,
      name: DEFAULT_CLINICAL_RULE_SET_NAME,
      version: 1,
      isActive: true,
    },
  });

  await prisma.clinicalRuleSet.updateMany({
    where: {
      id: { not: ruleSet.id },
    },
    data: {
      isActive: false,
    },
  });

  for (const rule of DEFAULT_CLINICAL_RULES) {
    await prisma.clinicalRule.upsert({
      where: {
        ruleSetId_code: {
          ruleSetId: ruleSet.id,
          code: rule.code,
        },
      },
      update: {
        name: rule.name,
        category: rule.category,
        severity: rule.severity,
        ruleType: rule.ruleType,
        thresholdKey: rule.thresholdKey ?? null,
        thresholdValue: rule.thresholdValue ?? null,
        thresholdUnit: rule.thresholdUnit ?? null,
        recommendationText: rule.recommendationText ?? null,
        enabled: rule.enabled,
      },
      create: {
        ruleSetId: ruleSet.id,
        code: rule.code,
        name: rule.name,
        category: rule.category,
        severity: rule.severity,
        ruleType: rule.ruleType,
        thresholdKey: rule.thresholdKey ?? null,
        thresholdValue: rule.thresholdValue ?? null,
        thresholdUnit: rule.thresholdUnit ?? null,
        recommendationText: rule.recommendationText ?? null,
        enabled: rule.enabled,
      },
    });
  }

  console.log(`[seed] Clinical rule set seeded with ${DEFAULT_CLINICAL_RULES.length} rules.`);
}
