import type { Request, Response, NextFunction } from 'express';
import { createPatientSchema, searchPatientsQuerySchema } from '@medscreen/shared';
import { AppError } from '../../lib/app-error';
import { sendSuccess } from '../../lib/api-response';
import {
  createPatientUseCase,
  getPatientUseCase,
  searchPatientsUseCase,
} from '../../infrastructure/container';

export async function searchPatientsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = searchPatientsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const details = parsed.error.errors.map((issue) => ({
        field: issue.path.join('.') || 'query',
        issue: issue.message,
      }));
      next(new AppError(400, 'INVALID_PARAMETER', 'Parametrii de căutare sunt invalizi.', details));
      return;
    }

    const patients = await searchPatientsUseCase.execute({
      phone: parsed.data.phone,
      search: parsed.data.search,
    });

    sendSuccess(res, { patients }, 'Rezultatele căutării au fost încărcate.');
  } catch (error) {
    next(error);
  }
}

export async function createPatientController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patient = await createPatientUseCase.execute(req.body as ReturnType<typeof createPatientSchema.parse>);
    sendSuccess(res, { patient }, 'Pacientul a fost înregistrat cu succes.', 201);
  } catch (error) {
    next(error);
  }
}

export async function getPatientController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const patient = await getPatientUseCase.execute(id);
    if (!patient) {
      next(new AppError(404, 'NOT_FOUND', 'Pacientul solicitat nu a fost găsit.'));
      return;
    }

    sendSuccess(res, { patient }, 'Pacientul a fost încărcat.');
  } catch (error) {
    next(error);
  }
}
