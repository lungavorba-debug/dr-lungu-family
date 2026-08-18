import { Router } from 'express';
import {
  metaWhatsAppWebhookHealthController,
  metaWhatsAppWebhookReceiveController,
  metaWhatsAppWebhookVerifyController,
} from '../controllers/meta-whatsapp-webhook.controller';

const metaWhatsAppWebhookRouter = Router();

metaWhatsAppWebhookRouter.get('/health', metaWhatsAppWebhookHealthController);
metaWhatsAppWebhookRouter.get('/', metaWhatsAppWebhookVerifyController);
metaWhatsAppWebhookRouter.post('/', metaWhatsAppWebhookReceiveController);

export { metaWhatsAppWebhookRouter };
