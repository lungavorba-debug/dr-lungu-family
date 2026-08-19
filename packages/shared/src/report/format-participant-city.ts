/** Title-case and normalize Romanian locality names for participant reports. */

const LOCALITY_EXACT_CORRECTIONS: Record<string, string> = {
  'ștrfănești': 'Ștefănești',
  'strfănești': 'Ștefănești',
  'strfanesti': 'Ștefănești',
  'stefanesti': 'Ștefănești',
  'ștefanesti': 'Ștefănești',
  'ste fanesti': 'Ștefănești',
  'pitesti': 'Pitești',
  'bucuresti': 'București',
  'campulung': 'Câmpulung',
  'corbeni': 'Corbeni',
};

function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '');
}

function normalizeLookupKey(value: string): string {
  return stripDiacritics(value.trim().toLowerCase()).replace(/\s+/g, ' ');
}

function applyKnownLocalityCorrections(value: string): string {
  const exact = LOCALITY_EXACT_CORRECTIONS[value.trim().toLowerCase()];
  if (exact) return exact;

  const lookup = normalizeLookupKey(value);
  const corrected = LOCALITY_EXACT_CORRECTIONS[lookup];
  if (corrected) return corrected;

  // Voice truncation: "Ștrfănești" / "Strfanesti" → Ștefănești
  if (/^ș?trf[aă]?ne[sș]?ti$/i.test(value.trim()) || /^strfanesti$/i.test(lookup)) {
    return 'Ștefănești';
  }

  return value.trim();
}

function titleCaseWord(word: string): string {
  if (word.length === 0) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** Normalize locality for display (fixes common voice mishearings + title case). */
export function formatParticipantCity(city: string | null | undefined): string | null {
  const trimmed = city?.trim();
  if (!trimmed) return null;

  const corrected = applyKnownLocalityCorrections(trimmed);

  return corrected
    .split(/\s+/)
    .map(titleCaseWord)
    .join(' ');
}

/** Normalize raw locality input from forms or voice extraction before persistence. */
export function normalizeParticipantCityInput(city: string | null | undefined): string {
  return formatParticipantCity(city) ?? city?.trim() ?? '';
}
