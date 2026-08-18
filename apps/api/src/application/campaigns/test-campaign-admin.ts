/**
 * Campaign administration use case tests.
 * Run: npm run test:campaigns
 */
import { CAMPAIGN_STATUSES, type CampaignStatus } from '@medscreen/types';
import {
  ActivateCampaignUseCase,
  ArchiveCampaignUseCase,
  CloseCampaignUseCase,
  CreateCampaignUseCase,
  DeleteCampaignUseCase,
  GetCampaignDashboardSummaryUseCase,
  ListCampaignsAdminUseCase,
  UpdateCampaignUseCase,
} from './campaign-admin.use-cases';
import { AppError } from '../../lib/app-error';
import type {
  CampaignRecord,
  CampaignRepository,
  CreateCampaignData,
  ListCampaignsParams,
  UpdateCampaignData,
} from '../../domain/repositories/campaign.repository';

function assert(name: string, ok: boolean, detail = ''): void {
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
}

function assertThrowsCode(
  name: string,
  run: () => Promise<unknown>,
  expectedCode: string,
): Promise<void> {
  return run()
    .then(() => {
      assert(name, false, `expected ${expectedCode}`);
    })
    .catch((error: unknown) => {
      if (error instanceof AppError) {
        assert(name, error.errorCode === expectedCode, error.errorCode);
        return;
      }
      assert(name, false, error instanceof Error ? error.message : 'unknown error');
    });
}

function makeCampaign(
  overrides: Partial<CampaignRecord> & Pick<CampaignRecord, 'id' | 'name'>,
): CampaignRecord {
  const now = new Date('2026-08-01T00:00:00.000Z');
  return {
    workPoint: 'Locație test',
    edition: null,
    description: null,
    startDate: new Date('2026-08-01T00:00:00.000Z'),
    endDate: new Date('2026-08-05T00:00:00.000Z'),
    isActive: false,
    status: CAMPAIGN_STATUSES.UPCOMING,
    organizer: null,
    screeningType: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

class InMemoryCampaignRepository implements CampaignRepository {
  private campaigns = new Map<string, CampaignRecord>();
  private completedScreenings = new Map<string, number>();

  seed(campaign: CampaignRecord, completedScreenings = 0): void {
    this.campaigns.set(campaign.id, { ...campaign });
    if (completedScreenings > 0) {
      this.completedScreenings.set(campaign.id, completedScreenings);
    }
  }

  async findActiveCampaigns(): Promise<CampaignRecord[]> {
    return [...this.campaigns.values()].filter(
      (campaign) => campaign.status === CAMPAIGN_STATUSES.ACTIVE && campaign.isActive,
    );
  }

  async findById(id: string): Promise<CampaignRecord | null> {
    const campaign = this.campaigns.get(id);
    return campaign ? { ...campaign } : null;
  }

  async findByStatus(status: CampaignStatus): Promise<CampaignRecord[]> {
    return [...this.campaigns.values()]
      .filter((campaign) => campaign.status === status)
      .map((campaign) => ({ ...campaign }));
  }

  async findOtherActiveCampaign(excludeId?: string): Promise<CampaignRecord | null> {
    for (const campaign of this.campaigns.values()) {
      if (
        campaign.id !== excludeId &&
        campaign.status === CAMPAIGN_STATUSES.ACTIVE &&
        campaign.isActive
      ) {
        return { ...campaign };
      }
    }
    return null;
  }

  async list(params: ListCampaignsParams): Promise<{ items: CampaignRecord[]; total: number }> {
    let items = [...this.campaigns.values()];
    if (params.status) {
      items = items.filter((campaign) => campaign.status === params.status);
    }
    if (params.search) {
      const needle = params.search.toLowerCase();
      items = items.filter(
        (campaign) =>
          campaign.name.toLowerCase().includes(needle) ||
          campaign.workPoint.toLowerCase().includes(needle),
      );
    }
    const total = items.length;
    items = items.slice(params.skip, params.skip + params.take);
    return { items: items.map((campaign) => ({ ...campaign })), total };
  }

  async create(data: CreateCampaignData): Promise<CampaignRecord> {
    const id = `campaign-${this.campaigns.size + 1}`;
    const now = new Date('2026-08-01T00:00:00.000Z');
    const campaign: CampaignRecord = {
      id,
      name: data.name,
      workPoint: data.workPoint,
      edition: data.edition ?? null,
      description: data.description ?? null,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: false,
      status: CAMPAIGN_STATUSES.UPCOMING,
      organizer: data.organizer ?? null,
      screeningType: data.screeningType ?? null,
      notes: data.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.campaigns.set(id, campaign);
    return { ...campaign };
  }

  async update(id: string, data: UpdateCampaignData): Promise<CampaignRecord> {
    const current = this.campaigns.get(id);
    if (!current) {
      throw new Error('Campaign not found');
    }
    const updated: CampaignRecord = {
      ...current,
      name: data.name ?? current.name,
      workPoint: data.workPoint ?? current.workPoint,
      edition: data.edition === undefined ? current.edition : data.edition,
      description: data.description === undefined ? current.description : data.description,
      startDate: data.startDate ?? current.startDate,
      endDate: data.endDate ?? current.endDate,
      organizer: data.organizer === undefined ? current.organizer : data.organizer,
      screeningType: data.screeningType === undefined ? current.screeningType : data.screeningType,
      notes: data.notes === undefined ? current.notes : data.notes,
      updatedAt: new Date('2026-08-02T00:00:00.000Z'),
    };
    this.campaigns.set(id, updated);
    return { ...updated };
  }

  async setStatus(id: string, status: CampaignStatus, isActive: boolean): Promise<CampaignRecord> {
    const current = this.campaigns.get(id);
    if (!current) {
      throw new Error('Campaign not found');
    }
    const updated = { ...current, status, isActive, updatedAt: new Date('2026-08-02T00:00:00.000Z') };
    this.campaigns.set(id, updated);
    return { ...updated };
  }

  async countCompletedScreenings(campaignId: string): Promise<number> {
    return this.completedScreenings.get(campaignId) ?? 0;
  }

  async delete(id: string): Promise<void> {
    this.campaigns.delete(id);
  }

  async countScreeningsToday(): Promise<number> {
    return 0;
  }

  async countCriticalCases(): Promise<number> {
    return 0;
  }

  async getScreeningTrend(): Promise<Array<{ date: string; count: number }>> {
    return [];
  }

  async getOperatorActivityToday(): Promise<
    Array<{ operatorId: string; operatorFirstName: string; operatorLastName: string; count: number }>
  > {
    return [];
  }
}

async function run(): Promise<void> {
  const repo = new InMemoryCampaignRepository();
  repo.seed(
    makeCampaign({
      id: 'active-1',
      name: 'Campanie activă',
      status: CAMPAIGN_STATUSES.ACTIVE,
      isActive: true,
    }),
  );
  repo.seed(
    makeCampaign({
      id: 'upcoming-1',
      name: 'Campanie programată',
      status: CAMPAIGN_STATUSES.UPCOMING,
    }),
  );
  repo.seed(
    makeCampaign({
      id: 'closed-1',
      name: 'Campanie închisă',
      status: CAMPAIGN_STATUSES.CLOSED,
    }),
  );
  repo.seed(
    makeCampaign({
      id: 'with-screenings',
      name: 'Campanie cu screeninguri',
      status: CAMPAIGN_STATUSES.CLOSED,
    }),
    3,
  );

  const createUseCase = new CreateCampaignUseCase(repo);
  const updateUseCase = new UpdateCampaignUseCase(repo);
  const activateUseCase = new ActivateCampaignUseCase(repo);
  const closeUseCase = new CloseCampaignUseCase(repo);
  const archiveUseCase = new ArchiveCampaignUseCase(repo);
  const deleteUseCase = new DeleteCampaignUseCase(repo);
  const listUseCase = new ListCampaignsAdminUseCase(repo);
  const summaryUseCase = new GetCampaignDashboardSummaryUseCase(repo);

  const created = await createUseCase.execute({
    name: 'Campanie nouă',
    start_date: '2026-09-01',
    end_date: '2026-09-05',
    location: 'Pitești',
    organizer: 'MedScreen',
    screening_type: 'Cardiovascular',
    description: 'Test',
    notes: 'Note interne',
  });
  assert('create campaign sets upcoming status', created.campaign.status === CAMPAIGN_STATUSES.UPCOMING);
  assert('create campaign maps location', created.campaign.location === 'Pitești');

  const updated = await updateUseCase.execute(created.campaign.id, {
    name: 'Campanie actualizată',
    location: 'Curtea de Argeș',
  });
  assert('update campaign changes name', updated.campaign.name === 'Campanie actualizată');
  assert('update campaign changes location', updated.campaign.location === 'Curtea de Argeș');

  await assertThrowsCode(
    'activate rejects when another active campaign exists',
    () => activateUseCase.execute(created.campaign.id),
    'ACTIVE_CAMPAIGN_EXISTS',
  );

  const closedActive = await closeUseCase.execute('active-1');
  assert('close active campaign', closedActive.campaign.status === CAMPAIGN_STATUSES.CLOSED);

  const activated = await activateUseCase.execute(created.campaign.id);
  assert('activate upcoming campaign', activated.campaign.status === CAMPAIGN_STATUSES.ACTIVE);
  assert('activate sets is_active true', activated.campaign.is_active === true);

  await assertThrowsCode(
    'archive rejects active campaign',
    () => archiveUseCase.execute(created.campaign.id),
    'INVALID_PARAMETER',
  );

  const archivedClosed = await archiveUseCase.execute('closed-1');
  assert('archive closed campaign', archivedClosed.campaign.status === CAMPAIGN_STATUSES.ARCHIVED);

  await assertThrowsCode(
    'update rejects archived campaign',
    () => updateUseCase.execute('closed-1', { name: 'Nu se poate' }),
    'INVALID_PARAMETER',
  );

  await assertThrowsCode(
    'delete rejects active campaign',
    () => deleteUseCase.execute(created.campaign.id),
    'INVALID_PARAMETER',
  );

  await assertThrowsCode(
    'delete rejects campaign with completed screenings',
    () => deleteUseCase.execute('with-screenings'),
    'CAMPAIGN_HAS_SCREENINGS',
  );

  const deleted = await deleteUseCase.execute('upcoming-1');
  assert('delete campaign without screenings', deleted.success === true);

  const list = await listUseCase.execute({ page: 1, limit: 10, status: CAMPAIGN_STATUSES.ACTIVE });
  assert('list admin filters active campaigns', list.campaigns.every((item) => item.status === CAMPAIGN_STATUSES.ACTIVE));

  const summary = await summaryUseCase.execute();
  assert('dashboard summary includes active bucket', summary.active.length >= 1);
  assert('dashboard summary includes closed bucket', summary.closed.length >= 1);
}

void run();
