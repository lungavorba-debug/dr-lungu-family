import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { initialSetupSchema } from '@medscreen/shared';
import {
  createInitialAdminController,
  getSetupStatusController,
} from '../controllers/setup.controller';
import { validateBody } from '../middleware/validate.middleware';
import { sendError } from '../../lib/api-response';

const setupRouter = Router();

const setupRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    sendError(
      res,
      429,
      'RATE_LIMIT_EXCEEDED',
      'Prea multe încercări de configurare. Încercați din nou mai târziu.',
    );
  },
});

setupRouter.get('/status', getSetupStatusController);
setupRouter.post(
  '/initial-admin',
  setupRateLimiter,
  validateBody(initialSetupSchema),
  createInitialAdminController,
);

export { setupRouter };
