/**
 * Contratos da API: fonte única em backend/src/types/search.types.ts
 * (o app já compartilha o núcleo do backend; ver metro.config.js).
 */
import type { ApiErrorCode } from '../../../backend/src/types/search.types';

export type {
  ApiErrorCode,
  ApiErrorResponse,
  DetailItem,
  DetailSection,
  RiskStatus,
  SearchDetails,
  SearchRequestBody,
  SearchResponse,
  SearchResult,
  SearchSuccessResponse,
  SearchType,
  SearchTypeInput,
} from '../../../backend/src/types/search.types';

/** Erros que só existem no cliente (a requisição nem chegou a uma resposta). */
export type ClientErrorCode = ApiErrorCode | 'NETWORK_ERROR' | 'TIMEOUT';
