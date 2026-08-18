import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  GOLDEN_SCENARIO_IDS,
  type GoldenScenarioFixture,
  type GoldenScenarioId,
} from './scenario-types';
import { calculateIdealWeight } from '../../schemas/measurements.schema';

export { GOLDEN_SCENARIO_IDS, type GoldenScenarioFixture, type GoldenScenarioId };

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'scenarios');

const SMOKING_STATUSES = new Set(['never', 'former', 'current', '']);
const GLUCOSE_STATUSES = new Set(['fasting', 'non_fasting', '']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Invalid ${field}: expected non-empty string`);
  }
  return value;
}

function assertOptionalString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Invalid ${field}: expected string`);
  }
  return value;
}

function assertBooleanOrNull(value: unknown, field: string): boolean | null {
  if (value === null || typeof value === 'boolean') return value;
  throw new Error(`Invalid ${field}: expected boolean or null`);
}

function assertNumberOrNull(value: unknown, field: string): number | null {
  if (value === null || typeof value === 'number') return value;
  throw new Error(`Invalid ${field}: expected number or null`);
}

export function validateGoldenScenarioFixture(data: unknown): GoldenScenarioFixture {
  if (!isRecord(data)) throw new Error('Fixture must be a JSON object');

  const id = assertString(data.id, 'id') as GoldenScenarioId;
  if (!GOLDEN_SCENARIO_IDS.includes(id)) {
    throw new Error(`Unknown scenario id: ${id}`);
  }

  const captured_at = assertString(data.captured_at, 'captured_at');
  if (Number.isNaN(Date.parse(captured_at))) {
    throw new Error('Invalid captured_at: expected ISO date string');
  }

  if (!isRecord(data.participant)) throw new Error('Invalid participant');
  if (!isRecord(data.campaign)) throw new Error('Invalid campaign');
  if (!isRecord(data.measurements)) throw new Error('Invalid measurements');
  if (!isRecord(data.anamnesis)) throw new Error('Invalid anamnesis');

  const gender = assertString(data.participant.gender, 'participant.gender');
  if (gender !== 'M' && gender !== 'F') {
    throw new Error('Invalid participant.gender: expected M or F');
  }

  const age = data.participant.age;
  if (typeof age !== 'number' || age <= 0) {
    throw new Error('Invalid participant.age: expected positive number');
  }

  const glucoseStatus = assertString(data.measurements.blood_glucose_status, 'blood_glucose_status');
  if (!GLUCOSE_STATUSES.has(glucoseStatus)) {
    throw new Error('Invalid blood_glucose_status');
  }

  const smokingStatus = assertString(data.anamnesis.smoking_status, 'smoking_status');
  if (!SMOKING_STATUSES.has(smokingStatus)) {
    throw new Error('Invalid smoking_status');
  }

  return {
    id,
    screening_id: assertString(data.screening_id, 'screening_id'),
    patient_id: assertString(data.patient_id, 'patient_id'),
    campaign_id: assertString(data.campaign_id, 'campaign_id'),
    captured_at,
    participant: {
      first_name: assertString(data.participant.first_name, 'participant.first_name'),
      last_name: assertString(data.participant.last_name, 'participant.last_name'),
      gender,
      age,
    },
    campaign: {
      name: assertString(data.campaign.name, 'campaign.name'),
      edition: typeof data.campaign.edition === 'string' ? data.campaign.edition : null,
      description: typeof data.campaign.description === 'string' ? data.campaign.description : null,
      work_point: assertString(data.campaign.work_point, 'campaign.work_point'),
    },
    operatorName: assertString(data.operatorName, 'operatorName'),
    measurements: {
      systolic_bp: assertNumberOrNull(data.measurements.systolic_bp, 'systolic_bp'),
      diastolic_bp: assertNumberOrNull(data.measurements.diastolic_bp, 'diastolic_bp'),
      pulse: assertNumberOrNull(data.measurements.pulse, 'pulse'),
      oxygen_saturation: assertNumberOrNull(data.measurements.oxygen_saturation, 'oxygen_saturation'),
      blood_glucose: assertNumberOrNull(data.measurements.blood_glucose, 'blood_glucose'),
      blood_glucose_status: glucoseStatus as GoldenScenarioFixture['measurements']['blood_glucose_status'],
      weight_kg: assertNumberOrNull(data.measurements.weight_kg, 'weight_kg'),
      height_cm: assertNumberOrNull(data.measurements.height_cm, 'height_cm'),
      bmi: assertNumberOrNull(data.measurements.bmi, 'bmi'),
      ideal_weight_kg: calculateIdealWeight(
        assertNumberOrNull(data.measurements.height_cm, 'height_cm'),
        gender,
      ),
      waist_circumference_cm: assertNumberOrNull(data.measurements.waist_circumference_cm, 'waist_circumference_cm'),
      known_hypertension: assertBooleanOrNull(data.measurements.known_hypertension, 'known_hypertension'),
      known_diabetes: assertBooleanOrNull(data.measurements.known_diabetes, 'known_diabetes'),
      current_antihypertensive_treatment: assertBooleanOrNull(
        data.measurements.current_antihypertensive_treatment,
        'current_antihypertensive_treatment',
      ),
    },
    anamnesis: {
      smoking_status: smokingStatus as GoldenScenarioFixture['anamnesis']['smoking_status'],
      alcohol_consumption: assertString(
        data.anamnesis.alcohol_consumption,
        'alcohol_consumption',
      ) as GoldenScenarioFixture['anamnesis']['alcohol_consumption'],
      known_diabetes: assertBooleanOrNull(data.anamnesis.known_diabetes, 'known_diabetes'),
      chest_pain: assertBooleanOrNull(data.anamnesis.chest_pain, 'chest_pain'),
      dyspnea: assertBooleanOrNull(data.anamnesis.dyspnea, 'dyspnea'),
      snoring: assertBooleanOrNull(data.anamnesis.snoring, 'snoring'),
      current_treatment: assertOptionalString(data.anamnesis.current_treatment, 'current_treatment'),
      free_notes: assertOptionalString(data.anamnesis.free_notes, 'free_notes'),
    },
  };
}

export function loadScenario(id: GoldenScenarioId): GoldenScenarioFixture {
  const path = join(fixturesDir, `${id}.json`);
  const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  const fixture = validateGoldenScenarioFixture(raw);
  if (fixture.id !== id) {
    throw new Error(`Fixture id mismatch: file ${id}.json contains id ${fixture.id}`);
  }
  return fixture;
}

export function loadAllScenarios(): GoldenScenarioFixture[] {
  return GOLDEN_SCENARIO_IDS.map((id) => loadScenario(id));
}

function runCli(): void {
  let failed = false;
  for (const id of GOLDEN_SCENARIO_IDS) {
    try {
      const fixture = loadScenario(id);
      console.log(`✔ ${id} — ${fixture.participant.first_name} ${fixture.participant.last_name}`);
    } catch (error) {
      failed = true;
      const message = error instanceof Error ? error.message : String(error);
      console.log(`✗ ${id} — ${message}`);
    }
  }
  if (failed) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runCli();
}
