import { Router } from 'express';
import { getScreeningSyncStatusController } from '../controllers/sync.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';

const syncRouter = Router();

syncRouter.get(
  '/screenings/:id/status',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  getScreeningSyncStatusController,
);

export { syncRouter };
