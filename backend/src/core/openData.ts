import type { ProviderOutcome, SearchResult, ValidatedSearch } from '../types/search.types';
import { AppError } from '../utils/AppError';
import { parseBrazilianPhone } from '../utils/phone';
import { buildCnpjOutcome, buildCpfOutcome } from './lookups/document';
import { buildEmailOutcome } from './lookups/email';
import { buildPhoneOutcome } from './lookups/phone';
import { fetchCnpj, fetchDddCities } from './open/brasilapi';
import { domainAcceptsMail } from './open/dns';
import type { JsonFetcher } from './open/fetcher';
import { fetchXposedBreaches } from './open/xposedornot';
import { assembleResult } from './result';

export const NAME_UNAVAILABLE_MESSAGE =
  'A busca por nome não está disponível: não há fonte pública e gratuita confiável para isso.';

async function openDataOutcome({ type, value }: ValidatedSearch, fetcher: JsonFetcher): Promise<ProviderOutcome> {
  switch (type) {
    case 'email': {
      const domain = value.split('@')[1] ?? '';
      const [breaches, acceptsMail] = await Promise.all([fetchXposedBreaches(fetcher, value), domainAcceptsMail(fetcher, domain)]);
      return buildEmailOutcome(value, breaches, {
        sources: ['XposedOrNot', 'DNS público (Google)'],
        isMock: false,
        domainAcceptsMail: acceptsMail,
      });
    }
    case 'cpf':
      // Não existe fonte gratuita e legal de dados de CPF: só o que o número revela.
      return buildCpfOutcome(value, null, 'Cálculo local (dígito verificador)', false);
    case 'cnpj':
      return buildCnpjOutcome(value, await fetchCnpj(fetcher, value), 'Receita Federal via BrasilAPI', false);
    case 'phone': {
      const phone = parseBrazilianPhone(value);
      if (!phone) throw new AppError('INVALID_INPUT', 'Telefone inválido.', 422);
      const cities = await fetchDddCities(fetcher, phone.ddd);
      return buildPhoneOutcome(phone, { carrier: null, cities, sources: cities.length ? ['BrasilAPI (DDD)'] : [], isMock: false });
    }
    case 'name':
      throw new AppError('INVALID_INPUT', NAME_UNAVAILABLE_MESSAGE, 422);
  }
}

/**
 * Busca usando apenas fontes abertas e gratuitas, sem servidor próprio.
 * Usada pelo app quando não há backend configurado (ex.: GitHub Pages).
 */
export async function runOpenDataSearch(search: ValidatedSearch, fetcher: JsonFetcher, requestId: string): Promise<SearchResult> {
  return assembleResult(search, await openDataOutcome(search, fetcher), requestId);
}
