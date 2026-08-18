import { useRef, useState } from 'react';
import type { BrandingAssetKind } from '@medscreen/types';
import { BRANDING_FAVICON_MIMES, BRANDING_LOGO_MIMES } from '@medscreen/shared';
import { dataUrlToBase64, readFileAsDataUrl, resolveBrandingAssetUrl } from '../lib/branding-url';
import { useUploadClinicBrandingAsset } from '../hooks/useClinicBrandingUpload';

interface BrandingAssetFieldProps {
  kind: BrandingAssetKind;
  label: string;
  description: string;
  currentPath: string | null;
  currentMime: string;
  cacheKey?: string | null;
  onUploaded?: () => void;
}

const ACCEPT_BY_KIND: Record<BrandingAssetKind, string> = {
  logo: BRANDING_LOGO_MIMES.join(','),
  favicon: BRANDING_FAVICON_MIMES.join(','),
};

export function BrandingAssetField({
  kind,
  label,
  description,
  currentPath,
  currentMime,
  cacheKey,
  onUploaded,
}: BrandingAssetFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadClinicBrandingAsset();
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewUrl =
    localPreview ?? resolveBrandingAssetUrl(currentPath, cacheKey);

  async function handleFileChange(file: File | undefined) {
    if (!file) return;

    setError(null);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setLocalPreview(dataUrl);
      await upload.mutateAsync({
        kind,
        mime: file.type,
        file_base64: dataUrlToBase64(dataUrl),
      });
      onUploaded?.();
    } catch (uploadError) {
      setLocalPreview(null);
      setError(uploadError instanceof Error ? uploadError.message : 'Upload eșuat.');
    } finally {
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
          {previewUrl ? (
            <img src={previewUrl} alt="" className="max-h-full max-w-full object-contain p-2" />
          ) : (
            <span className="text-xs text-slate-400">Fără previzualizare</span>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">{label}</p>
            <p className="text-xs text-slate-500">{description}</p>
            {currentMime ? <p className="mt-1 text-xs text-slate-400">MIME curent: {currentMime}</p> : null}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_BY_KIND[kind]}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-secondary"
            onChange={(event) => void handleFileChange(event.target.files?.[0])}
            disabled={upload.isPending}
          />

          {upload.isPending ? <p className="text-xs text-slate-500">Se încarcă…</p> : null}
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
