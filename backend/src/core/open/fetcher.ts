/**
 * Função de rede injetada pela plataforma. O backend usa utils/http.ts (com
 * User-Agent e timeout); o app usa fetch do navegador/React Native.
 * 404 deve resolver com data = null; demais falhas devem lançar.
 */
export type JsonFetcher = <T>(url: string) => Promise<{ status: number; data: T | null }>;
