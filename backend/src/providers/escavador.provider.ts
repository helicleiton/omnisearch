/**
 * Escavador — processos judiciais públicos e citações em Diários Oficiais.
 * Docs: https://api.escavador.com/v2/docs
 *
 * Requer ESCAVADOR_API_TOKEN no .env (consultas são cobradas por crédito).
 * Confira na documentação oficial o endpoint e o formato de resposta vigentes
 * antes de ativar em produção — o mapeamento abaixo cobre só os campos usados.
 */
import { env } from '../config/env';
import type { PublicOccurrence } from '../types/search.types';
import { fetchJson } from '../utils/http';

interface EscavadorProcesso {
  numero_cnj: string;
  titulo_polo_ativo?: string;
  titulo_polo_passivo?: string;
  data_ultima_movimentacao?: string;
  fontes?: { nome?: string; sigla?: string }[];
}

interface EscavadorResponse {
  items?: EscavadorProcesso[];
}

export const isEscavadorConfigured = (): boolean => Boolean(env.ESCAVADOR_API_TOKEN);

export async function fetchPublicProcesses(fullName: string): Promise<PublicOccurrence[]> {
  const params = new URLSearchParams({ nome: fullName });
  const { data } = await fetchJson<EscavadorResponse>(`https://api.escavador.com/api/v2/envolvido/processos?${params}`, {
    headers: {
      Authorization: `Bearer ${env.ESCAVADOR_API_TOKEN ?? ''}`,
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  return (data?.items ?? []).map((p) => ({
    source: p.fontes?.[0]?.sigla ?? p.fontes?.[0]?.nome ?? 'Escavador',
    category: 'Processo público',
    title: `Processo ${p.numero_cnj}${p.titulo_polo_passivo ? ` — ${p.titulo_polo_ativo ?? ''} x ${p.titulo_polo_passivo}` : ''}`,
    date: p.data_ultima_movimentacao ?? '',
  }));
}
