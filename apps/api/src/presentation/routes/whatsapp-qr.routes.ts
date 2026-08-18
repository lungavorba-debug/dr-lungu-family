import type { Express, Request, Response } from 'express';
import QRCode from 'qrcode';
import { whatsAppService } from '../../services/whatsapp.service';

const PAGE_STYLES = `
  body {
    font-family: system-ui, -apple-system, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    margin: 0;
    background: #f3f4f6;
    color: #111827;
  }
  .card {
    background: #fff;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    text-align: center;
    max-width: 460px;
  }
  h1 { font-size: 1.25rem; margin: 0 0 0.75rem; }
  p { color: #6b7280; margin: 0.5rem 0; line-height: 1.5; }
  img {
    width: 280px;
    height: 280px;
    margin: 1rem 0;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }
  small { color: #9ca3af; }
  .success { color: #047857; font-size: 1.1rem; font-weight: 600; }
`;

function buildAutoRefreshHtml(title: string, body: string, refreshSeconds = 5): string {
  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="${refreshSeconds}">
  <title>MedScreen — WhatsApp QR</title>
  <style>${PAGE_STYLES}</style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    ${body}
  </div>
</body>
</html>`;
}

function buildConnectedHtml(): string {
  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MedScreen — WhatsApp QR</title>
  <style>${PAGE_STYLES}</style>
</head>
<body>
  <div class="card">
    <p class="success">✅ Sesiune WhatsApp Conectată cu Succes!</p>
    <p>Poți închide această pagină. MedScreen poate trimite rapoarte prin WhatsApp Web.</p>
  </div>
</body>
</html>`;
}

export function registerWhatsAppQrRoute(app: Express): void {
  app.get('/qr', async (_req: Request, res: Response) => {
    if (whatsAppService.ready) {
      res.status(200).type('html').send(buildConnectedHtml());
      return;
    }

    const qr = whatsAppService.currentQr;
    if (qr) {
      try {
        const qrDataUrl = await QRCode.toDataURL(qr, { width: 280, margin: 2 });
        res.status(200).type('html').send(
          buildAutoRefreshHtml(
            'Conectare WhatsApp MedScreen',
            `<p>Scanează cu telefonul clinicii (+40 755 754 545)</p>
             <img src="${qrDataUrl}" alt="WhatsApp QR Code" />
             <p><small>Pagina se reîmprospătează automat la fiecare 5 secunde.</small></p>`,
          ),
        );
      } catch (error) {
        console.error('[whatsapp-web] Eroare la generarea QR data URL:', error);
        res.status(500).type('html').send(
          buildAutoRefreshHtml(
            'WhatsApp MedScreen',
            `<p>❌ Nu s-a putut genera codul QR. Pagina se va reîncărca automat.</p>`,
          ),
        );
      }
      return;
    }

    res.status(200).type('html').send(
      buildAutoRefreshHtml(
        'WhatsApp MedScreen',
        `<p>⏳ Se generează codul QR... Pagina se va reîncărca automat.</p>
         <p><small>Dacă durează prea mult, verifică terminalul API pentru erori Puppeteer.</small></p>`,
      ),
    );
  });
}
