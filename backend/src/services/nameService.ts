import { env } from '../config/env';
import { buildNameOutcome, mockOccurrences } from '../core/lookups/name';
import { fetchPublicProcesses, isEscavadorConfigured } from '../providers/escavador.provider';
import type { NameDetails, ProviderOutcome } from '../types/search.types';

export async function searchName(fullName: string): Promise<ProviderOutcome<NameDetails>> {
  // Integração real: USE_MOCKS=false + ESCAVADOR_API_TOKEN no .env.
  if (!env.USE_MOCKS && isEscavadorConfigured()) {
    return buildNameOutcome(await fetchPublicProcesses(fullName), 'Escavador', false);
  }
  return buildNameOutcome(mockOccurrences(fullName), 'Simulação (mock)', true);
}
