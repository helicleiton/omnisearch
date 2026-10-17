import type { RequestHandler } from 'express';
import { z } from 'zod';
import { resolveSearch } from '../core/validation';
import { SEARCH_TYPES, type SearchRequestBody, type ValidatedSearch } from '../types/search.types';
import { AppError } from '../utils/AppError';

/** Formato do body com Zod; as regras de negócio ficam em core/validation (compartilhadas com o app). */
export const searchSchema = z
  .object({
    query: z.string({ required_error: 'Informe um valor para consulta.', invalid_type_error: 'O campo query deve ser texto.' }),
    type: z.enum(['auto', ...SEARCH_TYPES]).default('auto'),
  })
  .strict('Envie apenas os campos "query" e "type".')
  .transform((input, ctx): ValidatedSearch => {
    const result = resolveSearch(input.query, input.type);
    if (!result.ok) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['query'], message: result.message });
      return z.NEVER;
    }
    return result.search;
  });

export interface SearchLocals {
  search: ValidatedSearch;
}

/** Valida o body, detecta o tipo e grava a entrada normalizada em res.locals.search. */
export const validateSearch: RequestHandler<Record<string, never>, unknown, SearchRequestBody, unknown, SearchLocals> = (
  req,
  res,
  next,
) => {
  const result = searchSchema.safeParse(req.body ?? {});
  if (!result.success) {
    const { fieldErrors, formErrors } = result.error.flatten();
    const fields = fieldErrors as Record<string, string[]>;
    const message = fields.query?.[0] ?? fields.type?.[0] ?? formErrors[0] ?? 'Entrada inválida.';
    throw new AppError('INVALID_INPUT', message, 422, fields);
  }
  res.locals.search = result.data;
  next();
};
