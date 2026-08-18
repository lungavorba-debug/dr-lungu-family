import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { isEmailOnlineReportEnabled, parseApiEnv, resolveSmtpFromAddress, shouldUseEtherealSmtp } from '@medscreen/config';
import { cloneDefaultClinicSettings } from '@medscreen/shared';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { chromium } from 'playwright';

import { DUMMY_PARTICIPANT_REPORT } from '../../../../../packages/shared/src/report/fixtures/dummy-participant-report.ts';
import { buildDeliveryMessage, REPORT_EMAIL_SUBJECT } from './build-delivery-message.ts';
import { EMAIL_LOGO_CID, readEmailLogoBytes } from './delivery-email-assets.ts';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../../../../..');
const screenshotPath = path.join(
  repoRoot,
  'apps/web/scripts/ui-screenshots/received-email-final.png',
);
const pdfPath = path.join(repoRoot, 'tmp-investigate.pdf');

dotenv.config({ path: path.join(repoRoot, 'apps/api/.env') });

function assert(label: string, condition: boolean): void {
  if (!condition) throw new Error(`E2E assertion failed: ${label}`);
}

async function resolveSmtpTransport(): Promise<{
  transporter: nodemailer.Transporter;
  recipient: string;
  previewMode: 'ethereal' | 'configured';
  etherealMessageUrl?: string;
}> {
  const env = parseApiEnv();

  if (!shouldUseEtherealSmtp(env) && resolveSmtpFromAddress(env)) {
    const recipient = process.env.E2E_TEST_EMAIL_TO?.trim() || env.SMTP_FROM_EMAIL || env.SMTP_USER || '';
    if (!recipient) {
      throw new Error('E2E_TEST_EMAIL_TO or SMTP_FROM_EMAIL must be set when using configured SMTP.');
    }
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? (env.SMTP_SECURE ? 465 : 587),
      secure: env.SMTP_SECURE ?? false,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? {
              user: env.SMTP_USER,
              pass: env.SMTP_PASS,
            }
          : undefined,
    });

    return { transporter, recipient, previewMode: 'configured' };
  }

  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  return {
    transporter,
    recipient: testAccount.user,
    previewMode: 'ethereal',
  };
}

async function main(): Promise<void> {
  const settings = cloneDefaultClinicSettings();
  const message = buildDeliveryMessage(DUMMY_PARTICIPANT_REPORT, 'Ion Popescu', settings);
  const logoBytes = await readEmailLogoBytes();
  const pdfBytes = await readFile(pdfPath);
  const env = parseApiEnv();
  const from = resolveSmtpFromAddress(env);
  assert('smtp sender configured', Boolean(from?.trim()));

  assert('logo bytes available', Boolean(logoBytes?.length));
  assert('pdf starts with %PDF', pdfBytes.subarray(0, 4).toString('utf8') === '%PDF');
  assert('html contains booking button', message.html.includes('Programează-te'));

  const reportUrlMatch = message.html.match(/href="(https:\/\/[^"]+\/raport\/[^"]+)"/);
  if (isEmailOnlineReportEnabled(env)) {
    assert('html contains report button when online report enabled', message.html.includes('Vezi raportul online'));
    assert('report url present in html when online report enabled', Boolean(reportUrlMatch?.[1]));
  } else {
    assert('html hides report button when online report disabled', !message.html.includes('Vezi raportul online'));
    assert('html hides online report url when online report disabled', !reportUrlMatch?.[1]);
  }

  const { transporter, recipient, previewMode } = await resolveSmtpTransport();

  const info = await transporter.sendMail({
    from,
    to: recipient,
    subject: message.subject,
    text: message.text,
    html: message.html,
    attachments: [
      {
        filename: 'clinic-logo.png',
        content: logoBytes!,
        cid: EMAIL_LOGO_CID,
        contentType: 'image/png',
      },
      {
        filename: DUMMY_PARTICIPANT_REPORT.metadata.filename,
        content: pdfBytes,
        contentType: 'application/pdf',
      },
    ],
  });

  assert('message subject matches template', message.subject === REPORT_EMAIL_SUBJECT);
  assert('message accepted by smtp', Boolean(info.messageId || info.response));

  let previewUrl = nodemailer.getTestMessageUrl(info) ?? undefined;
  if (!previewUrl && previewMode === 'configured') {
    previewUrl = `data:text/html;charset=utf-8,${encodeURIComponent(message.html)}`;
  }

  assert('preview url available', Boolean(previewUrl));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 760, height: 1400 } });

  if (previewUrl.startsWith('data:')) {
    await page.setContent(decodeURIComponent(previewUrl.replace(/^data:text\/html;charset=utf-8,/, '')));
  } else {
    await page.goto(previewUrl!, { waitUntil: 'networkidle' });
  }

  await page.screenshot({ path: screenshotPath, fullPage: true });
  await browser.close();

  const verification = {
    previewMode,
    recipient,
    sender: from,
    subject: message.subject,
    reportUrl: reportUrlMatch?.[1] ?? null,
    pdfBytes: pdfBytes.length,
    pdfValid: pdfBytes.subarray(0, 4).toString('utf8') === '%PDF',
    messageId: info.messageId ?? null,
    previewUrl: previewUrl.startsWith('data:') ? 'inline-html-preview' : previewUrl,
    screenshotPath,
  };

  console.log(JSON.stringify({ status: 'passed', verification }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
