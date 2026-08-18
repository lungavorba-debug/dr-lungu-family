import type { PatientWithHistory } from '@medscreen/types';

function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function exportPatientsToCsv(patients: PatientWithHistory[], filename: string): void {
  const headers = ['Nume', 'Prenume', 'Telefon', 'Varsta', 'Sex', 'Localitate', 'Ultima evaluare'];
  const rows = patients.map((patient) => [
    patient.last_name,
    patient.first_name,
    patient.phone,
    String(patient.age),
    patient.gender,
    patient.city,
    patient.last_screening_date ?? '',
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
    .join('\n');

  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
