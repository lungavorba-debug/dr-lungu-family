import { prisma } from '../prisma.client';
import { Prisma } from '@prisma/client';
import type {
  OperatorFieldReview,
  ScreeningAiSessionStatus,
  ScreeningExtractionResult,
  TranscriptSegmentRecord,
} from '@medscreen/types';
import type {
  ScreeningAiSessionEntity,
  ScreeningAiSessionRepository,
} from '../../../domain/repositories/screening-ai-session.repository';

function mapRecord(row: {
  id: string;
  operatorId: string;
  campaignId: string | null;
  screeningId: string | null;
  status: string;
  transcript: unknown;
  extraction: unknown;
  operatorReview: unknown;
  providerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ScreeningAiSessionEntity {
  return {
    id: row.id,
    operatorId: row.operatorId,
    campaignId: row.campaignId,
    screeningId: row.screeningId,
    status: row.status as ScreeningAiSessionStatus,
    transcript: (row.transcript as TranscriptSegmentRecord[]) ?? [],
    extraction: (row.extraction as ScreeningExtractionResult | null) ?? null,
    operatorReview: (row.operatorReview as OperatorFieldReview[]) ?? [],
    providerId: row.providerId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaScreeningAiSessionRepository implements ScreeningAiSessionRepository {
  async create(input: {
    operatorId: string;
    campaignId?: string | null;
  }): Promise<ScreeningAiSessionEntity> {
    const row = await prisma.screeningAiSession.create({
      data: {
        operatorId: input.operatorId,
        campaignId: input.campaignId ?? null,
        status: 'active',
        transcript: [],
        operatorReview: [],
      },
    });
    return mapRecord(row);
  }

  async getById(id: string): Promise<ScreeningAiSessionEntity | null> {
    const row = await prisma.screeningAiSession.findUnique({ where: { id } });
    return row ? mapRecord(row) : null;
  }

  async updateTranscript(
    id: string,
    transcript: TranscriptSegmentRecord[],
    status: ScreeningAiSessionStatus = 'active',
  ): Promise<ScreeningAiSessionEntity> {
    const row = await prisma.screeningAiSession.update({
      where: { id },
      data: { transcript: transcript as unknown as Prisma.InputJsonValue, status },
    });
    return mapRecord(row);
  }

  async updateExtraction(
    id: string,
    extraction: ScreeningExtractionResult,
    providerId: string | null,
    status: ScreeningAiSessionStatus = 'review',
  ): Promise<ScreeningAiSessionEntity> {
    const row = await prisma.screeningAiSession.update({
      where: { id },
      data: {
        extraction: extraction as unknown as Prisma.InputJsonValue,
        providerId,
        status,
      },
    });
    return mapRecord(row);
  }

  async updateReview(
    id: string,
    reviews: OperatorFieldReview[],
    status: ScreeningAiSessionStatus = 'completed',
  ): Promise<ScreeningAiSessionEntity> {
    const row = await prisma.screeningAiSession.update({
      where: { id },
      data: {
        operatorReview: reviews as unknown as Prisma.InputJsonValue,
        status,
      },
    });
    return mapRecord(row);
  }

  async linkScreening(id: string, screeningId: string): Promise<ScreeningAiSessionEntity> {
    const row = await prisma.screeningAiSession.update({
      where: { id },
      data: {
        screeningId,
        status: 'completed',
      },
    });
    return mapRecord(row);
  }
}
