import { cloneDefaultClinicSettings } from '@medscreen/shared';

import { DUMMY_PARTICIPANT_REPORT } from '../../../../../packages/shared/src/report/fixtures/dummy-participant-report.ts';
import { buildDeliveryWhatsAppCaption } from './build-delivery-whatsapp-message.ts';

function assert(label: string, condition: boolean): void {
  if (!condition) throw new Error(`Assertion failed: ${label}`);
}

const settings = cloneDefaultClinicSettings();

function runAssertions(caption: string): void {
  assert('includes greeting', caption.includes('Bună ziua'));
  assert('includes participant name', caption.includes('Popescu'));
  assert('includes event name', caption.includes('Festivalul Tradiții Argeșene'));
  assert('includes pdf attached note', caption.includes('Raportul PDF este atașat'));
  assert('includes clinic phone', caption.includes('Programări'));
  assert('includes clinic name', caption.includes('Dr. Lungu Family'));
  assert('includes team closing', caption.includes('Echipa Dr. Lungu Family'));
  assert('excludes online report url', !caption.includes('Raport online:'));
  assert('caption within whatsapp limit', caption.length <= 1024);
}

const caption = buildDeliveryWhatsAppCaption(
  DUMMY_PARTICIPANT_REPORT,
  'Ion Popescu',
  settings,
);

runAssertions(caption);

console.log('build-delivery-whatsapp-message: all assertions passed');
