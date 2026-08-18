import type { Request, Response, NextFunction } from 'express';
import { listUsersQuerySchema } from '@medscreen/shared';
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '@medscreen/types';
import { AppError } from '../../lib/app-error';
import { sendSuccess } from '../../lib/api-response';
import {
  auditRecorder,
  createUserUseCase,
  deleteUserUseCase,
  getUserUseCase,
  listUsersUseCase,
  resetUserPasswordUseCase,
  setUserActiveUseCase,
  updateUserUseCase,
} from '../../infrastructure/container';

function readUserId(req: Request): string {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    throw new AppError(400, 'INVALID_PARAMETER', 'Identificator utilizator invalid.');
  }
  return id;
}

export async function listUsersController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = listUsersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const details = parsed.error.errors.map((issue: { path: (string | number)[]; message: string }) => ({
        field: issue.path.join('.') || 'query',
        issue: issue.message,
      }));
      next(new AppError(400, 'INVALID_PARAMETER', 'Parametri de căutare invalizi.', details));
      return;
    }

    const result = await listUsersUseCase.execute({
      search: parsed.data.search,
      role: parsed.data.role,
      active: parsed.data.active,
      page: parsed.data.page,
      limit: parsed.data.limit,
    });

    sendSuccess(res, result, 'Lista utilizatorilor a fost încărcată.');
  } catch (error) {
    next(error);
  }
}

export async function getUserController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await getUserUseCase.execute(readUserId(req));
    sendSuccess(res, result, 'Utilizatorul a fost încărcat.');
  } catch (error) {
    next(error);
  }
}

export async function createUserController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await createUserUseCase.execute(req.body);

    if (req.user) {
      auditRecorder.recordFromRequest(req, req.user, {
        action: AUDIT_ACTIONS.USER_CREATED,
        entity_type: AUDIT_ENTITY_TYPES.USER,
        entity_id: result.user.id,
        description: `Utilizator creat: ${result.user.first_name} ${result.user.last_name} (${result.user.email}).`,
      });
    }

    sendSuccess(res, result, 'Utilizatorul a fost creat.', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateUserController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await updateUserUseCase.execute(readUserId(req), req.body);

    if (req.user) {
      auditRecorder.recordFromRequest(req, req.user, {
        action: AUDIT_ACTIONS.USER_UPDATED,
        entity_type: AUDIT_ENTITY_TYPES.USER,
        entity_id: result.user.id,
        description: `Utilizator actualizat: ${result.user.first_name} ${result.user.last_name}.`,
      });
    }

    sendSuccess(res, result, 'Utilizatorul a fost actualizat.');
  } catch (error) {
    next(error);
  }
}

export async function activateUserController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.'));
      return;
    }

    const result = await setUserActiveUseCase.execute({
      userId: readUserId(req),
      active: true,
      actorId: req.user.id,
    });

    auditRecorder.recordFromRequest(req, req.user, {
      action: AUDIT_ACTIONS.USER_ACTIVATED,
      entity_type: AUDIT_ENTITY_TYPES.USER,
      entity_id: result.user.id,
      description: `Utilizator activat: ${result.user.first_name} ${result.user.last_name}.`,
    });

    sendSuccess(res, result, 'Utilizatorul a fost activat.');
  } catch (error) {
    next(error);
  }
}

export async function deactivateUserController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.'));
      return;
    }

    const result = await setUserActiveUseCase.execute({
      userId: readUserId(req),
      active: false,
      actorId: req.user.id,
    });

    auditRecorder.recordFromRequest(req, req.user, {
      action: AUDIT_ACTIONS.USER_DEACTIVATED,
      entity_type: AUDIT_ENTITY_TYPES.USER,
      entity_id: result.user.id,
      description: `Utilizator dezactivat: ${result.user.first_name} ${result.user.last_name}.`,
    });

    sendSuccess(res, result, 'Utilizatorul a fost dezactivat.');
  } catch (error) {
    next(error);
  }
}

export async function resetUserPasswordController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = readUserId(req);
    const result = await resetUserPasswordUseCase.execute(userId, req.body);

    if (req.user) {
      auditRecorder.recordFromRequest(req, req.user, {
        action: AUDIT_ACTIONS.PASSWORD_RESET,
        entity_type: AUDIT_ENTITY_TYPES.USER,
        entity_id: userId,
        description: 'Parola utilizatorului a fost resetată.',
      });
    }

    sendSuccess(res, result, 'Parola utilizatorului a fost resetată.');
  } catch (error) {
    next(error);
  }
}

export async function deleteUserController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.'));
      return;
    }

    const userId = readUserId(req);
    const result = await deleteUserUseCase.execute({
      userId,
      actorId: req.user.id,
    });

    auditRecorder.recordFromRequest(req, req.user, {
      action: AUDIT_ACTIONS.USER_DELETED,
      entity_type: AUDIT_ENTITY_TYPES.USER,
      entity_id: userId,
      description: 'Utilizator șters din sistem.',
    });

    sendSuccess(res, result, 'Utilizatorul a fost șters.');
  } catch (error) {
    next(error);
  }
}
