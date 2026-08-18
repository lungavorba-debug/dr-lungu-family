import type { NextFunction, Request, Response } from 'express';

import { toAuthUser } from '../../domain/mappers/user.mapper';

import { jwtService } from '../../infrastructure/auth/jwt.service';

import { userRepository } from '../../infrastructure/container';

import { AppError } from '../../lib/app-error';



export async function authenticate(

  req: Request,

  _res: Response,

  next: NextFunction,

): Promise<void> {

  try {

    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {

      throw new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.');

    }



    const token = header.slice('Bearer '.length).trim();

    if (!token) {

      throw new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.');

    }



    const payload = jwtService.verify(token);

    const user = await userRepository.findById(payload.sub);



    if (!user) {

      throw new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.');

    }



    if (user.email !== payload.email) {

      throw new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.');

    }



    if (user.roleName !== payload.role) {

      throw new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.');

    }



    if (user.tokenVersion !== payload.tv) {

      throw new AppError(401, 'SESSION_REVOKED', 'Sesiunea a expirat. Autentificați-vă din nou.');

    }



    if (!user.active) {

      throw new AppError(403, 'ACCOUNT_INACTIVE', 'Contul este dezactivat.');

    }



    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {

      throw new AppError(423, 'ACCOUNT_LOCKED', 'Contul este blocat temporar.');

    }



    req.user = toAuthUser(user);

    req.tokenVersion = user.tokenVersion;

    next();

  } catch (error) {

    next(error);

  }

}


