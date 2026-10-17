import type { NameDetails, ProviderOutcome, PublicOccurrence } from '../../types/search.types';
import { clampScore, formatDateBR } from '../../utils/score';
import { pickMany, randomDate, seededRandom } from '../random';

const MOCK_TEMPLATES: readonly Omit<PublicOccurrence, 'date'>[] = [
  { source: 'Diário Oficial (simulado)', category: 'Diário Oficial', title: 'Nomeação em concurso público' },
  { source: 'Diário Oficial (simulado)', category: 'Diário Oficial', title: 'Publicação de licitação' },
  { source: 'Tribunal (simulado)', category: 'Processo público', title: 'Processo cível — polo ativo' },
  { source: 'Portal de notícias (simulado)', category: 'Notícia', title: 'Citação em matéria jornalística' },
  { source: 'Rede profissional (simulada)', category: 'Rede social', title: 'Perfil profissional público' },
  { source: 'Portal da Transparência (simulado)', category: 'Cadastro público', title: 'Registro de vínculo público' },
];

const CATEGORY_WEIGHT: Record<PublicOccurrence['category'], number> = {
  'Processo público': 22,
  'Diário Oficial': 12,
  'Cadastro público': 12,
  Notícia: 10,
  'Rede social': 8,
};

export function mockOccurrences(name: string): PublicOccurrence[] {
  const rand = seededRandom(`name:${name.toLowerCase()}`);
  const count = rand() < 0.25 ? 0 : 1 + Math.floor(rand() * 5);
  return pickMany(rand, MOCK_TEMPLATES, count).map((t) => ({ ...t, date: randomDate(rand, 2012, 2026) }));
}

export function buildNameOutcome(occurrences: PublicOccurrence[], source: string, isMock: boolean): ProviderOutcome<NameDetails> {
  return {
    details: { kind: 'name', occurrences },
    found: occurrences.length > 0,
    exposureScore: clampScore(occurrences.reduce((sum, o) => sum + CATEGORY_WEIGHT[o.category], 0)),
    summary:
      occurrences.length === 0
        ? 'Nenhuma ocorrência pública encontrada para este nome.'
        : `${occurrences.length} ocorrência(s) pública(s) encontrada(s). Homônimos são comuns — confirme antes de tirar conclusões.`,
    sections: occurrences.map((o) => ({
      title: o.category,
      items: [
        { label: 'Descrição', value: o.title },
        { label: 'Fonte', value: o.source },
        { label: 'Data', value: o.date ? formatDateBR(o.date) : '—' },
      ],
    })),
    sources: [source],
    isMock,
  };
}
