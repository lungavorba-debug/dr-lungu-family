/** Title-case locality for participant report display (e.g. "pitesti" → "Pitesti"). */
export function formatParticipantCity(city: string | null | undefined): string | null {
  const trimmed = city?.trim();
  if (!trimmed) return null;

  return trimmed
    .split(/\s+/)
    .map((word) => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}
