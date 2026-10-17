/** DNS-over-HTTPS público do Google (gratuito, CORS liberado): o domínio recebe e-mail? */
import type { JsonFetcher } from './fetcher';

interface DohResponse {
  Status: number; // 0 = NOERROR, 3 = NXDOMAIN
  Answer?: { type: number; data: string }[];
}

const MX = 15;

/** true se há registro MX; false se não há; null se a consulta falhar. */
export async function domainAcceptsMail(fetcher: JsonFetcher, domain: string): Promise<boolean | null> {
  try {
    const { data } = await fetcher<DohResponse>(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`);
    if (!data) return null;
    return data.Status === 0 && (data.Answer ?? []).some((a) => a.type === MX);
  } catch {
    return null; // verificação complementar: não derruba a busca
  }
}
