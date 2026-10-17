import { timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

const safeEqual = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
};

/**
 * Exige o header x-api-key quando APP_API_KEY está definida.
 * É uma barreira contra uso casual da API, não autenticação de usuário:
 * em produção, prefira login (JWT/OAuth) e registre quem consultou o quê.
 */
export const requireApiKey: RequestHandler = (req, _res, next) => {
  if (!env.APP_API_KEY) return next();
  const provided = req.header('x-api-key') ?? '';
  if (!safeEqual(provided, env.APP_API_KEY)) {
    throw new AppError('UNAUTHORIZED', 'Chave de acesso inválida ou ausente.', 401);
  }
  next();
};
