import cors from 'cors';
import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { parseApiEnv } from '@medscreen/config';
import { createDevCorsOrigin } from './infrastructure/cors/dev-cors-origin';
import { apiRouter } from './presentation/routes';
import { metaWhatsAppWebhookRouter } from './presentation/routes/meta-whatsapp-webhook.routes';
import { registerWhatsAppQrRoute } from './presentation/routes/whatsapp-qr.routes';
import {
  errorMiddleware,
  notFoundMiddleware,
} from './presentation/middleware/error.middleware';

export function createApp(): Express {
  const env = parseApiEnv();
  const app = express();

  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(helmet());
  app.use(
    cors({
      origin:
        env.NODE_ENV === 'development'
          ? createDevCorsOrigin(env.CORS_ORIGIN)
          : env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '10mb' }));

  // Meta WhatsApp webhooks — no rate limit (external callbacks)
  app.use('/api/webhooks/meta/whatsapp', metaWhatsAppWebhookRouter);

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.get('/api/v1/health', (_req, res) => {
    res.status(200).json({
      status: 'success',
      code: 200,
      message: 'Server is healthy.',
      data: { uptime: process.uptime() },
      meta: { timestamp: new Date().toISOString(), version: '1.0.0' },
    });
  });

  registerWhatsAppQrRoute(app);

  app.use('/api/v1', apiRouter);
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
