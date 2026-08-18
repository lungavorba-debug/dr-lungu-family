/**
 * Send a test WhatsApp PDF via Cloud API using current apps/api/.env credentials.
 * Usage: node scripts/send-test-whatsapp-pdf.mjs [recipientDigits]
 */
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(ROOT, 'apps/api/.env') });

const recipient = (process.argv[2] ?? '40755754545').replace(/\D/g, '');
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
const apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || 'v21.0';

if (!phoneNumberId || !accessToken) {
  console.error('Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN in apps/api/.env');
  process.exit(1);
}

async function loadPdfBytes() {
  const prisma = new PrismaClient();
  try {
    const screening = await prisma.screening.findFirst({
      where: { pdfStoragePath: { not: null }, pdfFilename: { not: null } },
      orderBy: { createdAt: 'desc' },
    });

    if (screening?.pdfStoragePath) {
      const storageRoot = process.env.STORAGE_LOCAL_PATH?.trim() || './storage';
      const absolutePath = path.isAbsolute(screening.pdfStoragePath)
        ? screening.pdfStoragePath
        : path.join(ROOT, 'apps/api', storageRoot, screening.pdfStoragePath);
      const bytes = await fs.readFile(absolutePath);
      return {
        pdfBytes: bytes,
        filename: screening.pdfFilename ?? 'MedScreen-Raport-Test.pdf',
        source: `screening ${screening.id}`,
      };
    }
  } finally {
    await prisma.$disconnect();
  }

  const minimalPdf = Buffer.from(
    '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n',
    'utf8',
  );
  return {
    pdfBytes: minimalPdf,
    filename: 'MedScreen-Raport-Test.pdf',
    source: 'minimal placeholder PDF',
  };
}

async function sendWhatsAppDocument(pdfBytes, filename) {
  const baseUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}`;

  const uploadForm = new FormData();
  uploadForm.append('messaging_product', 'whatsapp');
  uploadForm.append('type', 'application/pdf');
  uploadForm.append('file', new Blob([pdfBytes], { type: 'application/pdf' }), filename);

  const uploadResponse = await fetch(`${baseUrl}/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: uploadForm,
  });
  const uploadBody = await uploadResponse.json();
  if (!uploadResponse.ok || !uploadBody.id) {
    throw new Error(
      `Media upload failed (${uploadResponse.status}): ${uploadBody.error?.message ?? JSON.stringify(uploadBody)}`,
    );
  }

  const messageResponse = await fetch(`${baseUrl}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: recipient,
      type: 'document',
      document: {
        id: uploadBody.id,
        filename,
        caption: 'Test MedScreen — verificare trimitere raport PDF (Cloud API).',
      },
    }),
  });

  const messageBody = await messageResponse.json();
  if (!messageResponse.ok || !messageBody.messages?.[0]?.id) {
    throw new Error(
      `Send message failed (${messageResponse.status}): ${messageBody.error?.message ?? JSON.stringify(messageBody)}`,
    );
  }

  return messageBody.messages[0].id;
}

async function main() {
  console.log('[whatsapp:test-send] Phone Number ID:', phoneNumberId);
  console.log('[whatsapp:test-send] Recipient (Graph API to):', recipient);

  const { pdfBytes, filename, source } = await loadPdfBytes();
  console.log('[whatsapp:test-send] PDF source:', source, `(${pdfBytes.length} bytes)`);

  const messageId = await sendWhatsAppDocument(pdfBytes, filename);
  console.log('[whatsapp:test-send] ✓ Message sent. messageId:', messageId);
}

main().catch((error) => {
  console.error('[whatsapp:test-send] ✗', error instanceof Error ? error.message : error);
  process.exit(1);
});
