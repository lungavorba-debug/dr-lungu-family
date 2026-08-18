/** Age field: max 3 digits, BP-style auto-advance rules. */

export function sanitizeAgeValue(value: string): string {
  return value.replace(/\D/g, '').slice(0, 3);
}

/**
 * Auto-advance when age entry is complete:
 * - 10–99: after 2 digits
 * - 100–120: allow a third digit
 * - 3 digits always completes
 */
export function shouldAutoAdvanceAge(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) {
    return false;
  }

  const numeric = Number.parseInt(digits, 10);
  if (Number.isNaN(numeric)) {
    return false;
  }

  if (digits.length >= 3) {
    return true;
  }

  if (digits.length === 2 && numeric >= 10 && numeric <= 99) {
    return true;
  }

  return false;
}
