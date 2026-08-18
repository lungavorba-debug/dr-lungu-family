import { extractScreeningFieldsHeuristic, flattenExtractionFields } from '@medscreen/shared';
import type { AiExtractionProvider, ExtractionResult } from '../types/providers';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export class MockAiExtractionProvider implements AiExtractionProvider {
  async extract(transcript: string): Promise<ExtractionResult> {
    await delay(400);
    const extraction = extractScreeningFieldsHeuristic(transcript);
    return {
      fields: flattenExtractionFields(extraction) as ExtractionResult['fields'],
      extraction,
    };
  }
}
