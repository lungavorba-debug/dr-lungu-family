import type {
  CreateScreeningDeliveryData,
  ScreeningDeliveryEntity,
  ScreeningDeliveryRepository,
} from '../../../domain/repositories/screening-delivery.repository';
import { prisma } from '../prisma.client';

function mapEntity(row: {
  id: string;
  screeningId: string;
  channel: string;
  status: string;
  recipient: string;
  providerMessageId: string | null;
  errorMessage: string | null;
  attemptedAt: Date;
  sentAt: Date | null;
  operatorId: string;
}): ScreeningDeliveryEntity {
  return {
    id: row.id,
    screeningId: row.screeningId,
    channel: row.channel,
    status: row.status,
    recipient: row.recipient,
    providerMessageId: row.providerMessageId,
    errorMessage: row.errorMessage,
    attemptedAt: row.attemptedAt,
    sentAt: row.sentAt,
    operatorId: row.operatorId,
  };
}

export class PrismaScreeningDeliveryRepository implements ScreeningDeliveryRepository {
  async create(data: CreateScreeningDeliveryData): Promise<ScreeningDeliveryEntity> {
    const row = await prisma.screeningDelivery.create({
      data: {
        screeningId: data.screeningId,
        channel: data.channel,
        status: data.status,
        recipient: data.recipient,
        operatorId: data.operatorId,
        providerMessageId: data.providerMessageId ?? null,
        errorMessage: data.errorMessage ?? null,
        sentAt: data.sentAt ?? null,
      },
    });

    return mapEntity(row);
  }

  async updateStatus(
    id: string,
    data: {
      status: 'sent' | 'failed';
      providerMessageId?: string | null;
      errorMessage?: string | null;
      sentAt?: Date | null;
    },
  ): Promise<ScreeningDeliveryEntity> {
    const row = await prisma.screeningDelivery.update({
      where: { id },
      data: {
        status: data.status,
        providerMessageId: data.providerMessageId ?? null,
        errorMessage: data.errorMessage ?? null,
        sentAt: data.sentAt ?? null,
      },
    });

    return mapEntity(row);
  }

  async findByScreeningId(screeningId: string): Promise<ScreeningDeliveryEntity[]> {
    const rows = await prisma.screeningDelivery.findMany({
      where: { screeningId },
      orderBy: { attemptedAt: 'desc' },
    });

    return rows.map(mapEntity);
  }
}
