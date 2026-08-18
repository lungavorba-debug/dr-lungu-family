import { createEmptyScreeningExtraction, flattenExtractionFields } from '@medscreen/shared';
import type { AiExtractionProvider, ExtractionResult } from '../types/providers';

export class NoOpExtractionProvider implements AiExtractionProvider {
  async extract(): Promise<ExtractionResult> {
    const extraction = createEmptyScreeningExtraction();
    return {
      fields: flattenExtractionFields(extraction) as ExtractionResult['fields'],
      extraction,
    };
  }
}
