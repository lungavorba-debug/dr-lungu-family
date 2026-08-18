import type { ClinicalRiskAssessment } from '@medscreen/types';

import type { ClinicalRuleContext } from '../rule-context';



/**

 * Diabetes risk assessment using configurable thresholds.

 */

export function assessDiabetesRisk(ctx: ClinicalRuleContext): ClinicalRiskAssessment {

  const { measurements, request } = ctx;

  const factors: string[] = [];

  let level: ClinicalRiskAssessment['level'] = 'low';

  const glucoseThresholds = ctx.thresholds.glucose;

  const bmiThresholds = ctx.thresholds.bmi;

  const demoLabel = ctx.isDemo ? ' (prag demo)' : '';



  const glucose = measurements.blood_glucose;

  const status = measurements.blood_glucose_status;

  const knownFromAnamnesis = request.anamnesis.known_diabetes === true;

  const knownFromMeasurements = measurements.known_diabetes === true;



  if (knownFromAnamnesis || knownFromMeasurements) {

    factors.push('Diabet cunoscut (raportat)');

    level = 'elevated';

  }



  if (glucose !== null) {

    if (status === 'fasting') {

      if (glucose >= glucoseThresholds.fastingElevated) {

        factors.push(`Glicemie post ≥ ${glucoseThresholds.fastingElevated} mg/dL${demoLabel}`);

        level = 'elevated';

      } else if (glucose >= glucoseThresholds.fastingModerate) {

        factors.push(`Glicemie post ≥ ${glucoseThresholds.fastingModerate} mg/dL${demoLabel}`);

        level = elevate(level, 'moderate');

      }

    } else if (status === 'non_fasting') {

      if (glucose >= glucoseThresholds.nonFastingElevated) {

        factors.push(`Glicemie non-post ≥ ${glucoseThresholds.nonFastingElevated} mg/dL${demoLabel}`);

        level = 'elevated';

      } else if (glucose >= glucoseThresholds.nonFastingModerate) {

        factors.push(`Glicemie non-post ≥ ${glucoseThresholds.nonFastingModerate} mg/dL${demoLabel}`);

        level = elevate(level, 'moderate');

      }

    } else if (glucose >= glucoseThresholds.fastingElevated) {

      factors.push(`Glicemie ≥ ${glucoseThresholds.fastingElevated} mg/dL fără status${demoLabel}`);

      level = elevate(level, 'moderate');

    }

  }



  if (measurements.bmi !== null && measurements.bmi >= bmiThresholds.elevatedObesity) {

    factors.push(`IMC ≥ ${bmiThresholds.elevatedObesity}${demoLabel}`);

    level = elevate(level, 'moderate');

  }



  if (glucose === null && !knownFromAnamnesis && !knownFromMeasurements) {

    level = 'unknown';

  }



  return {

    category: 'diabetes',

    level,

    summary: summarizeDiabetes(level, ctx.isDemo),

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



function summarizeDiabetes(level: ClinicalRiskAssessment['level'], isDemo: boolean): string {

  const prefix = isDemo ? '[DEMO] ' : '';

  const labels: Record<ClinicalRiskAssessment['level'], string> = {

    unknown: 'Date glicemice insuficiente pentru evaluare',

    low: 'Niciun semnal metabolic/diabet ridicat detectat',

    moderate: 'Semnale metabolice/diabet moderate — revizuire recomandată',

    elevated: 'Semnale metabolice/diabet ridicate — revizuire prioritară',

  };

  return `${prefix}diabetes: ${labels[level]}`;

}

