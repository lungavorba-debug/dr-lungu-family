import {
  allowedBrandingMimes,
  brandingAssetApiPath,
  brandingAssetExtension,
  brandingAssetStorageFilename,
  decodeBrandingAssetBase64,
  deriveSecondaryBrandColor,
  resolveBrandingAssetUrl,
} from './branding-assets';

function assert(name: string, ok: boolean, detail = ''): void {
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
}

assert('logo mimes include png', allowedBrandingMimes('logo').includes('image/png'));
assert('favicon mimes include ico', allowedBrandingMimes('favicon').includes('image/x-icon'));
assert('logo api path', brandingAssetApiPath('logo') === '/clinic-settings/assets/logo');
assert('png extension', brandingAssetExtension('image/png') === 'png');
assert('storage filename', brandingAssetStorageFilename('logo', 'image/png') === 'logo.png');
assert('secondary color', deriveSecondaryBrandColor('#003D5B') === '#002c42');
assert(
  'resolve asset url',
  resolveBrandingAssetUrl('/clinic-settings/assets/logo', '/api/v1') ===
    '/api/v1/clinic-settings/assets/logo',
);

const sample = Buffer.from('test').toString('base64');
assert('decode base64', decodeBrandingAssetBase64(sample).toString() === 'test');

console.log('\nBranding assets tests complete.');
