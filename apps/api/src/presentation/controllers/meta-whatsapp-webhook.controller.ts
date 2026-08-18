import type { Request, Response, NextFunction } from 'express';
import { isWhatsAppDeliveryConfigured, parseApiEnv } from '@medscreen/config';
import { MetaWhatsAppWebhookUseCase } from '../../application/whatsapp/meta-whatsapp-webhook.use-case';
import { checkWhatsAppCloudConfig } from '../../infrastructure/whatsapp/whatsapp-cloud-config.service';

const webhookUseCase = new MetaWhatsAppWebhookUseCase();

export async function metaWhatsAppWebhookHealthController(
  _req: Request,
  res: Response,
): Promise<void> {
  const env = parseApiEnv();

  if (!isWhatsAppDeliveryConfigured(env)) {
    res.status(200).json({
      status: 'not_configured',
      provider: 'Not configured',
    });
    return;
  }

  const check = await checkWhatsAppCloudConfig(env);
  res.status(check.issues.length > 0 ? 503 : 200).json({
    status: check.issues.length > 0 ? 'degraded' : 'ok',
    provider: check.provider,
    phoneNumberId: check.phoneNumberId,
    displayPhoneNumber: check.displayPhoneNumber,
    verifiedName: check.verifiedName,
    registrationStatus: check.status,
    graphReachable: check.graphReachable,
    issues: check.issues,
    warnings: check.warnings,
  });
}

export function metaWhatsAppWebhookVerifyController(req: Request, res: Response): void {
  const mode = String(req.query['hub.mode'] ?? '');
  const verifyToken = String(req.query['hub.verify_token'] ?? '');
  const challenge = String(req.query['hub.challenge'] ?? '');
  const expectedToken = parseApiEnv().WHATSAPP_VERIFY_TOKEN?.trim() ?? '';

  if (mode === 'subscribe' && verifyToken && expectedToken && verifyToken === expectedToken) {
    res.status(200).send(challenge);
    return;
  }

  res.sendStatus(403);
}

export function metaWhatsAppWebhookReceiveController(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    webhookUseCase.execute(req.body);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}
