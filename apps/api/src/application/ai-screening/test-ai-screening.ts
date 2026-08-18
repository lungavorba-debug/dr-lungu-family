/**
 * Run: npm run test:ai-screening
 */
import assert from 'node:assert/strict';
import type {
  OperatorFieldReview,
  ScreeningAiSessionStatus,
  ScreeningExtractionResult,
  TranscriptSegmentRecord,
} from '@medscreen/types';
import type { ClinicSettingsRecord } from '@medscreen/types';
import {
  CreateScreeningAiSessionUseCase,
  ExtractScreeningUseCase,
  GetAiAvailabilityUseCase,
  ReviewScreeningExtractionUseCase,
  SyncTranscriptUseCase,
} from './ai-screening.use-cases';
import type {
  ScreeningAiSessionEntity,
  ScreeningAiSessionRepository,
} from '../../domain/repositories/screening-ai-session.repository';
import { ClinicSettingsResolver } from '../../infrastructure/clinic-settings/clinic-settings.resolver';
import type { ClinicSettingsRepository } from '../../domain/repositories/clinic-settings.repository';
import { cloneDefaultClinicSettings } from '@medscreen/shared';

function test(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve(fn()).then(
    () => console.log(`  ✓ ${name}`),
    (error) => {
      console.error(`  ✗ ${name}`);
      throw error;
    },
  );
}

class InMemoryAiSessionRepository implements ScreeningAiSessionRepository {
  private sessions = new Map<string, ScreeningAiSessionEntity>();

  async create(input: { operatorId: string; campaignId?: string | null }) {
    const now = new Date();
    const session: ScreeningAiSessionEntity = {
      id: crypto.randomUUID(),
      operatorId: input.operatorId,
      campaignId: input.campaignId ?? null,
      screeningId: null,
      status: 'active',
      transcript: [],
      extraction: null,
      operatorReview: [],
      providerId: null,
      createdAt: now,
      updatedAt: now,
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async getById(id: string) {
    return this.sessions.get(id) ?? null;
  }

  async updateTranscript(
    id: string,
    transcript: TranscriptSegmentRecord[],
    status: ScreeningAiSessionStatus = 'active',
  ) {
    const session = this.sessions.get(id);
    assert.ok(session);
    const updated: ScreeningAiSessionEntity = {
      ...session,
      transcript,
      status,
      updatedAt: new Date(),
    };
    this.sessions.set(id, updated);
    return updated;
  }

  async updateExtraction(
    id: string,
    extraction: ScreeningExtractionResult,
    providerId: string | null,
    status: ScreeningAiSessionStatus = 'review',
  ) {
    const session = this.sessions.get(id);
    assert.ok(session);
    const updated: ScreeningAiSessionEntity = {
      ...session,
      extraction,
      providerId,
      status,
      updatedAt: new Date(),
    };
    this.sessions.set(id, updated);
    return updated;
  }

  async updateReview(
    id: string,
    reviews: OperatorFieldReview[],
    status: ScreeningAiSessionStatus = 'completed',
  ) {
    const session = this.sessions.get(id);
    assert.ok(session);
    const updated: ScreeningAiSessionEntity = {
      ...session,
      operatorReview: reviews,
      status,
      updatedAt: new Date(),
    };
    this.sessions.set(id, updated);
    return updated;
  }

  async linkScreening(id: string, screeningId: string) {
    const session = this.sessions.get(id);
    assert.ok(session);
    const updated: ScreeningAiSessionEntity = {
      ...session,
      screeningId,
      status: 'completed',
      updatedAt: new Date(),
    };
    this.sessions.set(id, updated);
    return updated;
  }
}

class StubClinicSettingsRepository implements ClinicSettingsRepository {
  async get() {
    return null;
  }

  async upsert(settings: ClinicSettingsRecord) {
    return {
      id: 'default',
      clinicInfo: settings.clinic,
      branding: settings.branding,
      contact: settings.contact,
      logo: settings.logo,
      footer: settings.footer,
      pdf: settings.pdf,
      qr: settings.qr,
      smtp: settings.smtp,
      whatsapp: settings.whatsapp,
      ai: settings.ai,
      application: settings.application,
      updatedAt: new Date(),
      updatedById: null,
      updatedByName: null,
    };
  }

  async updateSection(
    section: keyof ClinicSettingsRecord,
    data: ClinicSettingsRecord[keyof ClinicSettingsRecord],
  ) {
    const settings = cloneDefaultClinicSettings();
    return this.upsert({ ...settings, [section]: data });
  }
}

async function main() {
  const repository = new InMemoryAiSessionRepository();
  const resolver = new ClinicSettingsResolver(new StubClinicSettingsRepository());

  await test('availability false when AI disabled', async () => {
    const useCase = new GetAiAvailabilityUseCase(resolver);
    const result = await useCase.execute();
    assert.equal(result.available, false);
    assert.equal(result.provider, null);
  });

  await test('create session and sync transcript', async () => {
    const create = new CreateScreeningAiSessionUseCase(repository);
    const sync = new SyncTranscriptUseCase(repository);
    const session = await create.execute('operator-1', { campaign_id: 'camp-1' });
    const synced = await sync.execute(session.id, 'operator-1', {
      segments: [{ id: '1', text: 'Salut', timestamp: Date.now(), source: 'participant' }],
    });
    assert.equal(synced.transcript.length, 1);
  });

  await test('extract screening returns empty without meaningful transcript', async () => {
    const create = new CreateScreeningAiSessionUseCase(repository);
    const sync = new SyncTranscriptUseCase(repository);
    const extract = new ExtractScreeningUseCase(repository, resolver);
    const session = await create.execute('operator-1', {});
    await sync.execute(session.id, 'operator-1', {
      segments: [{ id: '1', text: 'da nu', timestamp: Date.now(), source: 'participant' }],
    });
    const extraction = await extract.execute(session.id, 'operator-1', {});
    assert.equal(Object.keys(extraction.fields).length, 0);
    assert.equal(extraction.provider_id, 'none');
  });

  await test('extract screening with heuristic fallback', async () => {
    const create = new CreateScreeningAiSessionUseCase(repository);
    const sync = new SyncTranscriptUseCase(repository);
    const extract = new ExtractScreeningUseCase(repository, resolver);
    const session = await create.execute('operator-1', {});
    await sync.execute(session.id, 'operator-1', {
      segments: [
        {
          id: '1',
          text: 'Participant 0722123456, 50 ani, feminin',
          timestamp: Date.now(),
          source: 'participant',
        },
      ],
    });
    const extraction = await extract.execute(session.id, 'operator-1', {});
    assert.ok(extraction.fields.phone);
    assert.equal(extraction.provider_id, 'heuristic');
  });

  await test('save operator review', async () => {
    const create = new CreateScreeningAiSessionUseCase(repository);
    const review = new ReviewScreeningExtractionUseCase(repository);
    const session = await create.execute('operator-1', {});
    const saved = await review.execute(session.id, 'operator-1', {
      reviews: [{ field: 'phone', accepted: true, reviewed_at: new Date().toISOString() }],
    });
    assert.equal(saved.operator_review.length, 1);
    assert.equal(saved.status, 'completed');
  });

  console.log('AI screening API tests passed.');
}

void main();
