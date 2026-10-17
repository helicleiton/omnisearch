import type { SearchType } from '../types/search.types';
import { onlyDigits } from './documents';

const stars = (n: number): string => '*'.repeat(Math.max(n, 0));

/** joao.silva@gmail.com → jo********@g****.com */
export function maskEmail(email: string): string {
  const [user = '', domain = ''] = email.split('@');
  const dot = domain.lastIndexOf('.');
  const host = dot > 0 ? domain.slice(0, dot) : domain;
  const tld = dot > 0 ? domain.slice(dot) : '';
  const visible = user.length <= 2 ? user.slice(0, 1) : user.slice(0, 2);
  return `${visible}${stars(user.length - visible.length)}@${host.slice(0, 1)}${stars(host.length - 1)}${tld}`;
}

/** 12345678909 → ***.456.789-** (padrão usado por órgãos públicos sob a LGPD) */
export function maskCpf(cpf: string): string {
  const d = onlyDigits(cpf);
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
}

/** CNPJ é dado público de pessoa jurídica: apenas formatado, não mascarado. */
export function formatCnpj(cnpj: string): string {
  return onlyDigits(cnpj).replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

/** 11987654321 → (11) 9****-4321 */
export function maskPhone(phone: string): string {
  const d = onlyDigits(phone);
  const number = d.slice(2);
  const prefix = number.length === 9 ? `9${stars(4)}` : stars(4);
  return `(${d.slice(0, 2)}) ${prefix}-${number.slice(-4)}`;
}

/** Maria Aparecida da Silva → Maria A******* da S**** */
export function maskName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part, i) => (i === 0 || part.length <= 3 ? part : `${part.slice(0, 1)}${stars(part.length - 1)}`))
    .join(' ');
}

export function maskByType(type: SearchType, value: string): string {
  switch (type) {
    case 'email':
      return maskEmail(value);
    case 'cpf':
      return maskCpf(value);
    case 'cnpj':
      return formatCnpj(value);
    case 'phone':
      return maskPhone(value);
    case 'name':
      return maskName(value);
  }
}
