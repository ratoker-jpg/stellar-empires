import { getCompleteBuildingIds, type CompleteBuildingIds } from '../planet/completeBuildingCatalog';
import type { FactionId, PlanetBuildingState } from '../planet/types';
import { getCompleteResearchId } from '../research/completeResearchCatalog';
import { getMechanicalCatalogSourceFactionId } from './factionCatalogManifest';

export interface FactionMechanicalRoles {
  readonly buildings: {
    readonly command: string;
    readonly metal: string;
    readonly crystal: string;
    readonly gas: string;
    readonly power: string;
    readonly laboratory: string;
    readonly shipyard: string;
    readonly sensorGrid: string;
    readonly depot: string;
    readonly civic: string;
    readonly tactical: string;
    readonly defenseIndustry: string;
    readonly complete: CompleteBuildingIds;
  };
  readonly research: {
    readonly construction: string;
    readonly energy: string;
    readonly sensors: string;
    readonly propulsion: string;
    readonly protection: string;
    readonly weapons: string;
    readonly colonization: string;
    readonly logistics: string;
    readonly advancedProtection: string;
    readonly battleNetwork: string;
  };
  readonly ships: {
    readonly scout: string;
    readonly transport: string;
    readonly fighter: string;
    readonly frigate: string;
    readonly colonizer: string;
    readonly recycler: string;
    readonly corvette: string;
    readonly cruiser: string;
    readonly carrier: string;
    readonly dreadnought: string;
  };
  readonly defenses: {
    readonly light: string;
    readonly heavy: string;
    readonly shield: string;
    readonly intercept: string;
    readonly bastion: string;
  };
}

function createCompleteBuildingRoles(factionId: FactionId): FactionMechanicalRoles['buildings'] {
  const complete = getCompleteBuildingIds(factionId);
  return {
    command: complete.government,
    metal: complete.metalPrimary,
    crystal: complete.crystalPrimary,
    gas: complete.gasPrimary,
    power: complete.solarPower,
    laboratory: complete.researchCenter,
    shipyard: complete.shipyard,
    sensorGrid: complete.spaceport,
    depot: complete.hangar,
    civic: complete.bank,
    tactical: complete.government,
    defenseIndustry: complete.advancedFactory,
    complete,
  };
}

function createCompleteResearchRoles(factionId: FactionId): FactionMechanicalRoles['research'] {
  return {
    construction: getCompleteResearchId(factionId, 'improved-construction'),
    energy: getCompleteResearchId(factionId, 'physics'),
    sensors: getCompleteResearchId(factionId, 'espionage'),
    propulsion: getCompleteResearchId(factionId, 'jet-engines'),
    protection: getCompleteResearchId(factionId, 'ship-armor'),
    weapons: getCompleteResearchId(factionId, 'laser-science'),
    colonization: getCompleteResearchId(factionId, 'parallel-universes'),
    logistics: getCompleteResearchId(factionId, 'computer-systems'),
    advancedProtection: getCompleteResearchId(factionId, 'maneuver-defense'),
    battleNetwork: getCompleteResearchId(factionId, 'critical-hit'),
  };
}

const NATIVE_ROLES: Readonly<Partial<Record<FactionId, FactionMechanicalRoles>>> = {
  aegis: {
    buildings: createCompleteBuildingRoles('aegis'),
    research: createCompleteResearchRoles('aegis'),
    ships: {
      scout: 'ship.aegis.scout',
      transport: 'ship.aegis.cargo',
      fighter: 'ship.aegis.fighter',
      frigate: 'ship.aegis.frigate',
      colonizer: 'ship.aegis.colony',
      recycler: 'ship.aegis.recycler',
      corvette: 'ship.aegis.corvette',
      cruiser: 'ship.aegis.cruiser',
      carrier: 'ship.aegis.carrier',
      dreadnought: 'ship.aegis.dreadnought',
    },
    defenses: {
      light: 'defense.aegis.gun-battery',
      heavy: 'defense.aegis.missile-battery',
      shield: 'defense.aegis.shield-generator',
      intercept: 'defense.aegis.point-defense',
      bastion: 'defense.aegis.fortress-array',
    },
  },
  synod: {
    buildings: createCompleteBuildingRoles('synod'),
    research: createCompleteResearchRoles('synod'),
    ships: {
      scout: 'ship.synod.whisper',
      transport: 'ship.synod.thread-carrier',
      fighter: 'ship.synod.lancet',
      frigate: 'ship.synod.ward-frigate',
      colonizer: 'ship.synod.seed-ark',
      recycler: 'ship.synod.salvage-mind',
      corvette: 'ship.synod.phase-corvette',
      cruiser: 'ship.synod.chorus-cruiser',
      carrier: 'ship.synod.relay-carrier',
      dreadnought: 'ship.synod.oracle-dreadnought',
    },
    defenses: {
      light: 'defense.synod.lance-node',
      heavy: 'defense.synod.arc-silo',
      shield: 'defense.synod.harmonic-screen',
      intercept: 'defense.synod.predictive-intercept',
      bastion: 'defense.synod.concord-bastion',
    },
  },
  veyra: {
    buildings: createCompleteBuildingRoles('veyra'),
    research: createCompleteResearchRoles('veyra'),
    ships: {
      scout: 'ship.veyra.wisp',
      transport: 'ship.veyra.tendril',
      fighter: 'ship.veyra.sting',
      frigate: 'ship.veyra.shellwing',
      colonizer: 'ship.veyra.brood-ark',
      recycler: 'ship.veyra.devourer',
      corvette: 'ship.veyra.dart',
      cruiser: 'ship.veyra.manta',
      carrier: 'ship.veyra.hive-carrier',
      dreadnought: 'ship.veyra.leviathan',
    },
    defenses: {
      light: 'defense.veyra.thorn-spire',
      heavy: 'defense.veyra.spore-mortar',
      shield: 'defense.veyra.living-veil',
      intercept: 'defense.veyra.snapper-node',
      bastion: 'defense.veyra.hive-bastion',
    },
  },
};

export function getFactionMechanicalRoles(factionId: FactionId): FactionMechanicalRoles {
  const sourceFactionId = getMechanicalCatalogSourceFactionId(factionId);
  const roles = NATIVE_ROLES[sourceFactionId];
  if (roles === undefined) {
    throw new Error(`Mechanical roles are not registered: ${sourceFactionId}`);
  }
  return roles;
}

export function getStartingBuildingsForFaction(
  factionId: FactionId,
): readonly PlanetBuildingState[] {
  const buildings = getFactionMechanicalRoles(factionId).buildings;
  return [
    { buildingId: buildings.command, level: 1 },
    { buildingId: buildings.metal, level: 1 },
    { buildingId: buildings.crystal, level: 1 },
    { buildingId: buildings.gas, level: 1 },
    { buildingId: buildings.power, level: 1 },
  ];
}
