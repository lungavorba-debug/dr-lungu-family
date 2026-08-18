import { Router } from 'express';
import { createPatientSchema } from '@medscreen/shared';
import {
  createPatientController,
  getPatientController,
  searchPatientsController,
} from '../controllers/patient.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody } from '../middleware/validate.middleware';

const patientsRouter = Router();

patientsRouter.get(
  '/',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  searchPatientsController,
);

patientsRouter.post(
  '/',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  validateBody(createPatientSchema),
  createPatientController,
);

patientsRouter.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  getPatientController,
);

export { patientsRouter };
