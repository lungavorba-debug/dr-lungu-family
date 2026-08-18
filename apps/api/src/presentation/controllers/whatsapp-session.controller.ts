import type { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../lib/api-response';
import { whatsAppService } from '../../services/whatsapp.service';

async function buildSessionPayload() {
  const status = whatsAppService.getStatus();
  const qrDataUrl = status.qr_available ? await whatsAppService.getQrDataUrl() : null;

  return {
    ...status,
    qr_data_url: qrDataUrl,
  };
}

export async function getWhatsAppSessionController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(res, await buildSessionPayload(), 'Starea sesiunii WhatsApp a fost încărcată.');
  } catch (error) {
    next(error);
  }
}

export async function connectWhatsAppSessionController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    whatsAppService.connect();
    await whatsAppService.waitForSessionUpdate();

    const payload = await buildSessionPayload();

    sendSuccess(
      res,
      payload,
      payload.connected
        ? 'Sesiunea WhatsApp este deja conectată.'
        : payload.qr_data_url
          ? 'Codul QR WhatsApp este gata de scanare.'
          : 'Conectarea WhatsApp a fost pornită. Așteptați generarea codului QR.',
    );
  } catch (error) {
    next(error);
  }
}
