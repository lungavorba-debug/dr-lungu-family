import type { BrandingAssetKind } from '@medscreen/types';

export const BRANDING_LOGO_API_PATH = '/clinic-settings/assets/logo';
export const BRANDING_FAVICON_API_PATH = '/clinic-settings/assets/favicon';

export const BRANDING_LOGO_MIMES = [
  'image/png',
  'image/jpeg',
  'image/svg+xml',
  'image/webp',
] as const;

export const BRANDING_FAVICON_MIMES = [
  'image/png',
  'image/x-icon',
  'image/vnd.microsoft.icon',
  'image/svg+xml',
] as const;

export const BRANDING_LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const BRANDING_FAVICON_MAX_BYTES = 512 * 1024;

const MIME_EXTENSION: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
};

export function brandingAssetApiPath(kind: BrandingAssetKind): string {
  return kind === 'logo' ? BRANDING_LOGO_API_PATH : BRANDING_FAVICON_API_PATH;
}

export function allowedBrandingMimes(kind: BrandingAssetKind): readonly string[] {
  return kind === 'logo' ? BRANDING_LOGO_MIMES : BRANDING_FAVICON_MIMES;
}

export function brandingAssetMaxBytes(kind: BrandingAssetKind): number {
  return kind === 'logo' ? BRANDING_LOGO_MAX_BYTES : BRANDING_FAVICON_MAX_BYTES;
}

export function brandingAssetExtension(mime: string): string {
  return MIME_EXTENSION[mime] ?? 'bin';
}

export function brandingAssetStorageFilename(kind: BrandingAssetKind, mime: string): string {
  return `${kind}.${brandingAssetExtension(mime)}`;
}

export function deriveSecondaryBrandColor(primaryHex: string): string {
  const normalized = primaryHex.replace('#', '');
  if (normalized.length !== 6) return '#002a40';

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  const darken = (channel: number) => Math.max(0, Math.round(channel * 0.72));

  const toHex = (value: number) => value.toString(16).padStart(2, '0');
  return `#${toHex(darken(r))}${toHex(darken(g))}${toHex(darken(b))}`;
}

export function resolveBrandingAssetUrl(
  assetPath: string | null | undefined,
  apiBaseUrl = '/api/v1',
): string | null {
  if (!assetPath?.trim()) return null;
  if (/^https?:\/\//i.test(assetPath)) return assetPath;
  const base = apiBaseUrl.replace(/\/$/, '');
  const normalized = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return `${base}${normalized}`;
}

export function decodeBrandingAssetBase64(fileBase64: string): Buffer {
  const trimmed = fileBase64.trim();
  const payload = trimmed.includes(',') ? trimmed.split(',').pop() ?? '' : trimmed;
  return Buffer.from(payload, 'base64');
}
