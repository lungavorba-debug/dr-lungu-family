import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const EMAIL_LOGO_CID = 'clinic-logo';

const assetsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../assets/email');

export function resolveEmailLogoPath(): string {
  return path.join(assetsDir, 'clinic-logo.png');
}

export async function readEmailLogoBytes(): Promise<Buffer | null> {
  const logoPath = resolveEmailLogoPath();
  try {
    await access(logoPath);
    return await readFile(logoPath);
  } catch {
    return null;
  }
}
