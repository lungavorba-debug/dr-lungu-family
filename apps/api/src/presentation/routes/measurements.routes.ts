import { Router } from 'express';
import { saveMeasurementsSchema } from '@medscreen/shared';
import {
  getPreviousMeasurementsController,
  saveMeasurementsController,
} from '../controllers/measurements.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody } from '../middleware/validate.middleware';

const measurementsRouter = Router();

measurementsRouter.get(
  '/patients/:patientId/previous-measurements',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  getPreviousMeasurementsController,
);

measurementsRouter.post(
  '/screenings/measurements',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  validateBody(saveMeasurementsSchema),
  saveMeasurementsController,
);

export { measurementsRouter };
