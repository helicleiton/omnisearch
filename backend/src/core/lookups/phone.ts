import type { PhoneDetails, ProviderOutcome } from '../../types/search.types';
import { maskPhone } from '../../utils/mask';
import type { ParsedPhone } from '../../utils/phone';
import { pick, seededRandom } from '../random';

const MOBILE_CARRIERS = ['Vivo', 'Claro', 'TIM', 'Algar Telecom'] as const;
const LANDLINE_CARRIERS = ['Vivo', 'Claro', 'Oi', 'Algar Telecom'] as const;
const MAX_CITIES_SHOWN = 12;

export function mockCarrier(phone: ParsedPhone): string {
  const rand = seededRandom(`phone:${phone.national}`);
  return pick(rand, phone.lineType === 'móvel' ? MOBILE_CARRIERS : LANDLINE_CARRIERS);
}

interface PhoneOutcomeOptions {
  carrier: string | null;
  cities?: string[];
  sources: string[];
  isMock: boolean;
}

function citiesLabel(cities: string[]): string {
  if (cities.length === 0) return '—';
  const shown = cities.slice(0, MAX_CITIES_SHOWN).join(', ');
  return cities.length > MAX_CITIES_SHOWN ? `${shown} e mais ${cities.length - MAX_CITIES_SHOWN}` : shown;
}

export function buildPhoneOutcome(phone: ParsedPhone, opts: PhoneOutcomeOptions): ProviderOutcome<PhoneDetails> {
  const cities = opts.cities ?? [];
  const carrierLabel =
    opts.carrier === null ? 'Não identificada (portabilidade)' : opts.isMock ? `${opts.carrier} (simulada)` : opts.carrier;

  return {
    details: {
      kind: 'phone',
      validFormat: true,
      lineType: phone.lineType,
      ddd: phone.ddd,
      state: phone.state,
      carrier: opts.carrier,
      cities,
    },
    found: true,
    exposureScore: phone.lineType === 'móvel' ? 20 : 10,
    summary: `Telefone ${phone.lineType} válido, DDD ${phone.ddd} (${phone.state}).`,
    sections: [
      {
        title: 'Linha telefônica',
        items: [
          { label: 'Número', value: maskPhone(phone.national) },
          { label: 'Formato', value: 'Válido' },
          { label: 'Tipo de linha', value: phone.lineType },
          { label: 'DDD / UF', value: `${phone.ddd} / ${phone.state}` },
          { label: 'Operadora', value: carrierLabel },
          ...(cities.length > 0 ? [{ label: `Cidades do DDD (${cities.length})`, value: citiesLabel(cities) }] : []),
        ],
      },
    ],
    sources: ['Plano de numeração Anatel', ...opts.sources],
    isMock: opts.isMock,
  };
}
