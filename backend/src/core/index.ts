/**
 * Núcleo de domínio sem dependências de plataforma (sem Node, Express ou dotenv).
 * Usado pelo backend e, sem servidor, pelo app mobile/web (GitHub Pages).
 * A rede entra por injeção (JsonFetcher). Não importe config/, providers/ ou módulos Node aqui.
 */
export type { JsonFetcher } from './open/fetcher';
export { NAME_UNAVAILABLE_MESSAGE, runOpenDataSearch } from './openData';
export { assembleResult, DISCLAIMER } from './result';
export { resolveSearch, QUERY_MAX_LENGTH, QUERY_MIN_LENGTH, type ResolveResult } from './validation';
