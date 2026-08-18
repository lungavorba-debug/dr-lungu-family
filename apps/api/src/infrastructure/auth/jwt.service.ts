import jwt from 'jsonwebtoken';

import type { AuthUser, JwtPayload } from '@medscreen/types';

import { parseApiEnv } from '@medscreen/config';

import { AppError } from '../../lib/app-error';



const JWT_ALGORITHM = 'HS256' as const;



function getEnv() {

  return parseApiEnv();

}



export class JwtService {

  sign(user: AuthUser, tokenVersion: number): string {

    const env = getEnv();

    if (!env.JWT_SECRET) {

      throw new AppError(500, 'CONFIG_ERROR', 'JWT secret is not configured.');

    }



    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {

      sub: user.id,

      email: user.email,

      role: user.role,

      tv: tokenVersion,

    };



    return jwt.sign(payload, env.JWT_SECRET, {

      algorithm: JWT_ALGORITHM,

      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],

    });

  }



  verify(token: string): JwtPayload {

    const env = getEnv();

    if (!env.JWT_SECRET) {

      throw new AppError(500, 'CONFIG_ERROR', 'JWT secret is not configured.');

    }



    try {

      const decoded = jwt.verify(token, env.JWT_SECRET, {

        algorithms: [JWT_ALGORITHM],

      });



      if (

        typeof decoded === 'string' ||

        !decoded.sub ||

        !decoded.email ||

        !decoded.role ||

        typeof decoded.tv !== 'number'

      ) {

        throw new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.');

      }



      return decoded as JwtPayload;

    } catch (error) {

      if (error instanceof AppError) {

        throw error;

      }

      throw new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.');

    }

  }

}



export const jwtService = new JwtService();


