import type { ClinicalRiskAssessment } from '@medscreen/types';

import type { ClinicalRuleContext } from '../rule-context';

import { isRuleEnabled } from '../rule-context';



/**

 * Cardiovascular risk assessment using configurable thresholds.

 */

export function assessCardiovascularRisk(ctx: ClinicalRuleContext): ClinicalRiskAssessment {

  const { measurements, request } = ctx;

  const factors: string[] = [];

  let level: ClinicalRiskAssessment['level'] = 'low';

  const bp = ctx.thresholds.bloodPressure;

  const bmiThresholds = ctx.thresholds.bmi;

  const demoLabel = ctx.isDemo ? ' (prag demo)' : '';



  if (

    request.anamnesis.chest_pain === true &&

    isRuleEnabled(ctx, 'anamnesis.chest_pain')

  ) {

    factors.push('Durere toracică raportată');

    level = 'elevated';

  }



  if (measurements.known_hypertension === true) {

    factors.push('Hipertensiune cunoscută (raportată)');

    level = elevate(level, 'moderate');

  }



  if (measurements.current_antihypertensive_treatment === true) {

    factors.push('Tratament antihipertensiv curent');

  }



  const sys = measurements.systolic_bp;

  const dia = measurements.diastolic_bp;

  const bmi = measurements.bmi;



  if (sys !== null && sys >= bp.elevatedSystolic) {

    factors.push(`Tensiune sistolică ≥ ${bp.elevatedSystolic} mmHg${demoLabel}`);

    level = 'elevated';

  } else if (sys !== null && sys >= bp.moderateSystolic) {

    factors.push(`Tensiune sistolică ≥ ${bp.moderateSystolic} mmHg${demoLabel}`);

    level = elevate(level, 'moderate');

  }



  if (dia !== null && dia >= bp.elevatedDiastolic) {

    factors.push(`Tensiune diastolică ≥ ${bp.elevatedDiastolic} mmHg${demoLabel}`);

    level = 'elevated';

  } else if (dia !== null && dia >= bp.moderateDiastolic) {

    factors.push(`Tensiune diastolică ≥ ${bp.moderateDiastolic} mmHg${demoLabel}`);

    level = elevate(level, 'moderate');

  }



  if (bmi !== null && bmi >= bmiThresholds.elevatedObesity) {

    factors.push(`IMC ≥ ${bmiThresholds.elevatedObesity}${demoLabel}`);

    level = elevate(level, 'moderate');

  } else if (bmi !== null && bmi >= bmiThresholds.moderate) {

    factors.push(`IMC ≥ ${bmiThresholds.moderate}${demoLabel}`);

    level = elevate(level, 'moderate');

  }



  if (request.anamnesis.smoking_status === 'current') {

    factors.push('Fumător activ');

    level = elevate(level, 'moderate');

  }



  if (sys === null && dia === null && bmi === null && factors.length === 0) {

    level = 'unknown';

  }



  return {

    category: 'cardiovascular',

    level,

    summary: summarizeRisk('cardiovascular', level, ctx.isDemo),

    factors,

    rule_set_id: ctx.ruleSetId,

    is_demo: ctx.isDemo,

  };

}



function elevate(

  current: ClinicalRiskAssessment['level'],

  next: ClinicalRiskAssessment['level'],

): ClinicalRiskAssessment['level'] {

  const order: ClinicalRiskAssessment['level'][] = ['unknown', 'low', 'moderate', 'elevated'];

  return order.indexOf(next) > order.indexOf(current) ? next : current;

}



function summarizeRisk(category: string, level: ClinicalRiskAssessment['level'], isDemo: boolean): string {

  const prefix = isDemo ? '[DEMO] ' : '';

  const labels: Record<ClinicalRiskAssessment['level'], string> = {

    unknown: 'Date insuficiente pentru evaluare',

    low: 'Niciun semnal cardiovascular ridicat detectat',

    moderate: 'Semnale cardiovasculare moderate — revizuire recomandată',

    elevated: 'Semnale cardiovasculare ridicate — revizuire prioritară',

  };

  return `${prefix}${category}: ${labels[level]}`;

}

