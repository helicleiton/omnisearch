import type { KeyboardTypeOptions } from 'react-native';
import { OPEN_DATA_MODE } from '../config/env';
import type { SearchType, SearchTypeInput } from '../types/api';

interface SearchTypeOption {
  value: SearchTypeInput;
  label: string;
  icon: string;
  placeholder: string;
  keyboardType: KeyboardTypeOptions;
}

const ALL_OPTIONS: readonly SearchTypeOption[] = [
  {
    value: 'auto',
    label: 'Auto-detectar',
    icon: 'auto-fix',
    placeholder: OPEN_DATA_MODE ? 'E-mail, CPF, CNPJ ou telefone' : 'E-mail, CPF, telefone ou nome',
    keyboardType: 'default',
  },
  { value: 'email', label: 'E-mail', icon: 'email-outline', placeholder: 'nome@dominio.com', keyboardType: 'email-address' },
  { value: 'cpf', label: 'CPF', icon: 'card-account-details-outline', placeholder: '000.000.000-00', keyboardType: 'number-pad' },
  { value: 'cnpj', label: 'CNPJ', icon: 'domain', placeholder: '00.000.000/0000-00', keyboardType: 'number-pad' },
  { value: 'phone', label: 'Telefone', icon: 'phone-outline', placeholder: '(11) 91234-5678', keyboardType: 'phone-pad' },
  { value: 'name', label: 'Nome', icon: 'account-outline', placeholder: 'Nome e sobrenome', keyboardType: 'default' },
];

/** Sem backend não há fonte gratuita para busca por nome, então a opção some. */
export const SEARCH_TYPE_OPTIONS = ALL_OPTIONS.filter((o) => !(OPEN_DATA_MODE && o.value === 'name'));

export const TYPE_LABELS: Record<SearchType, string> = {
  email: 'E-mail',
  cpf: 'CPF',
  cnpj: 'CNPJ',
  phone: 'Telefone',
  name: 'Nome',
};

/**
 * Palpite rápido no cliente, só para feedback visual enquanto o usuário digita.
 * A detecção e a validação de verdade acontecem no backend.
 */
export function guessType(raw: string): SearchType | null {
  const value = raw.trim();
  if (value.length < 3) return null;
  if (value.includes('@')) return 'email';
  if (/^[\d\s().+\-/]+$/.test(value)) {
    const digits = value.replace(/\D/g, '');
    if (/[()+]/.test(value)) return 'phone';
    if (digits.length === 14) return 'cnpj';
    if (digits.length === 11) return 'cpf'; // pode ser celular sem formatação — o backend desempata pelo dígito verificador
    if (digits.length === 10) return 'phone';
    return null;
  }
  return /^[\p{L}'-]+(\s+[\p{L}'-]+)+$/u.test(value) ? 'name' : null;
}
