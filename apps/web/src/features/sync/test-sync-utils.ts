/**
 * Offline sync utility tests.
 * Run: npm run test:sync
 */
import { ApiClientError } from '../../shared/lib/api-client';
import { isApiUnavailableError } from './lib/sync-utils';

function assert(name: string, ok: boolean, detail = ''): void {
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
}

assert('network error is unavailable', isApiUnavailableError(new ApiClientError(0, 'NETWORK_ERROR', 'offline')));
assert('503 is unavailable', isApiUnavailableError(new ApiClientError(503, 'SERVICE_UNAVAILABLE', 'down')));
assert('400 is not unavailable', !isApiUnavailableError(new ApiClientError(400, 'INVALID_PARAMETER', 'bad')));
assert('type error is unavailable', isApiUnavailableError(new TypeError('Failed to fetch')));

console.log('\nSync utility tests complete.');
