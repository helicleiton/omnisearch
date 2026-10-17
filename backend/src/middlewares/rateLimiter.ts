import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import type { ApiErrorResponse } from '../types/search.types';

const limitedBody = (message: string): ApiErrorResponse => ({
  success: false,
  error: { code: 'RATE_LIMITED', message },
});

/** Limite geral da API (por IP). */
export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX * 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limitedBody('Muitas requisições. Aguarde um pouco e tente novamente.'),
});

/** Limite mais restrito para buscas — protege as cotas pagas dos provedores e dificulta enumeração em massa. */
export const searchRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limitedBody('Limite de consultas atingido. Tente novamente em instantes.'),
});
