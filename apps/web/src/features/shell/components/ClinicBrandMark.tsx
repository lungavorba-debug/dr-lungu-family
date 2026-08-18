import { resolveBrandingAssetUrl } from '../../settings/lib/branding-url';
import { useClinicSettings } from '../../settings/context/ClinicSettingsContext';

interface ClinicBrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<ClinicBrandMarkProps['size']>, string> = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-12 w-12 text-base',
  lg: 'h-16 w-16 text-2xl',
};

export function ClinicBrandMark({ size = 'sm', className = '' }: ClinicBrandMarkProps) {
  const { settings, meta } = useClinicSettings();
  const logoUrl = resolveBrandingAssetUrl(settings?.logo.logo_path, meta?.updated_at);
  const sizeClass = SIZE_CLASS[size];

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        className={`${sizeClass} shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-1 ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-xl bg-brand-primary font-bold text-white ${className}`}
    >
      {settings?.logo.sidebar_initials ?? 'MS'}
    </div>
  );
}
