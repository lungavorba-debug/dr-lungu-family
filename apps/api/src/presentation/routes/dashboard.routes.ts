import { Router } from 'express';
import { getDashboardStatsController, listCriticalCasesController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';

const dashboardRouter = Router();

dashboardRouter.get(
  '/stats',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  getDashboardStatsController,
);

dashboardRouter.get(
  '/critical-cases',
  authenticate,
  authorize('ADMIN', 'MEDIC'),
  listCriticalCasesController,
);

export { dashboardRouter };
