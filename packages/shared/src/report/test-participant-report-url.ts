import { cloneDefaultClinicSettings } from '../clinic/default-clinic-settings';
import { toClinicSettingsSnapshot } from '../clinic/resolve-clinic-settings';
import { toWhatsAppPhoneNumber } from '../utils/phone';
import { buildParticipantReportUrl } from './participant-report-url';

function assert(label: string, condition: boolean): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${label}`);
  }
}

const settings = toClinicSettingsSnapshot(cloneDefaultClinicSettings());
const reportId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const reportNumber = 'SM-2026-004812';

const reportUrl = buildParticipantReportUrl(
  {
    metadata: {
      report_id: reportId,
      report_number: reportNumber,
    },
  },
  settings,
);

assert('report url uses clinic website base', reportUrl.startsWith('https://www.drlungufamily.ro/raport/'));
assert('report url includes report id', reportUrl.includes(encodeURIComponent(reportId)));
assert('report url includes report number', reportUrl.includes(`nr=${encodeURIComponent(reportNumber)}`));

assert('wa.me from 07xxxxxxxx', toWhatsAppPhoneNumber('0722123456') === '40722123456');
assert('wa.me from spaced number', toWhatsAppPhoneNumber('0722 123 456') === '40722123456');
assert('wa.me from +40', toWhatsAppPhoneNumber('+40722123456') === '40722123456');
assert('wa.me from 40 prefix', toWhatsAppPhoneNumber('40722123456') === '40722123456');

console.log('participant-report-url tests passed.');
