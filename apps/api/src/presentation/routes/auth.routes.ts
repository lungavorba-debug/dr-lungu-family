import { Router, type Request, type Response } from 'express';

import rateLimit from 'express-rate-limit';

import {

  changePasswordSchema,

  forgotPasswordSchema,

  loginSchema,

  resetPasswordWithTokenSchema,

} from '@medscreen/shared';

import { loginController, logoutController } from '../controllers/auth.controller';

import {

  changePasswordController,

  forgotPasswordController,

  invalidateSessionController,

  resetPasswordWithTokenController,

} from '../controllers/account.controller';

import { authenticate } from '../middleware/auth.middleware';

import { validateBody } from '../middleware/validate.middleware';

import { AppError } from '../../lib/app-error';

import { sendError, sendSuccess } from '../../lib/api-response';



const authRouter = Router();



const loginRateLimiter = rateLimit({

  windowMs: 15 * 60 * 1000,

  max: 20,

  standardHeaders: true,

  legacyHeaders: false,

  handler: (_req: Request, res: Response) => {

    sendError(

      res,

      429,

      'RATE_LIMIT_EXCEEDED',

      'Prea multe încercări de autentificare. Încercați din nou mai târziu.',

    );

  },

});



const passwordRateLimiter = rateLimit({

  windowMs: 15 * 60 * 1000,

  max: 10,

  standardHeaders: true,

  legacyHeaders: false,

  handler: (_req: Request, res: Response) => {

    sendError(

      res,

      429,

      'RATE_LIMIT_EXCEEDED',

      'Prea multe solicitări. Încercați din nou mai târziu.',

    );

  },

});



authRouter.post('/login', loginRateLimiter, validateBody(loginSchema), loginController);

authRouter.post('/logout', authenticate, logoutController);

authRouter.post('/invalidate-session', authenticate, invalidateSessionController);

authRouter.post('/change-password', authenticate, validateBody(changePasswordSchema), changePasswordController);

authRouter.post('/forgot-password', passwordRateLimiter, validateBody(forgotPasswordSchema), forgotPasswordController);

authRouter.post(

  '/reset-password',

  passwordRateLimiter,

  validateBody(resetPasswordWithTokenSchema),

  resetPasswordWithTokenController,

);



authRouter.get('/me', authenticate, (req, res, next) => {

  if (!req.user) {

    next(new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.'));

    return;

  }

  sendSuccess(res, { user: req.user });

});



export { authRouter };


