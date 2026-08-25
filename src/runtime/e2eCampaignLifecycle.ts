import { parseUint32Seed } from '../simulation/seed';

export const E2E_DEFAULT_CAMPAIGN_SEED_SOURCE = 'stellar-empires-m1' as const;

export interface E2eInteractiveNewGameConfig {
  readonly enabled: boolean;
  readonly seed?: number;
}

export function readE2eInteractiveNewGameConfig(
  search: string = window.location.search,
): E2eInteractiveNewGameConfig {
  const parameters = new URLSearchParams(search);
  if (parameters.get('interactiveNewGame') !== '1') return { enabled: false };
  const rawSeed = parameters.get('campaignSeed');
  const seed = rawSeed === null ? undefined : parseUint32Seed(rawSeed);
  return seed === undefined ? { enabled: true } : { enabled: true, seed };
}
