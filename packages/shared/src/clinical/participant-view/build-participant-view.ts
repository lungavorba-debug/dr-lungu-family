import type { MedicalMeasurements, PatientGender, ScreeningAnamnesis } from '@medscreen/types';

import type { PremiumMeasurementRow } from './build-measurement-rows';
import { buildMeasurementRows } from './build-measurement-rows';
import { buildParticipantFindingLabels, buildScreeningObservations } from './build-findings';

export interface ParticipantViewMeasurementsAndFindingsInput {
  measurements: MedicalMeasurements;
  anamnesis: ScreeningAnamnesis;
  participant: { gender: PatientGender };
}

/** Phase 2.1 — measurements + findings only (summary/recommendations/education in 2.2). */
export interface ParticipantViewMeasurementsAndFindings {
  measurementRows: PremiumMeasurementRow[];
  screeningObservations: string[];
  findingLabels: string[];
}

export function buildParticipantViewMeasurementsAndFindings(
  input: ParticipantViewMeasurementsAndFindingsInput,
): ParticipantViewMeasurementsAndFindings {
  const screeningObservations = buildScreeningObservations(input);

  return {
    measurementRows: buildMeasurementRows(input.measurements, input.participant.gender),
    screeningObservations,
    findingLabels: buildParticipantFindingLabels(screeningObservations),
  };
}
