import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, searchApi } from '../services/api';
import type { SearchResult, SearchTypeInput } from '../types/api';

export type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; result: SearchResult }
  | { status: 'error'; error: ApiError };

export function useSearch() {
  const [state, setState] = useState<SearchState>({ status: 'idle' });
  const controllerRef = useRef<AbortController | null>(null);

  // Cancela requisição pendente ao desmontar.
  useEffect(() => () => controllerRef.current?.abort(), []);

  const search = useCallback(async (query: string, type: SearchTypeInput) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setState({ status: 'loading' });
    try {
      const result = await searchApi({ query: query.trim(), type }, controller.signal);
      if (!controller.signal.aborted) setState({ status: 'success', result });
    } catch (err) {
      if (controller.signal.aborted) return;
      const error = err instanceof ApiError ? err : new ApiError('INTERNAL_ERROR', 'Erro inesperado. Tente novamente.');
      setState({ status: 'error', error });
    }
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setState({ status: 'idle' });
  }, []);

  return { state, search, reset, isLoading: state.status === 'loading' };
}
