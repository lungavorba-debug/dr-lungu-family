import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../lib/app-error';
import { sendSuccess } from '../../lib/api-response';
import {
  createScreeningAiSessionUseCase,
  extractScreeningUseCase,
  getAiAvailabilityUseCase,
  getScreeningAiSessionUseCase,
  reviewScreeningExtractionUseCase,
  syncTranscriptUseCase,
  transcribeAudioUseCase,
  parseScreeningVoiceUseCase,
} from '../../infrastructure/container';

function readSessionId(req: Request): string {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    throw new AppError(400, 'INVALID_PARAMETER', 'Identificator sesiune AI invalid.');
  }
  return id;
}

function requireUser(req: Request): { id: string } {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.');
  }
  return req.user;
}

export async function getAiAvailabilityController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await getAiAvailabilityUseCase.execute();
    sendSuccess(res, result, 'Disponibilitatea AI a fost încărcată.');
  } catch (error) {
    next(error);
  }
}

export async function createScreeningAiSessionController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = requireUser(req);
    const result = await createScreeningAiSessionUseCase.execute(user.id, req.body ?? {});
    sendSuccess(res, result, 'Sesiunea AI a fost creată.');
  } catch (error) {
    next(error);
  }
}

export async function getScreeningAiSessionController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = requireUser(req);
    const result = await getScreeningAiSessionUseCase.execute(readSessionId(req), user.id);
    sendSuccess(res, result, 'Sesiunea AI a fost încărcată.');
  } catch (error) {
    next(error);
  }
}

export async function syncTranscriptController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = requireUser(req);
    const result = await syncTranscriptUseCase.execute(readSessionId(req), user.id, req.body ?? {});
    sendSuccess(res, result, 'Transcriptul a fost sincronizat.');
  } catch (error) {
    next(error);
  }
}

export async function transcribeAudioController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = requireUser(req);
    const result = await transcribeAudioUseCase.execute(readSessionId(req), user.id, req.body ?? {});
    sendSuccess(res, result, 'Audio transcris.');
  } catch (error) {
    next(error);
  }
}

export async function extractScreeningController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = requireUser(req);
    const result = await extractScreeningUseCase.execute(readSessionId(req), user.id, req.body ?? {});
    sendSuccess(res, result, 'Extragerea structurată a fost finalizată.');
  } catch (error) {
    next(error);
  }
}

export async function reviewScreeningExtractionController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = requireUser(req);
    const result = await reviewScreeningExtractionUseCase.execute(
      readSessionId(req),
      user.id,
      req.body ?? {},
    );
    sendSuccess(res, result, 'Revizuirea operatorului a fost salvată.');
  } catch (error) {
    next(error);
  }
}

export async function parseScreeningVoiceController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    requireUser(req);
    const result = await parseScreeningVoiceUseCase.execute(req.body ?? {});
    sendSuccess(res, result, 'Audio procesat și câmpuri extrase.');
  } catch (error) {
    next(error);
  }
}
