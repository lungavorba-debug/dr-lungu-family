import type {
  OperatorFieldReview,
  ScreeningAiSessionRecord,
  ScreeningAiSessionStatus,
  ScreeningExtractionResult,
  TranscriptSegmentRecord,
} from '@medscreen/types';

export interface ScreeningAiSessionEntity {
  id: string;
  operatorId: string;
  campaignId: string | null;
  screeningId: string | null;
  status: ScreeningAiSessionStatus;
  transcript: TranscriptSegmentRecord[];
  extraction: ScreeningExtractionResult | null;
  operatorReview: OperatorFieldReview[];
  providerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScreeningAiSessionRepository {
  create(input: {
    operatorId: string;
    campaignId?: string | null;
  }): Promise<ScreeningAiSessionEntity>;
  getById(id: string): Promise<ScreeningAiSessionEntity | null>;
  updateTranscript(
    id: string,
    transcript: TranscriptSegmentRecord[],
    status?: ScreeningAiSessionStatus,
  ): Promise<ScreeningAiSessionEntity>;
  updateExtraction(
    id: string,
    extraction: ScreeningExtractionResult,
    providerId: string | null,
    status?: ScreeningAiSessionStatus,
  ): Promise<ScreeningAiSessionEntity>;
  updateReview(
    id: string,
    reviews: OperatorFieldReview[],
    status?: ScreeningAiSessionStatus,
  ): Promise<ScreeningAiSessionEntity>;
  linkScreening(id: string, screeningId: string): Promise<ScreeningAiSessionEntity>;
}

export function mapSessionEntityToRecord(entity: ScreeningAiSessionEntity): ScreeningAiSessionRecord {
  return {
    id: entity.id,
    operator_id: entity.operatorId,
    campaign_id: entity.campaignId,
    screening_id: entity.screeningId,
    status: entity.status,
    transcript: entity.transcript,
    extraction: entity.extraction,
    operator_review: entity.operatorReview,
    provider_id: entity.providerId as ScreeningAiSessionRecord['provider_id'],
    created_at: entity.createdAt.toISOString(),
    updated_at: entity.updatedAt.toISOString(),
  };
}
