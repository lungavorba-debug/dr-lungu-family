import type { Request, Response, NextFunction } from 'express';
import {
  listClinicalRuleChangesQuerySchema,
  listClinicalRulesQuerySchema,
  previewClinicalEvaluationSchema,
} from '@medscreen/shared';
import { AppError } from '../../lib/app-error';
import { sendSuccess } from '../../lib/api-response';
import {
  createClinicalRuleUseCase,
  getClinicalRuleUseCase,
  listClinicalRuleChangesUseCase,
  listClinicalRulesUseCase,
  previewClinicalEvaluationUseCase,
  setClinicalRuleEnabledUseCase,
  updateClinicalRuleUseCase,
} from '../../infrastructure/container';

function readRuleId(req: Request): string {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    throw new AppError(400, 'INVALID_PARAMETER', 'Identificator regulă invalid.');
  }
  return id;
}

function readChangedBy(req: Request): { id: string; name: string } {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.');
  }
  return {
    id: req.user.id,
    name: `${req.user.firstName} ${req.user.lastName}`.trim(),
  };
}

export async function listClinicalRulesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = listClinicalRulesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const details = parsed.error.errors.map((issue) => ({
        field: issue.path.join('.') || 'query',
        issue: issue.message,
      }));
      next(new AppError(400, 'INVALID_PARAMETER', 'Parametri de căutare invalizi.', details));
      return;
    }

    const result = await listClinicalRulesUseCase.execute({
      search: parsed.data.search,
      category: parsed.data.category,
      enabled: parsed.data.enabled,
      page: parsed.data.page,
      limit: parsed.data.limit,
    });

    sendSuccess(res, result, 'Regulile clinice au fost încărcate.');
  } catch (error) {
    next(error);
  }
}

export async function getClinicalRuleController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await getClinicalRuleUseCase.execute(readRuleId(req));
    sendSuccess(res, result, 'Regula clinică a fost încărcată.');
  } catch (error) {
    next(error);
  }
}

export async function createClinicalRuleController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await createClinicalRuleUseCase.execute(req.body, readChangedBy(req));
    sendSuccess(res, result, 'Regula clinică a fost creată.', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateClinicalRuleController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await updateClinicalRuleUseCase.execute(
      readRuleId(req),
      req.body,
      readChangedBy(req),
    );
    sendSuccess(res, result, 'Regula clinică a fost actualizată.');
  } catch (error) {
    next(error);
  }
}

export async function enableClinicalRuleController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await setClinicalRuleEnabledUseCase.execute(
      readRuleId(req),
      true,
      readChangedBy(req),
    );
    sendSuccess(res, result, 'Regula clinică a fost activată.');
  } catch (error) {
    next(error);
  }
}

export async function disableClinicalRuleController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await setClinicalRuleEnabledUseCase.execute(
      readRuleId(req),
      false,
      readChangedBy(req),
    );
    sendSuccess(res, result, 'Regula clinică a fost dezactivată.');
  } catch (error) {
    next(error);
  }
}

export async function listClinicalRuleChangesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = listClinicalRuleChangesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const details = parsed.error.errors.map((issue) => ({
        field: issue.path.join('.') || 'query',
        issue: issue.message,
      }));
      next(new AppError(400, 'INVALID_PARAMETER', 'Parametri de istoric invalizi.', details));
      return;
    }

    const result = await listClinicalRuleChangesUseCase.execute({
      ruleId: parsed.data.rule_id,
      page: parsed.data.page,
      limit: parsed.data.limit,
    });

    sendSuccess(res, result, 'Istoricul regulilor clinice a fost încărcat.');
  } catch (error) {
    next(error);
  }
}

export async function previewClinicalEvaluationController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = previewClinicalEvaluationSchema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.errors.map((issue) => ({
        field: issue.path.join('.') || 'body',
        issue: issue.message,
      }));
      next(new AppError(400, 'INVALID_PARAMETER', 'Date de previzualizare invalide.', details));
      return;
    }

    const result = await previewClinicalEvaluationUseCase.execute(parsed.data);
    sendSuccess(res, result, 'Previzualizarea evaluării clinice a fost generată.');
  } catch (error) {
    next(error);
  }
}
