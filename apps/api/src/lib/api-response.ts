import type { Response } from 'express';
import type { ApiErrorResponse, ApiMeta, ApiSuccessResponse } from '@medscreen/types';

const API_VERSION = '1.0.0';

function buildMeta(): ApiMeta {
  return {
    timestamp: new Date().toISOString(),
    version: API_VERSION,
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Operațiunea a fost efectuată cu succes.',
  code = 200,
): void {
  const body: ApiSuccessResponse<T> = {
    status: 'success',
    code,
    message,
    data,
    meta: buildMeta(),
  };
  res.status(code).json(body);
}

export function sendError(
  res: Response,
  statusCode: number,
  errorCode: string,
  message: string,
  details?: { field: string; issue: string }[],
): void {
  const body: ApiErrorResponse = {
    status: 'error',
    code: statusCode,
    error: {
      code: errorCode,
      message,
      details,
    },
    meta: buildMeta(),
  };
  res.status(statusCode).json(body);
}
