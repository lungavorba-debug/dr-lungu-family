import { Router } from 'express';
import { updateClinicSettingsSchema, uploadBrandingAssetSchema } from '@medscreen/shared';
import {
  getClinicSettingsController,
  getPublicClinicSettingsController,
  updateClinicSettingsController,
} from '../controllers/clinic-settings.controller';
import {
  getClinicBrandingAssetController,
  uploadClinicBrandingAssetController,
} from '../controllers/clinic-branding.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody } from '../middleware/validate.middleware';

const clinicSettingsRouter = Router();

clinicSettingsRouter.get('/public', getPublicClinicSettingsController);
clinicSettingsRouter.get('/assets/:kind', getClinicBrandingAssetController);
clinicSettingsRouter.get('/', authenticate, authorize('ADMIN'), getClinicSettingsController);
clinicSettingsRouter.post(
  '/branding/upload',
  authenticate,
  authorize('ADMIN'),
  validateBody(uploadBrandingAssetSchema),
  uploadClinicBrandingAssetController,
);
clinicSettingsRouter.patch(
  '/',
  authenticate,
  authorize('ADMIN'),
  validateBody(updateClinicSettingsSchema),
  updateClinicSettingsController,
);

export { clinicSettingsRouter };
