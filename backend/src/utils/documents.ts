/** Remove tudo que não for dígito. */
export const onlyDigits = (value: string): string => value.replace(/\D/g, '');

const allSameDigits = (digits: string): boolean => /^(\d)\1+$/.test(digits);

/** Valida CPF pelos dígitos verificadores (módulo 11). */
export function isValidCpf(input: string): boolean {
  const cpf = onlyDigits(input);
  if (cpf.length !== 11 || allSameDigits(cpf)) return false;

  const calcDigit = (slice: string, startWeight: number): number => {
    const sum = [...slice].reduce((acc, d, i) => acc + Number(d) * (startWeight - i), 0);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return calcDigit(cpf.slice(0, 9), 10) === Number(cpf[9]) && calcDigit(cpf.slice(0, 10), 11) === Number(cpf[10]);
}

/** Valida CNPJ pelos dígitos verificadores. */
export function isValidCnpj(input: string): boolean {
  const cnpj = onlyDigits(input);
  if (cnpj.length !== 14 || allSameDigits(cnpj)) return false;

  const calcDigit = (slice: string): number => {
    // Pesos 2..9 aplicados da direita para a esquerda.
    const sum = [...slice].reverse().reduce((acc, d, i) => acc + Number(d) * ((i % 8) + 2), 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  return calcDigit(cnpj.slice(0, 12)) === Number(cnpj[12]) && calcDigit(cnpj.slice(0, 13)) === Number(cnpj[13]);
}

/** O 9º dígito do CPF indica a região fiscal de emissão (informação pública da RFB). */
const FISCAL_REGIONS: Record<string, string> = {
  '0': 'RS',
  '1': 'DF, GO, MS, MT, TO',
  '2': 'AC, AM, AP, PA, RO, RR',
  '3': 'CE, MA, PI',
  '4': 'AL, PB, PE, RN',
  '5': 'BA, SE',
  '6': 'MG',
  '7': 'ES, RJ',
  '8': 'SP',
  '9': 'PR, SC',
};

export const cpfFiscalRegion = (cpf: string): string => FISCAL_REGIONS[onlyDigits(cpf)[8] ?? ''] ?? 'Desconhecida';
