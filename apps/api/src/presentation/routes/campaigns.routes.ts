import { Router } from 'express';
import {
  createCampaignSchema,
  updateCampaignSchema,
} from '@medscreen/shared';
import {
  activateCampaignController,
  archiveCampaignController,
  closeCampaignController,
  createCampaignController,
  deleteCampaignController,
  getCampaignController,
  getCampaignDashboardSummaryController,
  listCampaignsAdminController,
  listCampaignsController,
  updateCampaignController,
} from '../controllers/campaign.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody } from '../middleware/validate.middleware';

const campaignsRouter = Router();

campaignsRouter.get(
  '/admin/dashboard',
  authenticate,
  authorize('ADMIN'),
  getCampaignDashboardSummaryController,
);

campaignsRouter.get(
  '/admin',
  authenticate,
  authorize('ADMIN'),
  listCampaignsAdminController,
);

campaignsRouter.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validateBody(createCampaignSchema),
  createCampaignController,
);

campaignsRouter.get(
  '/',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  listCampaignsController,
);

campaignsRouter.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  getCampaignController,
);

campaignsRouter.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validateBody(updateCampaignSchema),
  updateCampaignController,
);

campaignsRouter.post(
  '/:id/activate',
  authenticate,
  authorize('ADMIN'),
  activateCampaignController,
);

campaignsRouter.post(
  '/:id/close',
  authenticate,
  authorize('ADMIN'),
  closeCampaignController,
);

campaignsRouter.post(
  '/:id/archive',
  authenticate,
  authorize('ADMIN'),
  archiveCampaignController,
);

campaignsRouter.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  deleteCampaignController,
);

export { campaignsRouter };
