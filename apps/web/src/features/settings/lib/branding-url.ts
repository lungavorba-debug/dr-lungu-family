const API_BASE_URL =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL
    : '/api/v1';

export function resolveBrandingAssetUrl(
  assetPath: string | null | undefined,
  cacheKey?: string | null,
): string | null {
  if (!assetPath?.trim()) return null;
  if (/^https?:\/\//i.test(assetPath)) {
    return cacheKey ? `${assetPath}?v=${encodeURIComponent(cacheKey)}` : assetPath;
  }

  const base = API_BASE_URL.replace(/\/$/, '');
  const normalized = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  const url = `${base}${normalized}`;
  return cacheKey ? `${url}?v=${encodeURIComponent(cacheKey)}` : url;
}

export async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Fișierul nu a putut fi citit.'));
    reader.readAsDataURL(file);
  });
}

export function dataUrlToBase64(dataUrl: string): string {
  const commaIndex = dataUrl.indexOf(',');
  return commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
}
