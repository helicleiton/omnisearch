/**
 * XposedOrNot: base aberta e gratuita de vazamentos, sem chave e com CORS liberado.
 * Docs: https://xposedornot.com/api_doc
 */
import type { Breach } from '../../types/search.types';
import type { JsonFetcher } from './fetcher';

interface XonBreachDetail {
  breach: string;
  domain: string;
  xposed_data: string;
  xposed_date: string; // normalmente só o ano
  verified: string; // "Yes" | "No"
  password_risk: string; // plaintext | easytohash | hardhash | unknown
}

interface XonAnalytics {
  ExposedBreaches: { breaches_details: XonBreachDetail[] } | null;
}

const DATA_CLASS_PT: Record<string, string> = {
  'Email addresses': 'E-mails',
  Passwords: 'Senhas',
  Names: 'Nomes',
  Usernames: 'Nomes de usuário',
  'Phone numbers': 'Telefones',
  'IP addresses': 'Endereços IP',
  'Physical addresses': 'Endereços',
  'Dates of birth': 'Datas de nascimento',
  Genders: 'Gênero',
  'Geographic locations': 'Localização',
  'Job titles': 'Cargos',
  Employers: 'Empregadores',
  'Social media profiles': 'Perfis em redes sociais',
  'Credit cards': 'Cartões de crédito',
  'Partial credit card data': 'Dados parciais de cartão',
  'Government issued IDs': 'Documentos de identidade',
};

export async function fetchXposedBreaches(fetcher: JsonFetcher, email: string): Promise<Breach[]> {
  const { data } = await fetcher<XonAnalytics>(
    `https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(email)}`,
  );
  const details = data?.ExposedBreaches?.breaches_details ?? [];

  return details
    .map((b) => {
      const exposedData = b.xposed_data
        .split(';')
        .map((d) => d.trim())
        .filter(Boolean)
        .map((d) => DATA_CLASS_PT[d] ?? d);
      // A fonte às vezes omite "Passwords" mas informa o risco da senha.
      if (b.password_risk !== 'unknown' && b.password_risk !== '' && !exposedData.includes('Senhas')) exposedData.push('Senhas');
      return {
        name: b.breach,
        domain: b.domain,
        breachDate: b.xposed_date,
        exposedData,
        verified: b.verified === 'Yes',
      };
    })
    .sort((a, b) => b.breachDate.localeCompare(a.breachDate));
}
