/**
 * BrasilAPI: dados públicos (Receita Federal, Anatel), gratuita, sem chave, CORS liberado.
 * Docs: https://brasilapi.com.br/docs
 *
 * Alternativa para CNPJ: ReceitaWS (https://developers.receitaws.com.br). Os campos
 * diferem (nome, fantasia, situacao, abertura...), então exige um mapper próprio.
 */
import type { CnpjDetails } from '../../types/search.types';
import { AppError } from '../../utils/AppError';
import type { JsonFetcher } from './fetcher';

export const BRASILAPI_CNPJ_URL = 'https://brasilapi.com.br/api/cnpj/v1';

interface BrasilApiCnpj {
  razao_social: string;
  nome_fantasia: string | null;
  descricao_situacao_cadastral: string;
  data_inicio_atividade: string | null;
  cnae_fiscal_descricao: string | null;
  municipio: string | null;
  uf: string | null;
}

export async function fetchCnpj(fetcher: JsonFetcher, cnpj: string, baseUrl = BRASILAPI_CNPJ_URL): Promise<CnpjDetails> {
  const { data } = await fetcher<BrasilApiCnpj>(`${baseUrl}/${cnpj}`);
  if (!data) throw new AppError('NOT_FOUND', 'CNPJ não encontrado na base da Receita Federal.', 404);

  return {
    kind: 'cnpj',
    corporateName: data.razao_social,
    tradeName: data.nome_fantasia || null,
    registrationStatus: data.descricao_situacao_cadastral,
    openingDate: data.data_inicio_atividade,
    mainActivity: data.cnae_fiscal_descricao,
    city: data.municipio,
    state: data.uf,
  };
}

/** Cidades atendidas por um DDD. Complementar: falhas viram lista vazia. */
export async function fetchDddCities(fetcher: JsonFetcher, ddd: string): Promise<string[]> {
  try {
    const { data } = await fetcher<{ state: string; cities: string[] }>(`https://brasilapi.com.br/api/ddd/v1/${ddd}`);
    return (data?.cities ?? []).slice().sort((a, b) => a.localeCompare(b, 'pt-BR'));
  } catch {
    return [];
  }
}
