import { Router } from 'express';
import { parseScreeningVoiceSchema } from '@medscreen/shared';
import {
  createScreeningAiSessionController,
  extractScreeningController,
  getAiAvailabilityController,
  getScreeningAiSessionController,
  parseScreeningVoiceController,
  reviewScreeningExtractionController,
  syncTranscriptController,
  transcribeAudioController,
} from '../controllers/ai-screening.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody } from '../middleware/validate.middleware';
const aiScreeningRouter = Router();

aiScreeningRouter.get(
  '/availability',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  getAiAvailabilityController,
);

aiScreeningRouter.post(
  '/parse-screening-voice',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  validateBody(parseScreeningVoiceSchema),
  parseScreeningVoiceController,
);

aiScreeningRouter.post(
  '/sessions',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  createScreeningAiSessionController,
);

aiScreeningRouter.get(
  '/sessions/:id',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  getScreeningAiSessionController,
);

aiScreeningRouter.put(
  '/sessions/:id/transcript',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  syncTranscriptController,
);

aiScreeningRouter.post(
  '/sessions/:id/transcribe',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  transcribeAudioController,
);

aiScreeningRouter.post(
  '/sessions/:id/extract',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  extractScreeningController,
);

aiScreeningRouter.post(
  '/sessions/:id/review',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'MEDIC'),
  reviewScreeningExtractionController,
);

export { aiScreeningRouter };
