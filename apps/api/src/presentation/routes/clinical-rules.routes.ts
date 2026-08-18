import { Router } from 'express';
import {
  createClinicalRuleSchema,
  updateClinicalRuleSchema,
  previewClinicalEvaluationSchema,
} from '@medscreen/shared';
import {
  createClinicalRuleController,
  disableClinicalRuleController,
  enableClinicalRuleController,
  getClinicalRuleController,
  listClinicalRuleChangesController,
  listClinicalRulesController,
  previewClinicalEvaluationController,
  updateClinicalRuleController,
} from '../controllers/clinical-rules.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody } from '../middleware/validate.middleware';

const clinicalRulesRouter = Router();

clinicalRulesRouter.get('/', authenticate, authorize('ADMIN'), listClinicalRulesController);
clinicalRulesRouter.get('/history', authenticate, authorize('ADMIN'), listClinicalRuleChangesController);
clinicalRulesRouter.post(
  '/preview',
  authenticate,
  authorize('ADMIN'),
  validateBody(previewClinicalEvaluationSchema),
  previewClinicalEvaluationController,
);
clinicalRulesRouter.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validateBody(createClinicalRuleSchema),
  createClinicalRuleController,
);
clinicalRulesRouter.get('/:id', authenticate, authorize('ADMIN'), getClinicalRuleController);
clinicalRulesRouter.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validateBody(updateClinicalRuleSchema),
  updateClinicalRuleController,
);
clinicalRulesRouter.post('/:id/enable', authenticate, authorize('ADMIN'), enableClinicalRuleController);
clinicalRulesRouter.post('/:id/disable', authenticate, authorize('ADMIN'), disableClinicalRuleController);

export { clinicalRulesRouter };
