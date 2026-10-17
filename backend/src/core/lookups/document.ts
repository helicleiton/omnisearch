import type { CnpjDetails, CpfDetails, CpfStatus, ExternalLink, ProviderOutcome } from '../../types/search.types';
import { cpfFiscalRegion, isValidCpf } from '../../utils/documents';
import { formatCnpj, maskName } from '../../utils/mask';
import { clampScore, formatDateBR } from '../../utils/score';
import { pick, randomDate, seededRandom } from '../random';

const FAKE_NAMES = ['Fulano de Tal Souza', 'Beltrana Exemplo Lima', 'Ciclano Teste Rocha', 'Maria Fictícia Alves'] as const;
const CPF_STATUS_WEIGHTED: readonly CpfStatus[] = ['REGULAR', 'REGULAR', 'REGULAR', 'REGULAR', 'PENDENTE DE REGULARIZAÇÃO', 'SUSPENSA'];

/** Serviços oficiais e gratuitos em que a própria pessoa consulta o seu CPF. */
export const CPF_SELF_SERVICE_LINKS: ExternalLink[] = [
  {
    label: 'Receita Federal',
    description: 'Situação cadastral do CPF (pede a data de nascimento)',
    url: 'https://servicos.receita.fazenda.gov.br/servicos/cpf/consultasituacao/consultapublica.asp',
  },
  {
    label: 'Registrato (Banco Central)',
    description: 'Contas, empréstimos e chaves Pix no seu nome (login gov.br)',
    url: 'https://www.bcb.gov.br/cidadaniafinanceira/registrato',
  },
  {
    label: 'Serasa',
    description: 'Score e pendências financeiras do seu CPF',
    url: 'https://www.serasa.com.br/score/',
  },
];

/** Dados cadastrais fictícios (modo mock do backend). */
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

  // Sem provedor de dados cadastrais: só validamos o número. Não dizer "seguro".
  if (!record) {
    return {
      details: { kind: 'cpf', validChecksum, fiscalRegion, holderName: null, registrationStatus: 'NÃO CONSULTADA' },
      found: false,
      exposureScore: 0,
      status: 'unverified',
      summary:
        'Número de CPF válido. Não existe fonte pública e gratuita com dados cadastrais ou vazamentos de CPF, por isso nada além da validação foi verificado. Para consultar o seu próprio CPF, use os serviços oficiais abaixo.',
      sections: [
        {
          title: 'Validação do número',
          items: [
            { label: 'Dígito verificador', value: validChecksum ? 'Válido' : 'Inválido' },
            { label: 'Região fiscal de emissão', value: fiscalRegion },
          ],
        },
      ],
      sources: [source],
      links: CPF_SELF_SERVICE_LINKS,
      isMock,
    };
  }

  const holderName = record.holderName;
  const registrationStatus = record.registrationStatus;

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
