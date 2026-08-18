import type { ClinicalRiskAssessment } from '@medscreen/types';

import type { ClinicalRuleContext } from '../rule-context';



/**

 * Sleep apnea risk assessment using configurable thresholds and symptom flags.

 */

export function assessSleepApneaRisk(ctx: ClinicalRuleContext): ClinicalRiskAssessment {

  const { measurements, request } = ctx;

  const factors: string[] = [];

  let level: ClinicalRiskAssessment['level'] = 'low';

  const elevatedBmi = ctx.thresholds.sleepApnea.elevatedBmi;

  const demoLabel = ctx.isDemo ? ' (prag demo)' : '';



  if (request.anamnesis.snoring === true) {

    factors.push('Sforăit raportat');

    level = 'moderate';

  }



  if (request.anamnesis.dyspnea === true) {

    factors.push('Dispnee raportată');

    level = elevate(level, 'moderate');

  }



  if (

    request.anamnesis.snoring === true &&

    measurements.bmi !== null &&

    measurements.bmi >= elevatedBmi

  ) {

    factors.push(`Sforăit + IMC ≥ ${elevatedBmi}${demoLabel}`);

    level = 'elevated';

  }



  if (request.anamnesis.snoring === null && request.anamnesis.dyspnea === null) {

    level = 'unknown';

  }



  return {

    category: 'sleep_apnea',

    level,

    summary: summarizeSleepApnea(level, ctx.isDemo),

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



function summarizeSleepApnea(level: ClinicalRiskAssessment['level'], isDemo: boolean): string {

  const prefix = isDemo ? '[DEMO] ' : '';

  const labels: Record<ClinicalRiskAssessment['level'], string> = {

    unknown: 'Date simptomatice insuficiente pentru evaluare',

    low: 'Niciun semnal de apnee/somn ridicat detectat',

    moderate: 'Semnale legate de somn moderate — revizuire recomandată',

    elevated: 'Semnale de apnee/somn ridicate — revizuire prioritară',

  };

  return `${prefix}sleep_apnea: ${labels[level]}`;

}

