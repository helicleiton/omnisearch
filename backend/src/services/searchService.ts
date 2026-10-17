import { randomUUID } from 'node:crypto';
import { assembleResult } from '../core/result';
import type { ProviderOutcome, SearchResult, SearchType, ValidatedSearch } from '../types/search.types';
import { searchCnpj, searchCpf } from './documentService';
import { searchEmail } from './emailService';
import { searchName } from './nameService';
import { searchPhone } from './phoneService';

const HANDLERS: Record<SearchType, (value: string) => Promise<ProviderOutcome>> = {
  email: searchEmail,
  cpf: searchCpf,
  cnpj: searchCnpj,
  phone: searchPhone,
  name: searchName,
};

/** Orquestra a consulta: escolhe o serviço pelo tipo e monta a resposta consolidada. */
export async function runSearch(search: ValidatedSearch): Promise<SearchResult> {
  const outcome = await HANDLERS[search.type](search.value);
  return assembleResult(search, outcome, randomUUID());
}
