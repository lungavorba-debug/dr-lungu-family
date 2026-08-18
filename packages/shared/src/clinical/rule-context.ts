import type { ClinicalEvaluationRequest } from '@medscreen/types';

import type { MedicalMeasurementsInput } from '../schemas/measurements.schema';

import type { ClinicalEngineConfig, ClinicalThresholdsConfig } from './build-engine-config';

import { cloneDefaultThresholds } from './build-engine-config';

import { getAllDefaultRuleCodes } from './default-rules';

import { DEMO_RULE_SET_ID } from './demo-rule-set';



/** Normalized context passed to each rule module. */

export interface ClinicalRuleContext {

  request: ClinicalEvaluationRequest;

  measurements: MedicalMeasurementsInput;

  age: number;

  gender: string;

  thresholds: ClinicalThresholdsConfig;

  enabledRuleCodes: Set<string>;

  ruleSetId: string;

  isDemo: boolean;

  recommendationOverrides: ClinicalEngineConfig['recommendationOverrides'];

}



export function isRuleEnabled(ctx: ClinicalRuleContext, code: string): boolean {

  return ctx.enabledRuleCodes.has(code);

}



export function buildClinicalRuleContext(

  request: ClinicalEvaluationRequest,

  config?: ClinicalEngineConfig,

): ClinicalRuleContext {

  return {

    request,

    measurements: request.clinical_engine_input.measurements as MedicalMeasurementsInput,

    age: request.patient.age,

    gender: request.patient.gender,

    thresholds: config?.thresholds ?? cloneDefaultThresholds(),

    enabledRuleCodes: config?.enabledRuleCodes ?? getAllDefaultRuleCodes(),

    ruleSetId: config?.ruleSetId ?? DEMO_RULE_SET_ID,

    isDemo: config?.isDemo ?? true,

    recommendationOverrides: config?.recommendationOverrides ?? [],

  };

}

