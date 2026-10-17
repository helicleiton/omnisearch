import type { SearchType, SearchTypeInput, ValidatedSearch } from '../types/search.types';
import { detectSearchType, isValidForType, normalizeValue } from '../utils/detectType';

export const QUERY_MIN_LENGTH = 3;
export const QUERY_MAX_LENGTH = 150;

const INVALID_MESSAGES: Record<SearchType, string> = {
  email: 'E-mail inválido. Ex.: nome@dominio.com',
  cpf: 'CPF inválido. Informe os 11 dígitos (os dígitos verificadores são conferidos).',
  cnpj: 'CNPJ inválido. Informe os 14 dígitos.',
  phone: 'Telefone inválido. Informe DDD + número, ex.: (11) 91234-5678.',
  name: 'Informe o nome completo (nome e sobrenome), apenas letras.',
};

export type ResolveResult = { ok: true; search: ValidatedSearch } | { ok: false; message: string };

/** Valida tamanho, detecta (ou confere) o tipo e normaliza a consulta. */
export function resolveSearch(rawQuery: string, type: SearchTypeInput = 'auto'): ResolveResult {
  const query = rawQuery.trim();
  if (query.length < QUERY_MIN_LENGTH) {
    return { ok: false, message: `A consulta deve ter ao menos ${QUERY_MIN_LENGTH} caracteres.` };
  }
  if (query.length > QUERY_MAX_LENGTH) {
    return { ok: false, message: `A consulta deve ter no máximo ${QUERY_MAX_LENGTH} caracteres.` };
  }

  const autoDetected = type === 'auto';
  const resolved = autoDetected ? detectSearchType(query) : type;
  if (!resolved) {
    return {
      ok: false,
      message: 'Não foi possível identificar o tipo. Informe um e-mail, CPF, CNPJ, telefone com DDD ou nome completo.',
    };
  }
  if (!autoDetected && !isValidForType(resolved, query)) {
    return { ok: false, message: INVALID_MESSAGES[resolved] };
  }

  return { ok: true, search: { type: resolved, value: normalizeValue(resolved, query), autoDetected } };
}
