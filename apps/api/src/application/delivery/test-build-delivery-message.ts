import { resolveSmtpFromAddress } from '@medscreen/config';
import { buildParticipantReportUrl, cloneDefaultClinicSettings, toClinicSettingsSnapshot } from '@medscreen/shared';

import { DUMMY_PARTICIPANT_REPORT } from '../../../../../packages/shared/src/report/fixtures/dummy-participant-report.ts';
import {
  EMAIL_AUTO_FOOTER,
  EMAIL_MEDICAL_DISCLAIMER,
} from './build-delivery-email-html.ts';
import { DELIVERY_EMAIL_LINKS } from './delivery-email-links.ts';
import { buildDeliveryMessage, REPORT_EMAIL_SUBJECT } from './build-delivery-message.ts';
import { readEmailLogoBytes } from './delivery-email-assets.ts';

function assert(label: string, condition: boolean): void {
  if (!condition) throw new Error(`Assertion failed: ${label}`);
}

const settings = cloneDefaultClinicSettings();
const reportUrl = buildParticipantReportUrl(
  DUMMY_PARTICIPANT_REPORT,
  toClinicSettingsSnapshot(settings),
);

function runSharedAssertions(message: ReturnType<typeof buildDeliveryMessage>): void {
  assert('subject is fixed clinic subject', message.subject === REPORT_EMAIL_SUBJECT);
  assert('subject excludes participant name', !message.subject.includes('Popescu'));
  assert('body includes pdf attached note', message.text.includes('Raportul PDF este atașat'));
  assert('body includes clinic section', message.text.includes('📍'));
  assert('body includes specialties', message.text.includes('Specialități disponibile'));
  assert('body includes coming soon', message.text.includes('În curând:'));
  assert('body includes medical disclaimer', message.text.includes(EMAIL_MEDICAL_DISCLAIMER));
  assert('body includes closing', message.text.includes('Echipa Dr. Lungu Family'));
  assert('text includes auto footer', message.text.includes(EMAIL_AUTO_FOOTER));
  assert('html includes logo cid', message.html.includes('cid:clinic-logo'));
  assert('html includes booking button', message.html.includes('Programează-te'));
  assert('html includes booking url', message.html.includes(DELIVERY_EMAIL_LINKS.website));
  assert('html includes facebook link', message.html.includes(DELIVERY_EMAIL_LINKS.facebook));
  assert('html includes instagram link', message.html.includes(DELIVERY_EMAIL_LINKS.instagram));
  assert('html includes tiktok link', message.html.includes(DELIVERY_EMAIL_LINKS.tiktok));
  assert('html includes auto footer', message.html.includes('Acest email a fost generat automat'));
  assert('html includes do not reply footer', message.html.includes('Do not reply to this email'));
}

const savedFlag = process.env.EMAIL_ONLINE_REPORT_ENABLED;
process.env.EMAIL_ONLINE_REPORT_ENABLED = 'false';
const disabledMessage = buildDeliveryMessage(DUMMY_PARTICIPANT_REPORT, 'Ion Popescu', settings);
runSharedAssertions(disabledMessage);
assert('disabled text hides online report url', !disabledMessage.text.includes(reportUrl));
assert('disabled text hides online availability copy', !disabledMessage.text.includes('disponibil aici'));
assert('disabled html hides report button', !disabledMessage.html.includes('Vezi raportul online'));
assert('disabled html hides online report url', !disabledMessage.html.includes(reportUrl));

process.env.EMAIL_ONLINE_REPORT_ENABLED = 'true';
const enabledMessage = buildDeliveryMessage(DUMMY_PARTICIPANT_REPORT, 'Ion Popescu', settings);
runSharedAssertions(enabledMessage);
assert('enabled body includes report url', enabledMessage.text.includes(reportUrl));
assert('enabled html includes report button', enabledMessage.html.includes('Vezi raportul online'));
assert('enabled html includes report url in button', enabledMessage.html.includes(reportUrl));
assert('enabled html includes official green button color', enabledMessage.html.includes('#38A645'));

if (savedFlag === undefined) {
  delete process.env.EMAIL_ONLINE_REPORT_ENABLED;
} else {
  process.env.EMAIL_ONLINE_REPORT_ENABLED = savedFlag;
}

const devFrom = resolveSmtpFromAddress({
  NODE_ENV: 'development',
  API_PORT: 3001,
  API_HOST: '0.0.0.0',
  JWT_EXPIRES_IN: '8h',
  CORS_ORIGIN: 'http://localhost:5173',
  STORAGE_TYPE: 'local',
  STORAGE_LOCAL_PATH: './storage',
  WHATSAPP_API_VERSION: 'v21.0',
  EMAIL_ONLINE_REPORT_ENABLED: false,
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_FROM_NAME: 'Dr. Lungu Family',
  SMTP_FROM_EMAIL: 'drlungufamily@gmail.com',
});

assert('smtp from uses name and email from env', devFrom === '"Dr. Lungu Family" <drlungufamily@gmail.com>');

void readEmailLogoBytes().then((logoBytes) => {
  assert('email logo asset is available', Boolean(logoBytes && logoBytes.length > 0));
  assert('official logo asset size matches upload', logoBytes!.length >= 40000);
  console.log('delivery email template tests passed.');
});
