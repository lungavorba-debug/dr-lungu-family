import { ApiClientError } from '../../../shared/lib/api-client';

export function isApiUnavailableError(error: unknown): boolean {
  if (error instanceof ApiClientError) {
    return (
      error.statusCode === 0 ||
      error.errorCode === 'NETWORK_ERROR' ||
      error.statusCode === 503 ||
      error.statusCode === 502 ||
      error.statusCode === 504
    );
  }

  if (error instanceof TypeError) {
    return true;
  }

  return false;
}

export function buildQueueItemId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `sync-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
