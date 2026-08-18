import type { AuthUser } from '@medscreen/types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      tokenVersion?: number;
    }
  }
}

export {};
