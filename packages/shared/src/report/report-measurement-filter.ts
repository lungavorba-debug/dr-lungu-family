import type { PremiumMeasurementRow } from '../clinical/participant-view/build-measurement-rows';

export function isEmptyMeasurementResult(result: string): boolean {
  const trimmed = result.trim();
  return trimmed.length === 0 || trimmed === '—' || trimmed === '-' || trimmed === '— / —';
}

export function filterMeasuredRows(rows: PremiumMeasurementRow[]): PremiumMeasurementRow[] {
  return rows.filter((row) => !isEmptyMeasurementResult(row.result));
}
