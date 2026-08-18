import type { MedicalMeasurements, PatientGender, ScreeningAnamnesis } from '@medscreen/types';



import {

  isBloodPressureElevated,

  isBmiElevated,

  isGlucoseElevated,

  isPulseAbnormal,

  isSpO2Low,

  isWaistElevated,

} from './threshold-evaluators';



export { buildParticipantFindingLabels } from './finding-labels';



export function buildScreeningObservations(input: {

  measurements: MedicalMeasurements;

  anamnesis: ScreeningAnamnesis;

  participant: { gender: PatientGender };

}): string[] {

  const { measurements, anamnesis, participant } = input;

  const observations: string[] = [];



  if (isBloodPressureElevated(measurements)) {

    observations.push('tensiune arterială crescută');

  }



  if (isBmiElevated(measurements.bmi)) {

    observations.push('exces ponderal');

  }



  if (isWaistElevated(measurements.waist_circumference_cm, participant.gender)) {

    observations.push('circumferință abdominală crescută');

  }



  if (isGlucoseElevated(measurements)) {

    observations.push('glicemie crescută');

  }



  if (isSpO2Low(measurements.oxygen_saturation)) {

    observations.push('saturație scăzută de oxigen');

  }



  if (isPulseAbnormal(measurements)) {

    observations.push('puls în afara intervalului obișnuit');

  }



  if (anamnesis.chest_pain === true) {

    observations.push('durere în piept declarată');

  }



  if (anamnesis.dyspnea === true) {

    observations.push('lipsă de aer declarată');

  }



  if (anamnesis.snoring === true) {

    observations.push('sforăit frecvent declarat');

  }



  if (anamnesis.smoking_status === 'current') {

    observations.push('fumat declarat');

  }



  return observations;

}


