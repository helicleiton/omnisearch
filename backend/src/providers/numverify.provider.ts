/**
 * NumVerify (APILayer) — validação de telefone e operadora.
 * Docs: https://numverify.com/documentation
 *
 * Requer NUMVERIFY_API_KEY no .env. Atenção: o plano gratuito só aceita HTTP,
 * o que expõe a chave em trânsito — use um plano com HTTPS em produção.
 * Observação: por causa da portabilidade numérica, a operadora informada pode
 * ser a original da faixa, não a atual. Para a operadora atual use um provedor
 * com acesso à base da ABR Telecom.
 */
import { env } from '../config/env';
import { fetchJson } from '../utils/http';

interface NumverifyResponse {
  valid: boolean;
  carrier: string;
  line_type: string | null;
  location: string;
}

export const isNumverifyConfigured = (): boolean => Boolean(env.NUMVERIFY_API_KEY);

export async function fetchCarrier(nationalNumber: string): Promise<{ valid: boolean; carrier: string }> {
  const params = new URLSearchParams({
    access_key: env.NUMVERIFY_API_KEY ?? '',
    number: `55${nationalNumber}`,
    format: '1',
  });
  const { data } = await fetchJson<NumverifyResponse>(`https://apilayer.net/api/validate?${params}`);
  return { valid: Boolean(data?.valid), carrier: data?.carrier || 'Não identificada' };
}
