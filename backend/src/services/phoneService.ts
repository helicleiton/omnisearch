import { env } from '../config/env';
import { buildPhoneOutcome, mockCarrier } from '../core/lookups/phone';
import { fetchDddCities } from '../core/open/brasilapi';
import { fetchCarrier, isNumverifyConfigured } from '../providers/numverify.provider';
import type { PhoneDetails, ProviderOutcome } from '../types/search.types';
import { AppError } from '../utils/AppError';
import { fetchJson } from '../utils/http';
import { parseBrazilianPhone } from '../utils/phone';

/**
 * USE_MOCKS=true  → operadora fictícia.
 * USE_MOCKS=false → cidades do DDD via BrasilAPI (gratuito); operadora só com NUMVERIFY_API_KEY.
 */
export async function searchPhone(phone: string): Promise<ProviderOutcome<PhoneDetails>> {
  const parsed = parseBrazilianPhone(phone);
  if (!parsed) throw new AppError('INVALID_INPUT', 'Telefone inválido.', 422);

  if (env.USE_MOCKS) {
    return buildPhoneOutcome(parsed, { carrier: mockCarrier(parsed), sources: ['Simulação (mock)'], isMock: true });
  }

  const useNumverify = isNumverifyConfigured();
  const [cities, carrier] = await Promise.all([
    fetchDddCities(fetchJson, parsed.ddd),
    useNumverify ? fetchCarrier(parsed.national).then((r) => r.carrier) : Promise.resolve(null),
  ]);

  return buildPhoneOutcome(parsed, {
    carrier,
    cities,
    sources: [...(cities.length ? ['BrasilAPI (DDD)'] : []), ...(useNumverify ? ['NumVerify'] : [])],
    isMock: false,
  });
}
