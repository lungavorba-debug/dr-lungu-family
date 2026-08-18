import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const TOKEN_LINE = /^WHATSAPP_VERIFY_TOKEN=.*$/m;

export function generateWhatsAppVerifyToken(): string {
  return randomBytes(24).toString('hex');
}

/** Ensures WHATSAPP_VERIFY_TOKEN exists in process.env and apps/api/.env. */
export function ensureWhatsAppVerifyToken(envFilePath: string): string {
  const existing = process.env.WHATSAPP_VERIFY_TOKEN?.trim();
  if (existing) {
    return existing;
  }

  const token = generateWhatsAppVerifyToken();
  process.env.WHATSAPP_VERIFY_TOKEN = token;

  if (existsSync(envFilePath)) {
    let content = readFileSync(envFilePath, 'utf8');
    if (TOKEN_LINE.test(content)) {
      content = content.replace(TOKEN_LINE, `WHATSAPP_VERIFY_TOKEN=${token}`);
    } else {
      const suffix = content.endsWith('\n') ? '' : '\n';
      content = `${content}${suffix}WHATSAPP_VERIFY_TOKEN=${token}\n`;
    }
    writeFileSync(envFilePath, content, 'utf8');
    console.log('[whatsapp] Generated WHATSAPP_VERIFY_TOKEN in apps/api/.env');
  } else {
    console.warn('[whatsapp] WHATSAPP_VERIFY_TOKEN generated for runtime only (apps/api/.env missing).');
  }

  return token;
}
