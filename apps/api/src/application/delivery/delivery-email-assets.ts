import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

export const EMAIL_LOGO_CID = 'clinic-logo';

const assetsDir = path.join(__dirname, '../../assets/email');

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
