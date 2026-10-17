import type { Request, Response } from 'express';
import type { SearchLocals } from '../middlewares/validateSearch';
import { runSearch } from '../services/searchService';
import type { SearchRequestBody, SearchSuccessResponse } from '../types/search.types';
import { maskByType } from '../utils/mask';

type SearchRequest = Request<Record<string, never>, SearchSuccessResponse, SearchRequestBody>;
type SearchResponse = Response<SearchSuccessResponse, SearchLocals>;

/**
 * POST /api/v1/search
 * Body: { "query": "nome@dominio.com", "type": "auto" | "email" | "cpf" | "cnpj" | "phone" | "name" }
 *
 * A entrada chega validada e normalizada pelo middleware validateSearch.
 * Erros (AppError) propagam para o errorHandler — o Express 5 captura rejeições async.
 */
export async function searchController(_req: SearchRequest, res: SearchResponse): Promise<void> {
  const search = res.locals.search;
  const startedAt = Date.now();

  const data = await runSearch(search);

  // Log de auditoria apenas com o valor mascarado.
  console.info(`[search] ${data.requestId} type=${search.type} q=${maskByType(search.type, search.value)} ${Date.now() - startedAt}ms`);

  res.status(200).json({ success: true, data });
}
