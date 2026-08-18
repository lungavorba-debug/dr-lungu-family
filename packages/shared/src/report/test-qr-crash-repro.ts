import { cloneDefaultClinicSettings } from '../clinic/default-clinic-settings';
import { generateQrMatrix } from '../clinic/qr-code-generator';
import { toClinicSettingsSnapshot } from '../clinic/resolve-clinic-settings';
import { buildParticipantReportUrl } from './participant-report-url';

function assert(label: string, condition: boolean): void {
  if (!condition) throw new Error(`Assertion failed: ${label}`);
}

const defaults = cloneDefaultClinicSettings();
const meta = {
  report_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  report_number: 'SM-2026-004812',
};

const longUrl = buildParticipantReportUrl({ metadata: meta }, null);
const longMatrix = generateQrMatrix(longUrl);
assert('long report url builds', longUrl.includes('/raport/'));
assert('long report url qr matrix builds', longMatrix.length > 0);

const emptyWebsiteSettings = toClinicSettingsSnapshot({
  ...defaults,
  contact: { ...defaults.contact, website: '' },
});
const fallbackUrl = buildParticipantReportUrl({ metadata: meta }, emptyWebsiteSettings);
assert('empty website falls back to clinic base', fallbackUrl.startsWith('https://www.drlungufamily.ro'));

const missingMetaUrl = buildParticipantReportUrl(
  { metadata: { report_id: '', report_number: '' } },
  null,
);
assert('missing metadata falls back safely', missingMetaUrl.startsWith('https://'));

assert('undefined qr payload uses fallback matrix', generateQrMatrix(undefined).length > 0);

console.log('qr crash regression tests passed.');
