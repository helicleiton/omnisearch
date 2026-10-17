// Núcleo compartilhado com o backend (lógica pura, sem Node). Ver metro.config.js.
import { resolveSearch, runOpenDataSearch, type JsonFetcher } from '../../../backend/src/core';
import { AppError } from '../../../backend/src/utils/AppError';
import { REQUEST_TIMEOUT_MS } from '../config/env';
import type { SearchRequestBody, SearchResult } from '../types/api';
import { ApiError } from './apiError';

/** fetch do navegador/React Native com timeout e cancelamento. */
function createFetcher(signal?: AbortSignal): JsonFetcher {
  return async <T,>(url: string) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const onAbort = () => controller.abort();
    signal?.addEventListener('abort', onAbort);

    try {
      // Só headers "simples": evita preflight CORS nas APIs públicas.
      const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
      if (res.status === 404) return { status: 404, data: null };
      if (res.status === 429) throw new ApiError('RATE_LIMITED', 'A fonte pública limitou as consultas. Aguarde um pouco.');
      if (!res.ok) throw new ApiError('UPSTREAM_ERROR', `A fonte pública respondeu com erro (HTTP ${res.status}).`);
      return { status: res.status, data: (await res.json()) as T };
    } catch (err) {
      if (err instanceof ApiError || signal?.aborted) throw err;
      if (controller.signal.aborted) throw new ApiError('TIMEOUT', 'A fonte pública demorou para responder. Tente novamente.');
      throw new ApiError('NETWORK_ERROR', 'Sem conexão com a internet ou fonte pública indisponível.');
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
  };
}

const newRequestId = (): string => `open-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Executa a busca no próprio aparelho usando apenas fontes abertas e gratuitas. */
export async function openDataSearch(body: SearchRequestBody, signal?: AbortSignal): Promise<SearchResult> {
  const resolved = resolveSearch(body.query, body.type);
  if (!resolved.ok) throw new ApiError('INVALID_INPUT', resolved.message);

  try {
    return await runOpenDataSearch(resolved.search, createFetcher(signal), newRequestId());
  } catch (err) {
    if (err instanceof AppError) throw new ApiError(err.code, err.message);
    throw err;
  }
}
