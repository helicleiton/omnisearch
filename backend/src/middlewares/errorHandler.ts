import type { ErrorRequestHandler, RequestHandler } from 'express';
import { env } from '../config/env';
import type { ApiErrorResponse } from '../types/search.types';
import { AppError } from '../utils/AppError';

export const notFoundHandler: RequestHandler = (req, res) => {
  const body: ApiErrorResponse = {
    success: false,
    error: { code: 'NOT_FOUND', message: `Rota ${req.method} ${req.path} não encontrada.` },
  };
  res.status(404).json(body);
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    const body: ApiErrorResponse = {
      success: false,
      error: { code: err.code, message: err.message, ...(err.fields ? { fields: err.fields } : {}) },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // JSON malformado no body (lançado pelo express.json()).
  if (err?.type === 'entity.parse.failed' || err?.type === 'entity.too.large') {
    const body: ApiErrorResponse = {
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Corpo da requisição inválido.' },
    };
    res.status(400).json(body);
    return;
  }

  // Nunca logar o body: ele contém o dado pesquisado.
  console.error('[unhandled]', env.NODE_ENV === 'production' ? (err as Error)?.message : err);
  const body: ApiErrorResponse = {
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Erro interno. Tente novamente mais tarde.' },
  };
  res.status(500).json(body);
};
