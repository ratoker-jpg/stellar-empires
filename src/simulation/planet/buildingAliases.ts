import type { FactionId } from './types';
import { getCompleteBuildingIds } from './completeBuildingCatalog';

const LEGACY_SUFFIX_TO_ROLE = {
  'building.aegis.command': 'government',
  'building.aegis.metal-extractor': 'metalPrimary',
  'building.aegis.crystal-refinery': 'crystalPrimary',
  'building.aegis.gas-extractor': 'gasPrimary',
  'building.aegis.power-plant': 'solarPower',
  'building.aegis.research-lab': 'researchCenter',
  'building.aegis.shipyard': 'shipyard',
  'building.aegis.sensor-array': 'spaceport',
  'building.aegis.orbital-depot': 'hangar',
  'building.aegis.civic-core': 'bank',
  'building.aegis.tactical-academy': 'government',
  'building.aegis.defense-foundry': 'advancedFactory',
  'building.synod.concord-nexus': 'government',
  'building.synod.matter-weave': 'metalPrimary',
  'building.synod.prism-refinery': 'crystalPrimary',
  'building.synod.flux-well': 'gasPrimary',
  'building.synod.resonant-core': 'solarPower',
  'building.synod.cognition-vault': 'researchCenter',
  'building.synod.lattice-yard': 'shipyard',
  'building.synod.deep-array': 'spaceport',
  'building.synod.relay-archive': 'hangar',
  'building.synod.concord-habitat': 'bank',
  'building.synod.precision-forum': 'government',
  'building.synod.shield-foundry': 'advancedFactory',
  'building.veyra.swarm-heart': 'government',
  'building.veyra.alloy-bloom': 'metalPrimary',
  'building.veyra.crystal-grove': 'crystalPrimary',
  'building.veyra.vapor-root': 'gasPrimary',
  'building.veyra.solar-membrane': 'solarPower',
  'building.veyra.memory-pod': 'researchCenter',
  'building.veyra.living-dock': 'shipyard',
  'building.veyra.pulse-canopy': 'spaceport',
  'building.veyra.spore-vault': 'hangar',
  'building.veyra.nest-cluster': 'bank',
  'building.veyra.hunter-node': 'government',
  'building.veyra.carapace-forge': 'advancedFactory',
} as const;

function factionFromId(id: string): FactionId | undefined {
  const faction = id.split('.')[1];
  return faction === 'aegis' || faction === 'synod' || faction === 'veyra' ? faction : undefined;
}

export function resolveCanonicalBuildingId(buildingId: string): string {
  const role = LEGACY_SUFFIX_TO_ROLE[buildingId as keyof typeof LEGACY_SUFFIX_TO_ROLE];
  if (role === undefined) return buildingId;
  const factionId = factionFromId(buildingId);
  return factionId === undefined ? buildingId : getCompleteBuildingIds(factionId)[role];
}

export function isLegacyBuildingId(buildingId: string): boolean {
  return buildingId in LEGACY_SUFFIX_TO_ROLE;
}
