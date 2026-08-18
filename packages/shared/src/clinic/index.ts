export {
  DEFAULT_CLINIC_SETTINGS,
  DEFAULT_CLINIC_SETTINGS_ID,
  cloneDefaultClinicSettings,
} from './default-clinic-settings';

export {
  allowedBrandingMimes,
  brandingAssetApiPath,
  brandingAssetExtension,
  brandingAssetMaxBytes,
  brandingAssetStorageFilename,
  BRANDING_FAVICON_API_PATH,
  BRANDING_FAVICON_MIMES,
  BRANDING_LOGO_API_PATH,
  BRANDING_LOGO_MIMES,
  BRANDING_LOGO_MAX_BYTES,
  BRANDING_FAVICON_MAX_BYTES,
  decodeBrandingAssetBase64,
  deriveSecondaryBrandColor,
  resolveBrandingAssetUrl,
} from './branding-assets';

export {
  buildQrMatrixFromSettings,
  mergeSecretField,
  maskSecret,
  resolveClinicSettingsSnapshot,
  resolveQrUrlFromSettings,
  toClinicSettingsSnapshot,
  toPublicClinicSettings,
  SECRET_MASK,
} from './resolve-clinic-settings';
