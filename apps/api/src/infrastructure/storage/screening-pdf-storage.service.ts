import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseApiEnvOrThrow } from '@medscreen/config';
import { base64ToPdfBytes } from '@medscreen/shared';
import { AppError } from '../../lib/app-error';

export interface ScreeningPdfStorageService {
  savePdf(screeningId: string, base64: string): Promise<string>;
  readPdf(storagePath: string): Promise<Buffer>;
}

function resolveStorageRoot(): string {
  const env = parseApiEnvOrThrow();
  const configured = env.STORAGE_LOCAL_PATH.trim();
  return path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
}

function resolvePdfAbsolutePath(storagePath: string): string {
  if (path.isAbsolute(storagePath)) {
    return storagePath;
  }
  return path.join(resolveStorageRoot(), storagePath);
}

class LocalScreeningPdfStorageService implements ScreeningPdfStorageService {
  async savePdf(screeningId: string, base64: string): Promise<string> {
    const relativePath = path.posix.join('screenings', `${screeningId}.pdf`);
    const absolutePath = resolvePdfAbsolutePath(relativePath);

    await mkdir(path.dirname(absolutePath), { recursive: true });

    let bytes: Uint8Array;
    try {
      bytes = base64ToPdfBytes(base64);
    } catch {
      throw new AppError(400, 'INVALID_PARAMETER', 'PDF-ul încărcat nu este valid.');
    }

    await writeFile(absolutePath, bytes);
    return relativePath;
  }

  async readPdf(storagePath: string): Promise<Buffer> {
    const absolutePath = resolvePdfAbsolutePath(storagePath);

    try {
      return await readFile(absolutePath);
    } catch {
      throw new AppError(404, 'NOT_FOUND', 'PDF-ul screeningului nu a fost găsit.');
    }
  }
}

export const screeningPdfStorageService: ScreeningPdfStorageService =
  new LocalScreeningPdfStorageService();
