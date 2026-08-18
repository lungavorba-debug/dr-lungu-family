import { useEffect } from 'react';
import { deriveSecondaryBrandColor } from '@medscreen/shared';
import { useClinicSettings } from '../context/ClinicSettingsContext';
import { resolveBrandingAssetUrl } from '../lib/branding-url';

function upsertLink(rel: string, href: string, type?: string): void {
  let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
  if (type) {
    link.type = type;
  }
}

function upsertMeta(name: string, content: string): void {
  let meta = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
}

export function BrandingThemeApplier() {
  const { settings, meta } = useClinicSettings();

  useEffect(() => {
    if (!settings) return;

    const root = document.documentElement;
    root.style.setProperty('--brand-primary', settings.branding.primary_color);
    root.style.setProperty('--brand-accent', settings.branding.accent_color);
    root.style.setProperty(
      '--brand-secondary',
      deriveSecondaryBrandColor(settings.branding.primary_color),
    );

    document.title = settings.branding.app_name;
    upsertMeta('theme-color', settings.branding.primary_color);

    const faviconUrl = resolveBrandingAssetUrl(settings.logo.favicon_path, meta?.updated_at);
    if (faviconUrl) {
      upsertLink('icon', faviconUrl, settings.logo.favicon_mime);
    }
  }, [meta?.updated_at, settings]);

  return null;
}
