import { env } from '../config/env';
import { AppError } from './AppError';

export interface FetchJsonResult<T> {
  status: number;
  /** null quando o provedor responde 404 (o chamador decide o que significa). */
  data: T | null;
}

/** fetch com timeout. Erros HTTP (exceto 404) viram AppError UPSTREAM_ERROR. */
export async function fetchJson<T>(url: string, init: RequestInit = {}): Promise<FetchJsonResult<T>> {
  try {
    // Vários provedores (ex.: BrasilAPI atrás do Cloudflare) recusam requisições sem User-Agent.
    const headers = new Headers(init.headers);
    if (!headers.has('user-agent')) headers.set('user-agent', 'OmniSearch/0.1');
    if (!headers.has('accept')) headers.set('accept', 'application/json');

    const res = await fetch(url, { ...init, headers, signal: AbortSignal.timeout(env.EXTERNAL_TIMEOUT_MS) });
    if (res.status === 404) return { status: 404, data: null };
    if (res.status === 429) {
      throw new AppError('UPSTREAM_ERROR', 'O provedor externo limitou as requisições. Tente novamente mais tarde.', 503);
    }
    if (!res.ok) throw new AppError('UPSTREAM_ERROR', `O provedor externo respondeu com status ${res.status}.`, 502);
    return { status: res.status, data: (await res.json()) as T };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('UPSTREAM_ERROR', 'Falha ao contatar o provedor externo.', 502);
  }
}
