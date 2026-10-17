import { onlyDigits } from './documents';

const fill = (keys: string[], uf: string): Record<string, string> => Object.fromEntries(keys.map((k) => [k, uf]));

/** DDDs válidos no Brasil e suas UFs (plano de numeração da Anatel). */
const DDD_TO_UF: Record<string, string> = {
  ...fill(['11', '12', '13', '14', '15', '16', '17', '18', '19'], 'SP'),
  ...fill(['21', '22', '24'], 'RJ'),
  ...fill(['27', '28'], 'ES'),
  ...fill(['31', '32', '33', '34', '35', '37', '38'], 'MG'),
  ...fill(['41', '42', '43', '44', '45', '46'], 'PR'),
  ...fill(['47', '48', '49'], 'SC'),
  ...fill(['51', '53', '54', '55'], 'RS'),
  '61': 'DF',
  ...fill(['62', '64'], 'GO'),
  '63': 'TO',
  ...fill(['65', '66'], 'MT'),
  '67': 'MS',
  '68': 'AC',
  '69': 'RO',
  ...fill(['71', '73', '74', '75', '77'], 'BA'),
  '79': 'SE',
  ...fill(['81', '87'], 'PE'),
  '82': 'AL',
  '83': 'PB',
  '84': 'RN',
  ...fill(['85', '88'], 'CE'),
  ...fill(['86', '89'], 'PI'),
  ...fill(['91', '93', '94'], 'PA'),
  ...fill(['92', '97'], 'AM'),
  '95': 'RR',
  '96': 'AP',
  ...fill(['98', '99'], 'MA'),
};

export interface ParsedPhone {
  /** DDD + número, sem o código do país. */
  national: string;
  ddd: string;
  number: string;
  state: string;
  lineType: 'móvel' | 'fixo';
}

/**
 * Interpreta um telefone brasileiro. Aceita +55, parênteses, traços e espaços.
 * Móvel: 9 dígitos começando com 9. Fixo: 8 dígitos começando com 2–5.
 */
export function parseBrazilianPhone(input: string): ParsedPhone | null {
  let digits = onlyDigits(input);
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) digits = digits.slice(2);
  if (digits.length !== 10 && digits.length !== 11) return null;

  const ddd = digits.slice(0, 2);
  const number = digits.slice(2);
  const state = DDD_TO_UF[ddd];
  if (!state) return null;

  if (number.length === 9 && number.startsWith('9')) return { national: digits, ddd, number, state, lineType: 'móvel' };
  if (number.length === 8 && /^[2-5]/.test(number)) return { national: digits, ddd, number, state, lineType: 'fixo' };
  return null;
}
