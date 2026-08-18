import type {
  CampaignRepository,
  CampaignRecord,
  CreateCampaignData,
  ListCampaignsParams,
  UpdateCampaignData,
} from '../../../domain/repositories/campaign.repository';
import { CAMPAIGN_STATUSES, type CampaignStatus } from '@medscreen/types';
import { prisma } from '../prisma.client';
import { Prisma } from '@prisma/client';

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfTomorrow(): Date {
  const start = startOfToday();
  start.setDate(start.getDate() + 1);
  return start;
}

function hasCriticalWarnings(clinicalEvaluation: unknown): boolean {
  if (!clinicalEvaluation || typeof clinicalEvaluation !== 'object') {
    return false;
  }

  const warnings = (clinicalEvaluation as { warnings?: unknown[] }).warnings;
  if (!Array.isArray(warnings)) {
    return false;
  }

  return warnings.some(
    (warning) =>
      warning &&
      typeof warning === 'object' &&
      (warning as { severity?: string }).severity === 'critical',
  );
}

function mapRecord(record: {
  id: string;
  name: string;
  workPoint: string;
  edition: string | null;
  description: string | null;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  status: string;
  organizer: string | null;
  screeningType: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): CampaignRecord {
  return {
    ...record,
    status: record.status as CampaignStatus,
  };
}

export class PrismaCampaignRepository implements CampaignRepository {
  async findActiveCampaigns(): Promise<CampaignRecord[]> {
    const rows = await prisma.campaign.findMany({
      where: {
        isActive: true,
        status: CAMPAIGN_STATUSES.ACTIVE,
      },
      orderBy: [{ startDate: 'asc' }, { name: 'asc' }],
    });
    return rows.map(mapRecord);
  }

  async findById(id: string): Promise<CampaignRecord | null> {
    const row = await prisma.campaign.findUnique({ where: { id } });
    return row ? mapRecord(row) : null;
  }

  async findByStatus(status: CampaignStatus): Promise<CampaignRecord[]> {
    const rows = await prisma.campaign.findMany({
      where: { status },
      orderBy: [{ startDate: 'asc' }, { name: 'asc' }],
    });
    return rows.map(mapRecord);
  }

  async findOtherActiveCampaign(excludeId?: string): Promise<CampaignRecord | null> {
    const row = await prisma.campaign.findFirst({
      where: {
        status: CAMPAIGN_STATUSES.ACTIVE,
        isActive: true,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return row ? mapRecord(row) : null;
  }

  async list(params: ListCampaignsParams): Promise<{ items: CampaignRecord[]; total: number }> {
    const where = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' as const } },
              { workPoint: { contains: params.search, mode: 'insensitive' as const } },
              { organizer: { contains: params.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy: [{ startDate: 'desc' }, { name: 'asc' }],
        skip: params.skip,
        take: params.take,
      }),
      prisma.campaign.count({ where }),
    ]);

    return { items: rows.map(mapRecord), total };
  }

  async create(data: CreateCampaignData): Promise<CampaignRecord> {
    const row = await prisma.campaign.create({
      data: {
        name: data.name,
        workPoint: data.workPoint,
        edition: data.edition ?? null,
        description: data.description ?? null,
        startDate: data.startDate,
        endDate: data.endDate,
        organizer: data.organizer ?? null,
        screeningType: data.screeningType ?? null,
        notes: data.notes ?? null,
        status: CAMPAIGN_STATUSES.UPCOMING,
        isActive: false,
      },
    });
    return mapRecord(row);
  }

  async update(id: string, data: UpdateCampaignData): Promise<CampaignRecord> {
    const row = await prisma.campaign.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.workPoint !== undefined ? { workPoint: data.workPoint } : {}),
        ...(data.edition !== undefined ? { edition: data.edition } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
        ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
        ...(data.organizer !== undefined ? { organizer: data.organizer } : {}),
        ...(data.screeningType !== undefined ? { screeningType: data.screeningType } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
    });
    return mapRecord(row);
  }

  async setStatus(id: string, status: CampaignStatus, isActive: boolean): Promise<CampaignRecord> {
    const row = await prisma.campaign.update({
      where: { id },
      data: { status, isActive },
    });
    return mapRecord(row);
  }

  async countCompletedScreenings(campaignId: string): Promise<number> {
    return prisma.screening.count({
      where: {
        campaignId,
        status: 'completed',
        completedAt: { not: null },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.campaign.delete({ where: { id } });
  }

  async countScreeningsToday(campaignId: string, operatorId?: string): Promise<number> {
    return prisma.screening.count({
      where: {
        campaignId,
        ...(operatorId ? { operatorId } : {}),
        createdAt: {
          gte: startOfToday(),
          lt: startOfTomorrow(),
        },
      },
    });
  }

  async countCriticalCases(campaignId: string): Promise<number> {
    const rows = await prisma.screening.findMany({
      where: {
        campaignId,
        status: 'completed',
        clinicalEvaluation: { not: Prisma.DbNull },
      },
      select: {
        clinicalEvaluation: true,
      },
    });

    return rows.filter((row) => hasCriticalWarnings(row.clinicalEvaluation)).length;
  }

  async getScreeningTrend(
    campaignId: string,
    days: number,
  ): Promise<Array<{ date: string; count: number }>> {
    const start = startOfToday();
    start.setDate(start.getDate() - (days - 1));

    const rows = await prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
      SELECT DATE("created_at") AS day, COUNT(*)::bigint AS count
      FROM "screenings"
      WHERE "campaign_id" = ${campaignId}::uuid
        AND "created_at" >= ${start}
      GROUP BY DATE("created_at")
      ORDER BY day ASC
    `;

    return rows.map((row) => ({
      date: row.day.toISOString().slice(0, 10),
      count: Number(row.count),
    }));
  }

  async getOperatorActivityToday(
    campaignId: string,
  ): Promise<Array<{ operatorId: string; operatorFirstName: string; operatorLastName: string; count: number }>> {
    const rows = await prisma.screening.groupBy({
      by: ['operatorId'],
      where: {
        campaignId,
        createdAt: {
          gte: startOfToday(),
          lt: startOfTomorrow(),
        },
      },
      _count: {
        _all: true,
      },
    });

    const sortedRows = [...rows].sort((a, b) => b._count._all - a._count._all).slice(0, 10);

    if (sortedRows.length === 0) {
      return [];
    }

    const operators = await prisma.user.findMany({
      where: {
        id: { in: sortedRows.map((row) => row.operatorId) },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    const operatorMap = new Map(operators.map((operator) => [operator.id, operator]));

    return sortedRows.map((row) => {
      const operator = operatorMap.get(row.operatorId);
      return {
        operatorId: row.operatorId,
        operatorFirstName: operator?.firstName ?? '—',
        operatorLastName: operator?.lastName ?? '',
        count: row._count._all,
      };
    });
  }
}
