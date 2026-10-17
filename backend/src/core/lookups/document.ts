import type { CnpjDetails, CpfDetails, CpfStatus, ProviderOutcome } from '../../types/search.types';
import { cpfFiscalRegion, isValidCpf } from '../../utils/documents';
import { formatCnpj, maskName } from '../../utils/mask';
import { clampScore, formatDateBR } from '../../utils/score';
import { pick, randomDate, seededRandom } from '../random';

const FAKE_NAMES = ['Fulano de Tal Souza', 'Beltrana Exemplo Lima', 'Ciclano Teste Rocha', 'Maria Fictícia Alves'] as const;
const CPF_STATUS_WEIGHTED: readonly CpfStatus[] = ['REGULAR', 'REGULAR', 'REGULAR', 'REGULAR', 'PENDENTE DE REGULARIZAÇÃO', 'SUSPENSA'];

/** Dados cadastrais fictícios. `null` quando não há provedor (só o que o número revela). */
export function mockCpfRecord(cpf: string): { holderName: string; registrationStatus: CpfStatus } {
  const rand = seededRandom(`cpf:${cpf}`);
  return { holderName: maskName(pick(rand, FAKE_NAMES)), registrationStatus: pick(rand, CPF_STATUS_WEIGHTED) };
}

export function buildCpfOutcome(
  cpf: string,
  record: { holderName: string | null; registrationStatus: CpfStatus } | null,
  source: string,
  isMock: boolean,
): ProviderOutcome<CpfDetails> {
  const validChecksum = isValidCpf(cpf);
  const fiscalRegion = cpfFiscalRegion(cpf);
  const holderName = record?.holderName ?? null;
  const registrationStatus: CpfStatus = record?.registrationStatus ?? 'NÃO CONSULTADA';

  const irregular = registrationStatus !== 'REGULAR' && registrationStatus !== 'NÃO CONSULTADA';
  const exposureScore = clampScore((holderName ? 25 : 10) + (irregular ? 45 : 0));

  return {
    details: { kind: 'cpf', validChecksum, fiscalRegion, holderName, registrationStatus },
    found: true,
    exposureScore,
    summary: irregular
      ? `CPF com situação "${registrationStatus}" na Receita Federal. Regularize pelo portal gov.br.`
      : 'CPF válido. Nenhuma pendência identificada nos dados consultados.',
    sections: [
      {
        title: 'Dados cadastrais',
        items: [
          { label: 'Dígito verificador', value: validChecksum ? 'Válido' : 'Inválido' },
          { label: 'Região fiscal de emissão', value: fiscalRegion },
          { label: 'Titular', value: holderName ?? 'Requer provedor licenciado' },
          { label: 'Situação na Receita', value: registrationStatus },
        ],
      },
    ],
    sources: [source],
    isMock,
  };
}

export function mockCnpj(cnpj: string): CnpjDetails {
  const rand = seededRandom(`cnpj:${cnpj}`);
  return {
    kind: 'cnpj',
    corporateName: `${pick(rand, ['Empresa Exemplo', 'Comércio Fictício', 'Serviços Demo'])} LTDA`,
    tradeName: pick(rand, ['Exemplo Store', 'Demo Serviços', null]),
    registrationStatus: pick(rand, ['ATIVA', 'ATIVA', 'ATIVA', 'BAIXADA', 'INAPTA']),
    openingDate: randomDate(rand, 1995, 2024),
    mainActivity: pick(rand, ['Comércio varejista de mercadorias em geral', 'Desenvolvimento de software sob encomenda', 'Restaurantes e similares']),
    city: pick(rand, ['São Paulo', 'Belo Horizonte', 'Recife', 'Curitiba']),
    state: pick(rand, ['SP', 'MG', 'PE', 'PR']),
  };
}

export function buildCnpjOutcome(cnpj: string, details: CnpjDetails, source: string, isMock: boolean): ProviderOutcome<CnpjDetails> {
  const active = details.registrationStatus.toUpperCase() === 'ATIVA';

  return {
    details,
    found: true,
    exposureScore: active ? 15 : 55,
    summary: active
      ? 'Empresa ativa na Receita Federal.'
      : `Empresa com situação cadastral "${details.registrationStatus}". Verifique antes de negociar.`,
    sections: [
      {
        title: 'Dados da empresa',
        items: [
          { label: 'CNPJ', value: formatCnpj(cnpj) },
          { label: 'Razão social', value: details.corporateName },
          { label: 'Nome fantasia', value: details.tradeName ?? '—' },
          { label: 'Situação na Receita', value: details.registrationStatus },
          { label: 'Abertura', value: details.openingDate ? formatDateBR(details.openingDate) : '—' },
          { label: 'Atividade principal', value: details.mainActivity ?? '—' },
          { label: 'Município/UF', value: [details.city, details.state].filter(Boolean).join(' / ') || '—' },
        ],
      },
    ],
    sources: [source],
    isMock,
  };
}
