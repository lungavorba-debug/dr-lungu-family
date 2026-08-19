import assert from 'node:assert/strict';
import {
  computeReconnectDelayMs,
  isWhatsAppLogoutReason,
  RECONNECT_BASE_DELAY_MS,
  RECONNECT_MAX_DELAY_MS,
} from './whatsapp-reconnect';

assert.equal(computeReconnectDelayMs(1), RECONNECT_BASE_DELAY_MS);
assert.equal(computeReconnectDelayMs(2), RECONNECT_BASE_DELAY_MS * 2);
assert.equal(computeReconnectDelayMs(10), RECONNECT_MAX_DELAY_MS);
assert.equal(computeReconnectDelayMs(0), RECONNECT_BASE_DELAY_MS);

assert.equal(isWhatsAppLogoutReason('LOGOUT'), true);
assert.equal(isWhatsAppLogoutReason('logout'), true);
assert.equal(isWhatsAppLogoutReason('NAVIGATION'), false);
assert.equal(isWhatsAppLogoutReason('Connection lost'), false);

console.log('[test-whatsapp-reconnect] All assertions passed.');
