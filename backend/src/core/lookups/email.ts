import type { Breach, EmailDetails, ProviderOutcome } from '../../types/search.types';
import { clampScore, formatDateBR } from '../../utils/score';
import { pickMany, randomDate, seededRandom } from '../random';

// Nomes FICTÍCIOS: o modo mock nunca deve parecer um vazamento real.
const MOCK_BREACHES: readonly Omit<Breach, 'breachDate'>[] = [
  { name: 'LojaExemplo', domain: 'lojaexemplo.com.br', exposedData: ['E-mails', 'Nomes', 'Senhas'], verified: true },
  { name: 'FórumDemo', domain: 'forumdemo.net', exposedData: ['E-mails', 'Nomes de usuário', 'Endereços IP'], verified: true },
  { name: 'AppFitnessFake', domain: 'appfitnessfake.io', exposedData: ['E-mails', 'Datas de nascimento', 'Gênero'], verified: false },
  { name: 'GameZoneTeste', domain: 'gamezoneteste.com', exposedData: ['E-mails', 'Senhas', 'Nomes de usuário'], verified: true },
  { name: 'ColetaneaCombo', domain: '', exposedData: ['E-mails', 'Senhas'], verified: false },
  { name: 'ViagensSimuladas', domain: 'viagenssimuladas.com', exposedData: ['E-mails', 'Telefones', 'Endereços'], verified: true },
];

const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com',
  'dispostable.com',
  'getnada.com',
  'guerrillamail.com',
  'maildrop.cc',
  'mailinator.com',
  'mintemail.com',
  'sharklasers.com',
  'temp-mail.org',
  'tempmail.com',
  'throwawaymail.com',
  'trashmail.com',
  'yopmail.com',
]);

/** Quantos vazamentos detalhar na resposta (os demais entram só na contagem). */
const MAX_BREACH_SECTIONS = 15;

export function mockBreaches(email: string): Breach[] {
  const rand = seededRandom(`email:${email}`);
  const count = rand() < 0.3 ? 0 : 1 + Math.floor(rand() * 4);
  return pickMany(rand, MOCK_BREACHES, count)
    .map((b) => ({ ...b, breachDate: randomDate(rand, 2014, 2025) }))
    .sort((a, b) => b.breachDate.localeCompare(a.breachDate));
}

interface EmailOutcomeOptions {
  sources: string[];
  isMock: boolean;
  domainAcceptsMail?: boolean | null;
}

const yesNo = (v: boolean | null): string => (v === null ? 'Não verificado' : v ? 'Sim' : 'Não');

export function buildEmailOutcome(email: string, breaches: Breach[], opts: EmailOutcomeOptions): ProviderOutcome<EmailDetails> {
  const domain = email.split('@')[1] ?? '';
  const disposableDomain = DISPOSABLE_DOMAINS.has(domain);
  const domainAcceptsMail = opts.domainAcceptsMail ?? null;
  const passwordLeaks = breaches.filter((b) => b.exposedData.some((d) => /senha|password/i.test(d))).length;

  const exposureScore = clampScore(breaches.length * 15 + passwordLeaks * 20 + (disposableDomain ? 15 : 0));
  const reputation: EmailDetails['reputation'] =
    disposableDomain || domainAcceptsMail === false ? 'suspeita' : breaches.length >= 3 ? 'neutra' : 'boa';

  const shown = breaches.slice(0, MAX_BREACH_SECTIONS);
  const hidden = breaches.length - shown.length;

  return {
    details: { kind: 'email', breaches, reputation, disposableDomain, domainAcceptsMail },
    found: breaches.length > 0,
    exposureScore,
    summary:
      breaches.length === 0
        ? 'Nenhum vazamento conhecido associado a este e-mail.'
        : `E-mail encontrado em ${breaches.length} vazamento(s)${passwordLeaks ? `, ${passwordLeaks} com senhas expostas` : ''}. Troque as senhas e ative a verificação em duas etapas.`,
    sections: [
      {
        title: 'Reputação',
        items: [
          { label: 'Status de reputação', value: reputation },
          { label: 'Domínio recebe e-mail (MX)', value: yesNo(domainAcceptsMail) },
          { label: 'Domínio descartável', value: disposableDomain ? 'Sim' : 'Não' },
          { label: 'Vazamentos encontrados', value: String(breaches.length) },
        ],
      },
      ...shown.map((b) => ({
        title: `Vazamento: ${b.name}`,
        items: [
          { label: b.breachDate.length === 4 ? 'Ano' : 'Data', value: formatDateBR(b.breachDate) },
          { label: 'Dados expostos', value: b.exposedData.join(', ') },
          { label: 'Verificado', value: b.verified ? 'Sim' : 'Não' },
          ...(b.domain ? [{ label: 'Domínio', value: b.domain }] : []),
        ],
      })),
      ...(hidden > 0
        ? [{ title: 'Outros vazamentos', items: [{ label: 'Não detalhados', value: `+${hidden} (mais antigos)` }] }]
        : []),
    ],
    sources: opts.sources,
    isMock: opts.isMock,
  };
}
