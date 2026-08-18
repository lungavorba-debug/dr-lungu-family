const RO_PHONE_REGEX = /^0[237]\d{8}$/;

export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (digits.startsWith('40') && digits.length === 11) {
    return `0${digits.slice(2)}`;
  }

  if (digits.startsWith('0040') && digits.length === 13) {
    return `0${digits.slice(4)}`;
  }

  return digits;
}

export function isValidRomanianPhone(value: string): boolean {
  return RO_PHONE_REGEX.test(normalizePhone(value));
}

export function formatPhoneDisplay(value: string): string {
  const normalized = normalizePhone(value);
  if (normalized.length !== 10) {
    return formatPhoneInput(value);
  }

  return `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7)}`;
}

/** Formats partial phone input while typing: 07xx xxx xxx */
export function formatPhoneInput(value: string): string {
  const digits = normalizePhone(value).slice(0, 10);

  if (digits.length <= 4) {
    return digits;
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  }

  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

/** Converts a normalized Romanian mobile number to E.164 (+40...). */
export function toRomanianE164(value: string): string {
  const normalized = normalizePhone(value);
  if (normalized.startsWith('0') && normalized.length === 10) {
    return `+40${normalized.slice(1)}`;
  }

  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('40') && digits.length === 11) {
    return `+${digits}`;
  }

  if (value.startsWith('+')) {
    return `+${digits}`;
  }

  return `+${digits}`;
}

/** Normalizes Romanian phone input to wa.me digits (e.g. 40755123456). */
export function toWhatsAppPhoneNumber(value: string): string {
  const normalized = normalizePhone(value);

  if (normalized.startsWith('0') && normalized.length === 10) {
    return `40${normalized.slice(1)}`;
  }

  const digits = value.replace(/\D/g, '');

  if (digits.startsWith('40') && digits.length === 11) {
    return digits;
  }

  if (digits.startsWith('0') && digits.length === 10) {
    return `40${digits.slice(1)}`;
  }

  return digits;
}

const WHATSAPP_GRAPH_RO_REGEX = /^40[237]\d{8}$/;

/** Meta Graph API `to` field: E.164 digits without + (e.g. 40755123456). */
export function toWhatsAppGraphRecipient(value: string): string {
  return toWhatsAppPhoneNumber(value);
}

export function isValidWhatsAppGraphRecipient(value: string): boolean {
  return WHATSAPP_GRAPH_RO_REGEX.test(toWhatsAppGraphRecipient(value));
}
