import type { RiskStatus } from '../types/search.types';

export const clampScore = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

/** 0–29 seguro · 30–64 atenção · 65–100 alerta */
export function statusFromScore(score: number): RiskStatus {
  if (score >= 65) return 'alert';
  if (score >= 30) return 'attention';
  return 'safe';
}

/** dd/mm/aaaa a partir de ISO yyyy-mm-dd. */
export const formatDateBR = (iso: string): string => {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
};
