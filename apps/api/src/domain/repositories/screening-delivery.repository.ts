export interface CreateScreeningDeliveryData {
  screeningId: string;
  channel: 'email' | 'whatsapp';
  status: 'pending' | 'sent' | 'failed';
  recipient: string;
  operatorId: string;
  providerMessageId?: string | null;
  errorMessage?: string | null;
  sentAt?: Date | null;
}

export interface ScreeningDeliveryEntity {
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
}

export interface ScreeningDeliveryRepository {
  create(data: CreateScreeningDeliveryData): Promise<ScreeningDeliveryEntity>;
  updateStatus(
    id: string,
    data: {
      status: 'sent' | 'failed';
      providerMessageId?: string | null;
      errorMessage?: string | null;
      sentAt?: Date | null;
    },
  ): Promise<ScreeningDeliveryEntity>;
  findByScreeningId(screeningId: string): Promise<ScreeningDeliveryEntity[]>;
}
