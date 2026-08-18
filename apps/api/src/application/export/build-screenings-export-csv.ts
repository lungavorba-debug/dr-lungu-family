import type { ScreeningExportRecord } from '../../domain/repositories/screening.repository';
import { EXPORT_SCREENINGS_HEADERS, mapScreeningExportRow } from './export-screenings-shared';

function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function formatCsvValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return escapeCsvCell('');
  if (typeof value === 'boolean') return escapeCsvCell(value ? 'Da' : 'Nu');
  return escapeCsvCell(String(value));
}

export function buildScreeningsExportCsv(rows: ScreeningExportRecord[]): string {
  const dataRows = rows.map((row) => mapScreeningExportRow(row));

  return [[...EXPORT_SCREENINGS_HEADERS], ...dataRows]
    .map((row) => row.map((cell) => formatCsvValue(cell as string | number | boolean | null)).join(','))
    .join('\n');
}

export { EXPORT_SCREENINGS_MAX_ROWS } from './export-screenings-shared';
