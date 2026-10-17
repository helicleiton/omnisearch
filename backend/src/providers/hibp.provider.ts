/**
 * Have I Been Pwned — vazamentos associados a um e-mail.
 * Docs: https://haveibeenpwned.com/API/v3#BreachesForAccount
 *
 * Requer HIBP_API_KEY no .env (plano pago). O header user-agent é obrigatório.
 * A API tem rate limit por plano; respostas 429 viram UPSTREAM_ERROR (503).
 */
import { env } from '../config/env';
import type { Breach } from '../types/search.types';
import { fetchJson } from '../utils/http';

interface HibpBreach {
  Name: string;
  Title: string;
  Domain: string;
  BreachDate: string;
  DataClasses: string[];
  IsVerified: boolean;
}

const BASE_URL = 'https://haveibeenpwned.com/api/v3';

export const isHibpConfigured = (): boolean => Boolean(env.HIBP_API_KEY);

export async function fetchHibpBreaches(email: string): Promise<Breach[]> {
  const url = `${BASE_URL}/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`;
  const { data } = await fetchJson<HibpBreach[]>(url, {
    headers: {
      'hibp-api-key': env.HIBP_API_KEY ?? '',
      'user-agent': 'OmniSearch/0.1',
    },
  });

  // 404 = nenhum vazamento encontrado para a conta.
  return (data ?? []).map((b) => ({
    name: b.Title || b.Name,
    domain: b.Domain,
    breachDate: b.BreachDate,
    exposedData: b.DataClasses,
    verified: b.IsVerified,
  }));
}
