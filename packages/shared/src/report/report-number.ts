/** Stable participant-facing report number derived from screening id (no DB ids exposed). */
export function buildStableReportNumber(screeningId: string, screeningDateIso: string): string {
  const year = new Date(screeningDateIso).getFullYear();
  const normalized = screeningId.replace(/\D/g, '');
  let hash = 0;

  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + Number.parseInt(normalized[index] ?? '0', 10)) % 1_000_000;
  }

  const serial = (hash + 1).toString().padStart(6, '0');
  return `SM-${year}-${serial}`;
}

export function resolveOperatorDisplayName(operatorName: string | null | undefined): string {
  const trimmed = operatorName?.trim() ?? '';
  if (trimmed.length === 0 || trimmed === 'undefined undefined') {
    return 'Operator MedScreen';
  }
  return trimmed;
}
