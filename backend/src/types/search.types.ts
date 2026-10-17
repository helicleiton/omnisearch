/**
 * Contratos da API de busca. O app mobile mantém uma cópia em
 * mobile/src/types/api.ts — mantenha os dois arquivos sincronizados.
 */

export const SEARCH_TYPES = ['email', 'cpf', 'cnpj', 'phone', 'name'] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];

/** Tipo informado pelo cliente: um tipo concreto ou detecção automática. */
export type SearchTypeInput = SearchType | 'auto';

/** `unverified`: nada foi consultado além da validação do formato (não implica "seguro"). */
export type RiskStatus = 'safe' | 'attention' | 'alert' | 'unverified';

/** Link para um serviço oficial em que a própria pessoa consulta os seus dados. */
export interface ExternalLink {
  label: string;
  description: string;
  url: string;
}

// ---------------------------------------------------------------- Request ---

export interface SearchRequestBody {
  query: string;
  type?: SearchTypeInput;
}

/** Entrada já validada e normalizada (disponível em res.locals.search). */
export interface ValidatedSearch {
  type: SearchType;
  /** Valor normalizado (só dígitos para CPF/telefone, e-mail em minúsculas). */
  value: string;
  /** Indica se o tipo foi detectado automaticamente. */
  autoDetected: boolean;
}

// --------------------------------------------------------- Domain results ---

export interface Breach {
  name: string;
  domain: string;
  breachDate: string; // ISO yyyy-mm-dd, ou só o ano (yyyy) quando a fonte não informa o dia
  exposedData: string[];
  verified: boolean;
}

export interface EmailDetails {
  kind: 'email';
  breaches: Breach[];
  reputation: 'boa' | 'neutra' | 'suspeita';
  disposableDomain: boolean;
  /** Domínio tem registro MX (recebe e-mail). null = não verificado. */
  domainAcceptsMail: boolean | null;
}

export type CpfStatus = 'REGULAR' | 'PENDENTE DE REGULARIZAÇÃO' | 'SUSPENSA' | 'CANCELADA' | 'NÃO CONSULTADA';

export interface CpfDetails {
  kind: 'cpf';
  validChecksum: boolean;
  fiscalRegion: string;
  /** Somente em modo mock ou com provedor licenciado (ver documentService). Sempre mascarado. */
  holderName: string | null;
  registrationStatus: CpfStatus;
}

export interface CnpjDetails {
  kind: 'cnpj';
  corporateName: string;
  tradeName: string | null;
  registrationStatus: string;
  openingDate: string | null;
  mainActivity: string | null;
  city: string | null;
  state: string | null;
}

export interface PhoneDetails {
  kind: 'phone';
  validFormat: boolean;
  lineType: 'móvel' | 'fixo';
  ddd: string;
  state: string;
  /** null quando não há fonte confiável (portabilidade numérica). */
  carrier: string | null;
  /** Cidades atendidas pelo DDD (BrasilAPI). */
  cities: string[];
}

export interface PublicOccurrence {
  source: string;
  category: 'Diário Oficial' | 'Processo público' | 'Notícia' | 'Rede social' | 'Cadastro público';
  title: string;
  date: string;
}

export interface NameDetails {
  kind: 'name';
  occurrences: PublicOccurrence[];
}

export type SearchDetails = EmailDetails | CpfDetails | CnpjDetails | PhoneDetails | NameDetails;

// --------------------------------------------------------------- Response ---

export interface DetailItem {
  label: string;
  value: string;
}

/** Bloco pronto para exibição — o app renderiza sem precisar conhecer o tipo. */
export interface DetailSection {
  title: string;
  items: DetailItem[];
}

export interface SearchResult {
  requestId: string;
  type: SearchType;
  autoDetected: boolean;
  /** Consulta mascarada — o valor original nunca é devolvido. */
  maskedQuery: string;
  found: boolean;
  status: RiskStatus;
  exposureScore: number; // 0–100
  summary: string;
  sections: DetailSection[];
  details: SearchDetails;
  sources: string[];
  links: ExternalLink[];
  isMock: boolean;
  searchedAt: string;
  disclaimer: string;
}

export interface SearchSuccessResponse {
  success: true;
  data: SearchResult;
}

export type ApiErrorCode =
  | 'INVALID_INPUT'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'UNAUTHORIZED'
  | 'UPSTREAM_ERROR'
  | 'INTERNAL_ERROR';

export interface ApiErrorResponse {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    fields?: Record<string, string[]>;
  };
}

export type SearchResponse = SearchSuccessResponse | ApiErrorResponse;

/** O que cada serviço devolve ao orquestrador. */
export interface ProviderOutcome<T extends SearchDetails = SearchDetails> {
  details: T;
  found: boolean;
  exposureScore: number;
  summary: string;
  sections: DetailSection[];
  sources: string[];
  isMock: boolean;
  /** Força o status (padrão: derivado do exposureScore). */
  status?: RiskStatus;
  links?: ExternalLink[];
}
