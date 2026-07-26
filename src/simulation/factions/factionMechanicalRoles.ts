import { getCompleteBuildingIds, type CompleteBuildingIds } from '../planet/completeBuildingCatalog';
import type { FactionId, PlanetBuildingState } from '../planet/types';
import { getCompleteResearchId } from '../research/completeResearchCatalog';
import { getCompleteDefenseIds, type CompleteDefenseIds } from '../units/completeDefenseCatalog';
import { getCompleteShipIds, type CompleteShipIds } from '../units/completeShipCatalog';
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
    readonly complete: CompleteShipIds;
  };
  readonly defenses: {
    readonly light: string;
    readonly heavy: string;
    readonly shield: string;
    readonly intercept: string;
    readonly bastion: string;
    readonly complete: CompleteDefenseIds;
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

function createCompleteShipRoles(factionId: FactionId): FactionMechanicalRoles['ships'] {
  const complete = getCompleteShipIds(factionId);
  return {
    scout: complete.spyProbe,
    transport: complete.smallTransport,
    fighter: complete.lightFighter,
    frigate: complete.lineBattleship,
    colonizer: complete.colonizer,
    recycler: complete.recycler,
    corvette: complete.interceptor,
    cruiser: complete.heavyAssault,
    carrier: complete.largeTransport,
    dreadnought: complete.planetDestroyer,
    complete,
  };
}

function createCompleteDefenseRoles(factionId: FactionId): FactionMechanicalRoles['defenses'] {
  const complete = getCompleteDefenseIds(factionId);
  return {
    light: complete.basicTurret,
    heavy: complete.plasmaTurret,
    shield: complete.secondaryShield,
    intercept: complete.laserTurret,
    bastion: complete.planetaryShield,
    complete,
  };
}

const NATIVE_ROLES: Readonly<Record<FactionId, FactionMechanicalRoles>> = {
  aegis: {
    buildings: createCompleteBuildingRoles('aegis'),
    research: createCompleteResearchRoles('aegis'),
    ships: createCompleteShipRoles('aegis'),
    defenses: createCompleteDefenseRoles('aegis'),
  },
  synod: {
    buildings: createCompleteBuildingRoles('synod'),
    research: createCompleteResearchRoles('synod'),
    ships: createCompleteShipRoles('synod'),
    defenses: createCompleteDefenseRoles('synod'),
  },
  veyra: {
    buildings: createCompleteBuildingRoles('veyra'),
    research: createCompleteResearchRoles('veyra'),
    ships: createCompleteShipRoles('veyra'),
    defenses: createCompleteDefenseRoles('veyra'),
  },
};

export function getFactionMechanicalRoles(factionId: FactionId): FactionMechanicalRoles {
  const sourceFactionId = getMechanicalCatalogSourceFactionId(factionId);
  return NATIVE_ROLES[sourceFactionId];
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
