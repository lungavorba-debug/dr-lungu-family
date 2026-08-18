import { Router } from 'express';
import {
  connectWhatsAppSessionController,
  getWhatsAppSessionController,
} from '../controllers/whatsapp-session.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';

const whatsappSessionRouter = Router();

whatsappSessionRouter.get(
  '/session',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  getWhatsAppSessionController,
);

whatsappSessionRouter.post(
  '/session/connect',
  authenticate,
  authorize('ADMIN'),
  connectWhatsAppSessionController,
);

export { whatsappSessionRouter };
