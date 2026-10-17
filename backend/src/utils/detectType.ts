import type { SearchType } from '../types/search.types';
import { isValidCnpj, isValidCpf, onlyDigits } from './documents';
import { parseBrazilianPhone } from './phone';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CPF_MASK_RE = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const CNPJ_MASK_RE = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
const NUMERIC_INPUT_RE = /^[\d\s().+\-/]+$/;
// Letras (inclui acentos), espaços, apóstrofo e hífen.
const NAME_CHARS_RE = /^[\p{L}\s'-]+$/u;
const NAME_CONNECTORS = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);

export const isEmail = (v: string): boolean => EMAIL_RE.test(v.trim());

export const isPhone = (v: string): boolean => parseBrazilianPhone(v) !== null;

/** Nome completo: ao menos nome + sobrenome, cada parte significativa com 2+ letras. */
export function isFullName(v: string): boolean {
  const value = v.trim().replace(/\s+/g, ' ');
  if (!NAME_CHARS_RE.test(value)) return false;
  const parts = value.split(' ').filter((p) => !NAME_CONNECTORS.has(p.toLowerCase()));
  return parts.length >= 2 && parts.every((p) => p.replace(/['-]/g, '').length >= 2);
}

/** Valida um valor contra um tipo escolhido explicitamente pelo usuário. */
export function isValidForType(type: SearchType, value: string): boolean {
  switch (type) {
    case 'email':
      return isEmail(value);
    case 'cpf':
      return isValidCpf(value);
    case 'cnpj':
      return isValidCnpj(value);
    case 'phone':
      return isPhone(value);
    case 'name':
      return isFullName(value);
  }
}

/**
 * Detecta o tipo da entrada. Ambiguidade CPF × celular (ambos com 11 dígitos):
 * a formatação explícita decide; sem formatação, CPF com dígito verificador válido vence.
 */
export function detectSearchType(raw: string): SearchType | null {
  const value = raw.trim();

  if (value.includes('@')) return isEmail(value) ? 'email' : null;
  if (CPF_MASK_RE.test(value)) return isValidCpf(value) ? 'cpf' : null;
  if (CNPJ_MASK_RE.test(value)) return isValidCnpj(value) ? 'cnpj' : null;

  if (NUMERIC_INPUT_RE.test(value)) {
    const digits = onlyDigits(value);
    if (/[()+]/.test(value)) return isPhone(value) ? 'phone' : null;
    if (digits.length === 14) return isValidCnpj(digits) ? 'cnpj' : null;
    if (digits.length === 11 && isValidCpf(digits)) return 'cpf';
    return isPhone(value) ? 'phone' : null;
  }

  return isFullName(value) ? 'name' : null;
}

/** Normaliza o valor para o formato canônico de cada tipo. */
export function normalizeValue(type: SearchType, raw: string): string {
  const value = raw.trim();
  switch (type) {
    case 'email':
      return value.toLowerCase();
    case 'cpf':
    case 'cnpj':
      return onlyDigits(value);
    case 'phone':
      return parseBrazilianPhone(value)?.national ?? onlyDigits(value);
    case 'name':
      return value.replace(/\s+/g, ' ');
  }
}
