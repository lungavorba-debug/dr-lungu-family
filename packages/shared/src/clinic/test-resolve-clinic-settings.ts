import { cloneDefaultClinicSettings } from './default-clinic-settings';
import { resolveQrUrlFromSettings, toClinicSettingsSnapshot } from './resolve-clinic-settings';

function assert(name: string, ok: boolean, detail = ''): void {
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
}

const defaults = cloneDefaultClinicSettings();
const snapshot = toClinicSettingsSnapshot(defaults);

assert('builds snapshot from defaults', snapshot.clinic.name === defaults.clinic.name);

const customSnapshot = toClinicSettingsSnapshot({
  ...defaults,
  qr: { preferred_url: 'custom', custom_url: 'https://example.com/clinic' },
});

assert(
  'uses custom qr url when configured',
  resolveQrUrlFromSettings(customSnapshot) === 'https://example.com/clinic',
);

assert('default qr url resolves', resolveQrUrlFromSettings(snapshot).includes('http'));
