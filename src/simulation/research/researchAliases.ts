import type { FactionId } from '../planet/types';
import { getCompleteResearchId } from './completeResearchCatalog';

const LEGACY_ROLE_SLUGS = {
  aegis: {
    construction: 'construction',
    energy: 'energy',
    sensors: 'sensors',
    propulsion: 'propulsion',
    protection: 'armor',
    weapons: 'weapons',
    colonization: 'colonization',
    logistics: 'logistics',
    advancedProtection: 'shield-harmonics',
    battleNetwork: 'battle-network',
  },
  synod: {
    construction: 'distributed-construction',
    energy: 'harmonic-grid',
    sensors: 'deep-sight',
    propulsion: 'vector-folding',
    protection: 'coherent-shields',
    weapons: 'precision-fire',
    colonization: 'seed-consensus',
    logistics: 'relay-logistics',
    advancedProtection: 'predictive-screening',
    battleNetwork: 'chorus-command',
  },
  veyra: {
    construction: 'adaptive-growth',
    energy: 'photosynthetic-grid',
    sensors: 'echo-sense',
    propulsion: 'living-thrust',
    protection: 'carapace-weave',
    weapons: 'predator-instinct',
    colonization: 'brood-seeding',
    logistics: 'mycelial-logistics',
    advancedProtection: 'regenerative-shells',
    battleNetwork: 'swarm-mind',
  },
} as const;

const CANONICAL_ROLE_SLUGS = {
  construction: 'improved-construction',
  energy: 'physics',
  sensors: 'espionage',
  propulsion: 'jet-engines',
  protection: 'ship-armor',
  weapons: 'laser-science',
  colonization: 'parallel-universes',
  logistics: 'computer-systems',
  advancedProtection: 'maneuver-defense',
  battleNetwork: 'critical-hit',
} as const;

type LegacyRole = keyof typeof CANONICAL_ROLE_SLUGS;

const aliases: Record<string, string> = {};
for (const factionId of ['aegis', 'synod', 'veyra'] as const satisfies readonly FactionId[]) {
  for (const role of Object.keys(CANONICAL_ROLE_SLUGS) as LegacyRole[]) {
    aliases[getCompleteResearchId(factionId, LEGACY_ROLE_SLUGS[factionId][role])] =
      getCompleteResearchId(factionId, CANONICAL_ROLE_SLUGS[role]);
  }
}

export const LEGACY_RESEARCH_ALIASES: Readonly<Record<string, string>> = aliases;

export function resolveCanonicalResearchId(technologyId: string): string {
  return LEGACY_RESEARCH_ALIASES[technologyId] ?? technologyId;
}

export function getLegacyResearchIdsForCanonical(technologyId: string): readonly string[] {
  return Object.entries(LEGACY_RESEARCH_ALIASES)
    .filter(([, canonicalId]) => canonicalId === technologyId)
    .map(([legacyId]) => legacyId);
}
