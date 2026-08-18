import { Router } from 'express';

import {

  createUserSchema,

  resetUserPasswordSchema,

  updateUserProfileSchema,

  updateUserSchema,

} from '@medscreen/shared';

import {

  activateUserController,

  createUserController,

  deactivateUserController,

  deleteUserController,

  getUserController,

  listUsersController,

  resetUserPasswordController,

  updateUserController,

} from '../controllers/users.controller';

import {

  getMyProfileController,

  unlockUserController,

  updateMyProfileController,

} from '../controllers/profile.controller';

import { authenticate } from '../middleware/auth.middleware';

import { authorize } from '../middleware/authorize.middleware';

import { validateBody } from '../middleware/validate.middleware';



const usersRouter = Router();



usersRouter.get('/me/profile', authenticate, getMyProfileController);

usersRouter.patch(

  '/me/profile',

  authenticate,

  validateBody(updateUserProfileSchema),

  updateMyProfileController,

);



usersRouter.get('/', authenticate, authorize('ADMIN'), listUsersController);

usersRouter.post('/', authenticate, authorize('ADMIN'), validateBody(createUserSchema), createUserController);

usersRouter.get('/:id', authenticate, authorize('ADMIN'), getUserController);

usersRouter.patch('/:id', authenticate, authorize('ADMIN'), validateBody(updateUserSchema), updateUserController);

usersRouter.post('/:id/activate', authenticate, authorize('ADMIN'), activateUserController);

usersRouter.post('/:id/deactivate', authenticate, authorize('ADMIN'), deactivateUserController);

usersRouter.post('/:id/unlock', authenticate, authorize('ADMIN'), unlockUserController);

usersRouter.post(

  '/:id/reset-password',

  authenticate,

  authorize('ADMIN'),

  validateBody(resetUserPasswordSchema),

  resetUserPasswordController,

);

usersRouter.delete('/:id', authenticate, authorize('ADMIN'), deleteUserController);



export { usersRouter };


