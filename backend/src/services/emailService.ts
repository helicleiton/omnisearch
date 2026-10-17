import { env } from '../config/env';
import { buildEmailOutcome, mockBreaches } from '../core/lookups/email';
import { domainAcceptsMail } from '../core/open/dns';
import { fetchXposedBreaches } from '../core/open/xposedornot';
import { fetchHibpBreaches, isHibpConfigured } from '../providers/hibp.provider';
import type { EmailDetails, ProviderOutcome } from '../types/search.types';
import { fetchJson } from '../utils/http';

/**
 * USE_MOCKS=true  → dados fictícios.
 * USE_MOCKS=false → Have I Been Pwned se HIBP_API_KEY existir (pago); senão XposedOrNot (gratuito).
 */
export async function searchEmail(email: string): Promise<ProviderOutcome<EmailDetails>> {
  if (env.USE_MOCKS) return buildEmailOutcome(email, mockBreaches(email), { sources: ['Simulação (mock)'], isMock: true });

  const useHibp = isHibpConfigured();
  const domain = email.split('@')[1] ?? '';
  const [breaches, acceptsMail] = await Promise.all([
    useHibp ? fetchHibpBreaches(email) : fetchXposedBreaches(fetchJson, email),
    domainAcceptsMail(fetchJson, domain),
  ]);

  return buildEmailOutcome(email, breaches, {
    sources: [useHibp ? 'Have I Been Pwned' : 'XposedOrNot', 'DNS público (Google)'],
    isMock: false,
    domainAcceptsMail: acceptsMail,
  });
}
