import { API_URL, APP_API_KEY, REQUEST_TIMEOUT_MS } from '../config/env';
import type { SearchRequestBody, SearchResponse, SearchResult } from '../types/api';
import { ApiError } from './apiError';
import { openDataSearch } from './openData';

export { ApiError };

/**
 * Executa a busca. Sem EXPO_PUBLIC_API_URL, roda no próprio aparelho com fontes
 * abertas (modo usado no GitHub Pages); com ela, chama POST /api/v1/search.
 * Resolve com o resultado ou rejeita com ApiError. `signal` permite cancelar.
 */
export async function searchApi(body: SearchRequestBody, signal?: AbortSignal): Promise<SearchResult> {
  if (!API_URL) return openDataSearch(body, signal);

  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS);
  const onExternalAbort = () => timeout.abort();
  signal?.addEventListener('abort', onExternalAbort);

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/v1/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(APP_API_KEY ? { 'x-api-key': APP_API_KEY } : {}),
      },
      body: JSON.stringify(body),
      signal: timeout.signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err; // cancelamento intencional: o chamador ignora
    if (timeout.signal.aborted) {
      throw new ApiError('TIMEOUT', 'O servidor demorou para responder. Tente novamente.');
    }
    throw new ApiError('NETWORK_ERROR', 'Sem conexão com o servidor. Verifique sua internet e a URL da API.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onExternalAbort);
  }

  let payload: SearchResponse;
  try {
    payload = (await response.json()) as SearchResponse;
  } catch {
    throw new ApiError('INTERNAL_ERROR', `Resposta inesperada do servidor (HTTP ${response.status}).`);
  }

  if (!payload.success) {
    throw new ApiError(payload.error.code, payload.error.message, payload.error.fields);
  }
  return payload.data;
}
