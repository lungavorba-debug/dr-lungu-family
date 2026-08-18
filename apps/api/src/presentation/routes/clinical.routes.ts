import { Router } from 'express';
import { clinicalEvaluationRequestSchema } from '@medscreen/shared';
import { evaluateClinicalEngineController } from '../controllers/clinical.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody } from '../middleware/validate.middleware';

const clinicalRouter = Router();

clinicalRouter.post(
  '/clinical/evaluate',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  validateBody(clinicalEvaluationRequestSchema),
  evaluateClinicalEngineController,
);

export { clinicalRouter };
