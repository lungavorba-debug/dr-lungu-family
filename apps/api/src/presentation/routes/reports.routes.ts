import { Router } from 'express';
import { generateParticipantReportPdfSchema } from '@medscreen/shared';
import { generateParticipantReportPdfController } from '../controllers/generate-report-pdf.controller';
import { listScreeningReportsController } from '../controllers/reports.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody } from '../middleware/validate.middleware';

const reportsRouter = Router();

reportsRouter.get(
  '/',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  listScreeningReportsController,
);

reportsRouter.post(
  '/participant/pdf/generate',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  validateBody(generateParticipantReportPdfSchema),
  generateParticipantReportPdfController,
);

export { reportsRouter };
