/**
 * Phase 2.1 — parity between legacy report wrappers and participant-view builders.
 * Run: npm run test:report
 */
import { GOLDEN_SCENARIO_IDS } from '../report/fixtures/scenario-types';
import { loadScenario } from '../report/fixtures/load-fixtures';
import {
  buildPremiumMeasurementRows,
} from '../report/report-measurement-interpretation';
import { buildScreeningObservations as legacyBuildScreeningObservations } from '../report/report-screening-observations';
import {
  buildMeasurementRows,
  buildParticipantFindingLabels,
  buildParticipantViewMeasurementsAndFindings,
  buildScreeningObservations,
} from './participant-view';

function assert(name: string, ok: boolean, detail = ''): void {
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
}

function rowsEqual(
  left: ReturnType<typeof buildMeasurementRows>,
  right: ReturnType<typeof buildPremiumMeasurementRows>,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

for (const scenarioId of GOLDEN_SCENARIO_IDS) {
  const fixture = loadScenario(scenarioId);
  const input = {
    measurements: fixture.measurements,
    anamnesis: fixture.anamnesis,
    participant: { gender: fixture.participant.gender },
  };

  const legacyRows = buildPremiumMeasurementRows(fixture.measurements, fixture.participant.gender);
  const newRows = buildMeasurementRows(fixture.measurements, fixture.participant.gender);
  assert(`${scenarioId}: measurement rows parity`, rowsEqual(newRows, legacyRows));

  const legacyObservations = legacyBuildScreeningObservations(input);
  const newObservations = buildScreeningObservations(input);
  assert(
    `${scenarioId}: screening observations parity`,
    JSON.stringify(legacyObservations) === JSON.stringify(newObservations),
  );

  const legacyFindingLabels = buildParticipantFindingLabels(legacyObservations);
  const newFindingLabels = buildParticipantFindingLabels(newObservations);
  assert(
    `${scenarioId}: finding labels parity`,
    JSON.stringify(legacyFindingLabels) === JSON.stringify(newFindingLabels),
  );

  const orchestrated = buildParticipantViewMeasurementsAndFindings(input);
  assert(
    `${scenarioId}: orchestrator rows`,
    rowsEqual(orchestrated.measurementRows, legacyRows),
  );
  assert(
    `${scenarioId}: orchestrator observations`,
    JSON.stringify(orchestrated.screeningObservations) === JSON.stringify(legacyObservations),
  );
  assert(
    `${scenarioId}: orchestrator finding labels`,
    JSON.stringify(orchestrated.findingLabels) === JSON.stringify(legacyFindingLabels),
  );
}

console.log('\nPhase 2.1 participant-view parity tests complete.');
