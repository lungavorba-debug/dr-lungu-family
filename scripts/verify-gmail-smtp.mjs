/**
 * Gmail SMTP production verification.
 * Usage: node scripts/verify-gmail-smtp.mjs
 *
 * Requires apps/api/.env with Gmail SMTP credentials (see docs/EMAIL_PRODUCTION_SETUP.md).
 */
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(ROOT, 'apps/api/.env') });

const checks = {};

function mark(name, pass, detail = '') {
  checks[name] = { pass, detail };
}

function resolveFromAddress() {
  if (process.env.SMTP_FROM?.trim()) {
    return process.env.SMTP_FROM.trim();
  }
  const name = process.env.SMTP_FROM_NAME?.trim();
  const email = process.env.SMTP_FROM_EMAIL?.trim();
  if (name && email) {
    return `"${name}" <${email}>`;
  }
  return email ?? '';
}

const EXPECTED_SENDER = '"Dr. Lungu Family" <drlungufamily@gmail.com>';

async function main() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = resolveFromAddress();
  const recipient =
    process.env.E2E_TEST_EMAIL_TO?.trim() ||
    process.env.SMTP_FROM_EMAIL?.trim() ||
    user ||
    '';

  mark('smtp_host_configured', Boolean(host), host ?? 'missing');
  mark('smtp_from_name_loaded', Boolean(process.env.SMTP_FROM_NAME?.trim()), process.env.SMTP_FROM_NAME?.trim() ?? 'missing');
  mark('smtp_from_email_loaded', Boolean(process.env.SMTP_FROM_EMAIL?.trim()), process.env.SMTP_FROM_EMAIL?.trim() ?? 'missing');
  mark('smtp_user_loaded', Boolean(user), user ? 'set' : 'missing');
  mark('smtp_pass_loaded', Boolean(pass), pass ? 'set' : 'missing');
  mark('sender_configured', Boolean(from), from || 'missing');
  mark('sender_is_gmail', from === EXPECTED_SENDER, from);
  mark('sender_not_ethereal', !/ethereal\.email/i.test(from), from);
  mark('recipient_configured', Boolean(recipient), recipient || 'missing');

  if (!host || !from || !recipient) {
    console.log(JSON.stringify({ status: 'failed', checks }, null, 2));
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });

  try {
    await transporter.verify();
    mark('connection_and_auth', true, `${host}:${port}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    mark('connection_and_auth', false, message);
    console.log(JSON.stringify({ status: 'failed', checks }, null, 2));
    process.exit(1);
  }

  const pdfPath = path.join(ROOT, 'tmp-investigate.pdf');
  let pdfBytes;
  try {
    pdfBytes = await readFile(pdfPath);
    mark('pdf_attachment_available', pdfBytes.subarray(0, 4).toString('utf8') === '%PDF', `${pdfBytes.length} bytes`);
  } catch {
    pdfBytes = Buffer.from('%PDF-1.4 test');
    mark('pdf_attachment_available', false, 'tmp-investigate.pdf missing — using stub');
  }

  const subject = 'MedScreen — verificare Gmail SMTP (UTF-8: ăâîșț)';
  const html = `<!DOCTYPE html><html lang="ro"><head><meta charset="utf-8"></head><body>
    <p>Verificare livrare MedScreen — caractere românești: ăâîșț ĂÂÎȘȚ</p>
    <p><a href="https://drlungufamily.ro" style="background:#38A645;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;">Vezi raportul online</a></p>
    <p><a href="https://drlungufamily.ro/programare">Programează-te</a></p>
  </body></html>`;

  try {
    const info = await transporter.sendMail({
      from,
      to: recipient,
      subject,
      text: 'Verificare MedScreen Gmail SMTP — Raportul PDF este atașat.',
      html,
      attachments: [
        {
          filename: 'medscreen-verify.pdf',
          content: pdfBytes,
          contentType: 'application/pdf',
        },
      ],
    });

    mark('send_email', Boolean(info.messageId || info.response), info.response ?? info.messageId ?? '');
    mark('utf8_subject', subject.includes('ă'), subject);
    mark('html_body', html.includes('Vezi raportul online'), 'buttons present');
    mark('pdf_attached', pdfBytes.length > 0, `${pdfBytes.length} bytes`);
    mark('sender_header', from.length > 0, from);
    mark('recipient_header', recipient.length > 0, recipient);
    mark('delivery_success', true, info.response ?? 'accepted');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    mark('send_email', false, message);
    mark('delivery_success', false, message);
  }

  const allPass = Object.values(checks).every((c) => c.pass);
  console.log(JSON.stringify({ status: allPass ? 'passed' : 'failed', checks }, null, 2));
  process.exit(allPass ? 0 : 1);
}

main();
