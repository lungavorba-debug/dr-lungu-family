import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { BrandingAssetKind } from '@medscreen/types';
import { parseApiEnvOrThrow } from '@medscreen/config';
import { brandingAssetStorageFilename } from '@medscreen/shared';

export interface ClinicBrandingStorageService {
  saveAsset(kind: BrandingAssetKind, mime: string, bytes: Buffer): Promise<void>;
  readAsset(kind: BrandingAssetKind, mime: string): Promise<Buffer | null>;
}

function resolveBrandingDir(): string {
  const env = parseApiEnvOrThrow();
  const configured = env.STORAGE_LOCAL_PATH.trim();
  const root = path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
  return path.join(root, 'branding');
}

function resolveAssetPath(kind: BrandingAssetKind, mime: string): string {
  const filename = brandingAssetStorageFilename(kind, mime);
  return path.join(resolveBrandingDir(), filename);
}

class LocalClinicBrandingStorageService implements ClinicBrandingStorageService {
  async saveAsset(kind: BrandingAssetKind, mime: string, bytes: Buffer): Promise<void> {
    const absolutePath = resolveAssetPath(kind, mime);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, bytes);
  }

  async readAsset(kind: BrandingAssetKind, mime: string): Promise<Buffer | null> {
    const absolutePath = resolveAssetPath(kind, mime);

    try {
      await access(absolutePath);
      return await readFile(absolutePath);
    } catch {
      return null;
    }
  }
}

export const clinicBrandingStorageService: ClinicBrandingStorageService =
  new LocalClinicBrandingStorageService();
