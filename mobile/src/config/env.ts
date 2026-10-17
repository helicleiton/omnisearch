/**
 * Variáveis EXPO_PUBLIC_* são embutidas no bundle no build. Nunca coloque
 * chaves de provedores aqui: elas ficam apenas no backend.
 */

/** URL do backend. Vazia = modo fontes abertas (o app consulta APIs gratuitas direto, sem servidor). */
export const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '') || null;
export const OPEN_DATA_MODE = API_URL === null;

export const APP_API_KEY = process.env.EXPO_PUBLIC_APP_API_KEY || undefined;
export const REQUEST_TIMEOUT_MS = 15_000;
