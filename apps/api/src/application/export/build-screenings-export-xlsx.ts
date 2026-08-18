import ExcelJS from 'exceljs';

import type { ScreeningExportRecord } from '../../domain/repositories/screening.repository';
import { EXPORT_SCREENINGS_HEADERS, mapScreeningExportRow } from './export-screenings-shared';

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE2E8F0' },
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
};

export async function buildScreeningsExportXlsx(rows: ScreeningExportRecord[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MedScreen Festival';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Screeninguri', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  worksheet.addRow([...EXPORT_SCREENINGS_HEADERS]);

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FF0F172A' } };
  headerRow.fill = HEADER_FILL;
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerRow.height = 22;

  for (let columnIndex = 1; columnIndex <= EXPORT_SCREENINGS_HEADERS.length; columnIndex += 1) {
    headerRow.getCell(columnIndex).border = THIN_BORDER;
  }

  for (const record of rows) {
    const values = mapScreeningExportRow(record);
    const row = worksheet.addRow(values);
    row.alignment = { vertical: 'top', wrapText: true };
    row.eachCell((cell) => {
      cell.border = THIN_BORDER;
    });
  }

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: EXPORT_SCREENINGS_HEADERS.length },
  };

  EXPORT_SCREENINGS_HEADERS.forEach((header, index) => {
    const column = worksheet.getColumn(index + 1);
    let maxLength = header.length;

    column.eachCell({ includeEmpty: false }, (cell) => {
      const value = cell.value == null ? '' : String(cell.value);
      maxLength = Math.max(maxLength, value.length);
    });

    column.width = Math.min(Math.max(maxLength + 2, 12), 40);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
