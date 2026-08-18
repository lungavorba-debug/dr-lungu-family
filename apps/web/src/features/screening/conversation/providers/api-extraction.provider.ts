import { flattenExtractionFields } from '@medscreen/shared';
import type { ScreeningExtractionResult } from '@medscreen/types';
import { apiClient } from '../../../../shared/lib/api-client';
import type { AiExtractionProvider, ExtractionResult } from '../types/providers';

export class ApiAiExtractionProvider implements AiExtractionProvider {
  constructor(private readonly sessionId: string) {}

  async extract(transcript: string): Promise<ExtractionResult> {
    const extraction = await apiClient.extractScreening(this.sessionId, { transcript });
    return toExtractionResult(extraction);
  }
}

export function toExtractionResult(extraction: ScreeningExtractionResult): ExtractionResult {
  return {
    fields: flattenExtractionFields(extraction) as ExtractionResult['fields'],
    extraction,
  };
}
