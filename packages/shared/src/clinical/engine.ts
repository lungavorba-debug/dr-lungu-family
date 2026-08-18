import type {

  ClinicalEvaluationRequest,

  ClinicalEvaluationResult,

  ClinicalRecommendation,

  ClinicalRiskAssessment,

  ClinicalWarning,

} from '@medscreen/types';

import { getMeasurementWarnings } from '../schemas/measurements.schema';

import type { ClinicalEngineConfig } from './build-engine-config';

import {

  CLINICAL_ENGINE_VERSION,

  DEMO_RULE_SET_ID,

} from './demo-rule-set';

import { buildClinicalRuleContext, isRuleEnabled } from './rule-context';

import { assessCardiovascularRisk } from './rules/cardiovascular.rule';

import { assessDiabetesRisk } from './rules/diabetes.rule';

import { assessSleepApneaRisk } from './rules/sleep-apnea.rule';



export interface ClinicalEngine {

  evaluate(request: ClinicalEvaluationRequest): ClinicalEvaluationResult;

}



/**

 * Configurable clinical engine shell.

 * Rule modules are swappable; thresholds and flags load from admin configuration when provided.

 */

export class DemoClinicalEngine implements ClinicalEngine {

  constructor(private readonly config?: ClinicalEngineConfig) {}



  evaluate(request: ClinicalEvaluationRequest): ClinicalEvaluationResult {

    const ctx = buildClinicalRuleContext(request, this.config);

    const { clinical_engine_input } = request;



    const cardiovascular = assessCardiovascularRisk(ctx);

    const diabetes = assessDiabetesRisk(ctx);

    const sleep_apnea = assessSleepApneaRisk(ctx);



    const risks = { cardiovascular, diabetes, sleep_apnea };

    const warnings = buildWarnings(ctx, risks);

    const recommendations = buildRecommendations(ctx, risks, warnings);

    const interpretation = buildInterpretation(request, risks, recommendations, ctx.isDemo);



    return {

      engine_version: this.config?.engineVersion ?? CLINICAL_ENGINE_VERSION,

      rule_set_id: this.config?.ruleSetId ?? DEMO_RULE_SET_ID,

      is_demo: this.config?.isDemo ?? true,

      evaluated_at: new Date().toISOString(),

      screening_id: clinical_engine_input.screening_id,

      patient_id: clinical_engine_input.patient_id,

      risks,

      warnings,

      recommendations,

      interpretation,

    };

  }

}



export const clinicalEngine: ClinicalEngine = new DemoClinicalEngine();



export function evaluateClinicalEngine(

  request: ClinicalEvaluationRequest,

  config?: ClinicalEngineConfig,

): ClinicalEvaluationResult {

  const engine = config ? new DemoClinicalEngine(config) : clinicalEngine;

  return engine.evaluate(request);

}



function buildWarnings(

  ctx: ReturnType<typeof buildClinicalRuleContext>,

  risks: Record<string, ClinicalRiskAssessment>,

): ClinicalWarning[] {

  const warnings: ClinicalWarning[] = [];

  const demoPrefix = ctx.isDemo ? '[DEMO] ' : '';



  for (const measurementWarning of getMeasurementWarnings(ctx.measurements)) {

    warnings.push({

      code: `measurement_${measurementWarning.field}`,

      message: measurementWarning.message,

      severity: 'attention',

      source_field: measurementWarning.field,

    });

  }



  for (const risk of Object.values(risks)) {

    if (risk.level === 'elevated') {

      warnings.push({

        code: `elevated_${risk.category}`,

        message: `${demoPrefix}Semnal ridicat pentru ${risk.category.replace('_', ' ')}.`,

        severity: 'attention',

      });

    }

  }



  if (

    ctx.request.anamnesis.chest_pain === true &&

    isRuleEnabled(ctx, 'anamnesis.chest_pain')

  ) {

    warnings.push({

      code: 'chest_pain',

      message: `${demoPrefix}Durere toracică raportată — operatorul trebuie să asigure calea de follow-up adecvată.`,

      severity: 'critical',

    });

  }



  return warnings;

}



function getRecommendationMessage(

  ctx: ReturnType<typeof buildClinicalRuleContext>,

  code: string,

  defaultMessage: string,

): string {

  const override = ctx.recommendationOverrides.find((item) => item.code === code);

  return override?.message ?? defaultMessage;

}



function buildRecommendations(

  ctx: ReturnType<typeof buildClinicalRuleContext>,

  risks: Record<string, ClinicalRiskAssessment>,

  warnings: ClinicalWarning[],

): ClinicalRecommendation[] {

  const recommendations: ClinicalRecommendation[] = [];

  const demoPrefix = ctx.isDemo ? '[DEMO] ' : '';



  if (isRuleEnabled(ctx, 'recommendation.general_follow_up')) {

    recommendations.push({

      code: 'general_follow_up',

      message: getRecommendationMessage(

        ctx,

        'recommendation.general_follow_up',

        `${demoPrefix}Discutați rezultatele screeningului cu participantul și recomandați follow-up medical conform protocolului local.`,

      ),

      priority: 'routine',

      category: 'general',

    });

  }



  if (

    (risks.cardiovascular.level === 'elevated' || risks.cardiovascular.level === 'moderate') &&

    isRuleEnabled(ctx, 'recommendation.cv_review')

  ) {

    recommendations.push({

      code: 'cv_review',

      message: getRecommendationMessage(

        ctx,

        'recommendation.cv_review',

        `${demoPrefix}Semnale cardiovasculare detectate — considerați reevaluarea tensiunii și trimiterea la medic conform protocolului.`,

      ),

      priority: risks.cardiovascular.level === 'elevated' ? 'soon' : 'routine',

      category: 'cardiovascular',

    });

  }



  if (

    (risks.diabetes.level === 'elevated' || risks.diabetes.level === 'moderate') &&

    isRuleEnabled(ctx, 'recommendation.diabetes_review')

  ) {

    recommendations.push({

      code: 'diabetes_review',

      message: getRecommendationMessage(

        ctx,

        'recommendation.diabetes_review',

        `${demoPrefix}Semnale glicemice/metabolice detectate — considerați confirmarea conform protocolului.`,

      ),

      priority: risks.diabetes.level === 'elevated' ? 'soon' : 'routine',

      category: 'diabetes',

    });

  }



  if (

    (risks.sleep_apnea.level === 'elevated' || risks.sleep_apnea.level === 'moderate') &&

    isRuleEnabled(ctx, 'recommendation.sleep_review')

  ) {

    recommendations.push({

      code: 'sleep_review',

      message: getRecommendationMessage(

        ctx,

        'recommendation.sleep_review',

        `${demoPrefix}Semnale legate de somn detectate — considerați evaluare suplimentară conform protocolului.`,

      ),

      priority: risks.sleep_apnea.level === 'elevated' ? 'soon' : 'routine',

      category: 'sleep_apnea',

    });

  }



  if (

    warnings.some((w) => w.severity === 'critical') &&

    isRuleEnabled(ctx, 'recommendation.urgent_review')

  ) {

    recommendations.push({

      code: 'urgent_review',

      message: getRecommendationMessage(

        ctx,

        'recommendation.urgent_review',

        `${demoPrefix}Avertisment critic prezent — asigurați revizuirea imediată de către operator înainte ca participantul să plece.`,

      ),

      priority: 'urgent',

      category: 'general',

    });

  }



  return recommendations;

}



function buildInterpretation(

  request: ClinicalEvaluationRequest,

  risks: Record<string, ClinicalRiskAssessment>,

  recommendations: ClinicalRecommendation[],

  isDemo: boolean,

) {

  const elevated = Object.values(risks).filter((r) => r.level === 'elevated');

  const moderate = Object.values(risks).filter((r) => r.level === 'moderate');

  const prefix = isDemo ? '[DEMO] ' : '';



  const summary =

    elevated.length > 0

      ? `${prefix}${elevated.length} zonă/zonă(e) cu semnal ridicat — revizuire operator recomandată.`

      : moderate.length > 0

        ? `${prefix}${moderate.length} semnal(e) moderat(e) — follow-up de rutină sugerat.`

        : `${prefix}Niciun semnal ridicat detectat în categoriile evaluate.`;



  return {

    summary,

    sections: [

      ...(isDemo

        ? [

            {

              title: 'Notificare set reguli',

              content:

                'Această interpretare poate folosi reguli demonstrative. Validarea clinică este necesară înainte de utilizare în producție.',

            },

          ]

        : []),

      {

        title: 'Context participant',

        content: `Vârstă ${request.patient.age}, sex ${request.patient.gender}. Screening capturat la ${request.clinical_engine_input.captured_at}.`,

      },

      {

        title: 'Prezentare generală risc',

        content: Object.values(risks)

          .map((r) => `${r.category}: ${r.level} — ${r.summary}`)

          .join('\n'),

      },

      {

        title: 'Recomandări generate',

        content: `${recommendations.length} recomandare/recomandări generate pentru revizuire operator.`,

      },

    ],

  };

}



export type { ClinicalEngineConfig } from './build-engine-config';

