/**
 * Sync status conflict detection tests.
 * Run: npm run test:sync
 */
import type { ScreeningRepository, ScreeningMeasurementsRecord } from '../../domain/repositories/screening.repository';
import { GetScreeningSyncStatusUseCase } from './sync.use-cases';

function assert(name: string, ok: boolean, detail = ''): void {
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
}

class InMemoryScreeningRepository implements Pick<ScreeningRepository, 'findById'> {
  constructor(private readonly screenings: Map<string, ScreeningMeasurementsRecord>) {}

  async findById(id: string): Promise<ScreeningMeasurementsRecord | null> {
    return this.screenings.get(id) ?? null;
  }
}

function buildScreening(overrides: Partial<ScreeningMeasurementsRecord>): ScreeningMeasurementsRecord {
  return {
    id: 'screening-1',
    campaignId: 'campaign-1',
    operatorId: 'operator-1',
    patientId: 'patient-1',
    status: 'measurements',
    systolicBp: 120,
    diastolicBp: 80,
    pulse: 70,
    oxygenSaturation: 98,
    bloodGlucose: 90,
    bloodGlucoseStatus: 'fasting',
    weightKg: null,
    heightCm: null,
    bmi: null,
    waistCircumferenceCm: null,
    knownHypertension: null,
    knownDiabetes: null,
    currentAntihypertensiveTreatment: null,
    completedAt: null,
    pdfFilename: null,
    pdfStoragePath: null,
    pdfByteLength: null,
    pdfGeneratorVersion: null,
    pdfGeneratedAt: null,
    participantReport: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

async function runTests(): Promise<void> {
  {
    const useCase = new GetScreeningSyncStatusUseCase(
      new InMemoryScreeningRepository(new Map()) as unknown as ScreeningRepository,
    );
    const result = await useCase.execute({ screeningId: 'missing', operatorId: 'operator-1' });
    assert('missing screening can accept completion', result.can_accept_completion === true);
    assert('missing screening has no conflict', result.conflict === false);
  }

  {
    const screening = buildScreening({
      id: 'screening-completed',
      status: 'completed',
      completedAt: new Date(),
    });
    const useCase = new GetScreeningSyncStatusUseCase(
      new InMemoryScreeningRepository(new Map([[screening.id, screening]])) as unknown as ScreeningRepository,
    );
    const sameOperator = await useCase.execute({
      screeningId: screening.id,
      operatorId: 'operator-1',
    });
    assert('completed screening same operator is not conflict', sameOperator.conflict === false);

    const otherOperator = await useCase.execute({
      screeningId: screening.id,
      operatorId: 'operator-2',
    });
    assert('completed screening other operator is conflict', otherOperator.conflict === true);
  }

  {
    const screening = buildScreening({ id: 'screening-open', operatorId: 'operator-2' });
    const useCase = new GetScreeningSyncStatusUseCase(
      new InMemoryScreeningRepository(new Map([[screening.id, screening]])) as unknown as ScreeningRepository,
    );
    const result = await useCase.execute({ screeningId: screening.id, operatorId: 'operator-1' });
    assert('open screening other operator conflict', result.conflict === true);
  }

  console.log('\nSync status tests complete.');
}

void runTests();
