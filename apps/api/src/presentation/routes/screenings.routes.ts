import { Router } from 'express';
import { completeScreeningSchema, deliverScreeningEmailSchema, deliverScreeningWhatsAppSchema } from '@medscreen/shared';
import {
  completeScreeningController,
  getScreeningPdfController,
  getScreeningPdfMetadataController,
  getScreeningReportController,
} from '../controllers/screening-completion.controller';
import {
  deliverScreeningEmailController,
  deliverScreeningWhatsAppController,
  getDeliveryAvailabilityController,
  listScreeningDeliveriesController,
} from '../controllers/screening-delivery.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody } from '../middleware/validate.middleware';

const screeningsRouter = Router();

screeningsRouter.post(
  '/:id/complete',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  validateBody(completeScreeningSchema),
  completeScreeningController,
);

screeningsRouter.get(
  '/:id/report/pdf/metadata',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  getScreeningPdfMetadataController,
);

screeningsRouter.get(
  '/:id/report/pdf',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  getScreeningPdfController,
);

screeningsRouter.get(
  '/:id/report',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  getScreeningReportController,
);

screeningsRouter.get(
  '/:id/delivery/availability',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  getDeliveryAvailabilityController,
);

screeningsRouter.get(
  '/:id/delivery',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  listScreeningDeliveriesController,
);

screeningsRouter.post(
  '/:id/delivery/email',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  validateBody(deliverScreeningEmailSchema),
  deliverScreeningEmailController,
);

screeningsRouter.post(
  '/:id/delivery/whatsapp',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  validateBody(deliverScreeningWhatsAppSchema),
  deliverScreeningWhatsAppController,
);

export { screeningsRouter };
