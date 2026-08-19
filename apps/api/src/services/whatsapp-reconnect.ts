export const RECONNECT_BASE_DELAY_MS = 5_000;
export const RECONNECT_MAX_DELAY_MS = 120_000;

/** Exponential backoff with cap — used for automatic WhatsApp reconnect. */
export function computeReconnectDelayMs(attempt: number): number {
  const safeAttempt = Math.max(1, attempt);
  return Math.min(RECONNECT_BASE_DELAY_MS * 2 ** (safeAttempt - 1), RECONNECT_MAX_DELAY_MS);
}

/** LOGOUT means the phone unlinked this device — session files must be cleared. */
export function isWhatsAppLogoutReason(reason: unknown): boolean {
  const normalized = String(reason ?? '').trim().toUpperCase();
  return normalized === 'LOGOUT' || normalized.includes('LOGOUT');
}
