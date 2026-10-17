import { env } from '../config/env';
import { buildCnpjOutcome, buildCpfOutcome, mockCnpj, mockCpfRecord } from '../core/lookups/document';
import { fetchCnpj } from '../core/open/brasilapi';
import type { CnpjDetails, CpfDetails, ProviderOutcome } from '../types/search.types';
import { fetchJson } from '../utils/http';

/**
 * CPF: dado pessoal protegido pela LGPD.
 *
 * Não existe API pública e gratuita da Receita para CPF. Integração real exige
 * base legal (art. 7º da LGPD) e um provedor contratado, por exemplo:
 *   - Serpro "Consulta CPF" (oficial): https://servicos.serpro.gov.br/consulta-cpf
 *     → adicione SERPRO_CONSUMER_KEY/SECRET ao .env e ao config/env.ts,
 *       obtenha um token OAuth2 e chame o endpoint /consulta-cpf-df/v1/cpf/{cpf}.
 * Sem provedor, o modo real devolve apenas o que é derivável do próprio número
 * (dígito verificador e região fiscal).
 */
export async function searchCpf(cpf: string): Promise<ProviderOutcome<CpfDetails>> {
  if (env.USE_MOCKS) return buildCpfOutcome(cpf, mockCpfRecord(cpf), 'Simulação (mock)', true);
  return buildCpfOutcome(cpf, null, 'Cálculo local (dígito verificador)', false);
}

/** CNPJ: dado público. Fonte real gratuita: BrasilAPI (ver core/open/brasilapi.ts). */
export async function searchCnpj(cnpj: string): Promise<ProviderOutcome<CnpjDetails>> {
  if (env.USE_MOCKS) return buildCnpjOutcome(cnpj, mockCnpj(cnpj), 'Simulação (mock)', true);
  return buildCnpjOutcome(cnpj, await fetchCnpj(fetchJson, cnpj, env.CNPJ_PROVIDER_URL), 'Receita Federal via BrasilAPI', false);
}
