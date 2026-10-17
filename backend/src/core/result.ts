import type { ProviderOutcome, SearchResult, ValidatedSearch } from '../types/search.types';
import { maskByType } from '../utils/mask';
import { statusFromScore } from '../utils/score';

export const DISCLAIMER =
  'Resultados informativos, baseados em fontes públicas ou autorizadas. O uso de dados pessoais deve respeitar a LGPD (Lei 13.709/2018).';

/** Monta a resposta consolidada. O valor original nunca sai daqui, só a versão mascarada. */
export function assembleResult(search: ValidatedSearch, outcome: ProviderOutcome, requestId: string): SearchResult {
  return {
    requestId,
    type: search.type,
    autoDetected: search.autoDetected,
    maskedQuery: maskByType(search.type, search.value),
    found: outcome.found,
    status: statusFromScore(outcome.exposureScore),
    exposureScore: outcome.exposureScore,
    summary: outcome.summary,
    sections: outcome.sections,
    details: outcome.details,
    sources: outcome.sources,
    isMock: outcome.isMock,
    searchedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER,
  };
}
