import {
  formatWhatsAppCloudApiErrorForUser,
  parseWhatsAppGraphError,
} from '../../infrastructure/delivery/whatsapp-graph-errors';
import {
  isValidWhatsAppGraphRecipient,
  toWhatsAppGraphRecipient,
} from '@medscreen/shared';

function assert(name: string, ok: boolean): void {
  console.log(`${ok ? '✔' : '✗'} ${name}`);
  if (!ok) process.exitCode = 1;
}

const accountNotRegistered = parseWhatsAppGraphError(
  { error: { message: '(#133010) Account not registered', code: 133010, fbtrace_id: 'abc123' } },
  'send_message',
  'fallback',
);

assert('133010 error code mapped', accountNotRegistered.errorCode === 'WHATSAPP_ACCOUNT_NOT_REGISTERED');
assert('133010 mentions OTP', accountNotRegistered.message.includes('OTP'));
assert('133010 mentions test numbers', accountNotRegistered.message.includes('numerele de test'));

const userMessage = formatWhatsAppCloudApiErrorForUser(accountNotRegistered);
assert('133010 user message mentions Meta Dashboard', userMessage.includes('Meta'));

const recipientBlocked = parseWhatsAppGraphError(
  { error: { message: 'Recipient phone number not in allowed list', code: 131030 } },
  'send_message',
  'fallback',
);

assert('131030 error code mapped', recipientBlocked.errorCode === 'WHATSAPP_RECIPIENT_NOT_ALLOWED');

const expiredToken = parseWhatsAppGraphError(
  { error: { message: 'Error validating access token: Session has expired', code: 190 } },
  'media_upload',
  'fallback',
);

assert('190 error code mapped', expiredToken.errorCode === 'WHATSAPP_ACCESS_TOKEN_INVALID');

assert('graph recipient from local format', toWhatsAppGraphRecipient('0755 754 545') === '40755754545');
assert('graph recipient from plus format', toWhatsAppGraphRecipient('+40755123456') === '40755123456');
assert('valid graph recipient', isValidWhatsAppGraphRecipient('0722 123 456'));
assert('invalid graph recipient rejected', !isValidWhatsAppGraphRecipient('123'));

console.log('\nwhatsapp-graph-errors: checks complete.');
