import { Router } from 'express';
import {
  exportScreeningsExcelController,
  getExportScreeningsMetadataController,
} from '../controllers/export.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';

const exportRouter = Router();

exportRouter.get(
  '/screenings/metadata',
  authenticate,
  authorize('ADMIN', 'MEDIC'),
  getExportScreeningsMetadataController,
);

exportRouter.get(
  '/screenings',
  authenticate,
  authorize('ADMIN', 'MEDIC'),
  exportScreeningsExcelController,
);

export { exportRouter };
