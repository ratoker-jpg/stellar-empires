import { getFactionIdForEmpire } from '../factions/factionMechanicalCatalogRegistry';
import { getFactionMechanicalRoles } from '../factions/factionMechanicalRoles';
import { getBuildingDefinition } from '../planet/buildingCatalog';
import { isBuildingEndgameLocked } from '../planet/buildingOperations';
import { getBuildingLevel } from '../planet/buildingProgression';
import type { PlanetState } from '../planet/types';
import { resolveBuildingRequirement } from '../progression/profile';
import type { GameState } from '../types';
import { getLegacyUnitIdsForCanonical } from '../units/unitAliases';

export const BOT_PROGRESSION_PHASES = [
  'foundation',
  'reconnaissance',
  'first-combat',
  'colonization',
  'heavy-fleet',
  'planet-destruction',
  'endgame-preparation',
] as const;

export type BotProgressionPhase = (typeof BOT_PROGRESSION_PHASES)[number];

interface EmpireCapabilitySnapshot {
  readonly colonyCount: number;
  readonly shipCounts: Readonly<Record<string, number>>;
}

function createCapabilitySnapshot(
  state: GameState,
  empireId: string,
): EmpireCapabilitySnapshot {
  const shipCounts: Record<string, number> = {};
  let colonyCount = 0;
  for (const planet of state.planets) {
    if (planet.ownerEmpireId !== empireId) continue;
    colonyCount += 1;
    for (const [unitId, count] of Object.entries(planet.inventory.ships)) {
      shipCounts[unitId] = (shipCounts[unitId] ?? 0) + count;
    }
  }
  for (const fleet of state.fleets) {
    if (fleet.empireId !== empireId) continue;
    for (const [unitId, count] of Object.entries(fleet.ships)) {
      shipCounts[unitId] = (shipCounts[unitId] ?? 0) + count;
    }
  }
  return { colonyCount, shipCounts };
}

function countShip(
  snapshot: EmpireCapabilitySnapshot,
  canonicalUnitId: string,
): number {
  return [canonicalUnitId, ...getLegacyUnitIdsForCanonical(canonicalUnitId)].reduce(
    (total, unitId) => total + (snapshot.shipCounts[unitId] ?? 0),
    0,
  );
}

function hasResolvedBuildingPrerequisites(
  state: GameState,
  planet: PlanetState,
  buildingId: string,
  visited = new Set<string>(),
): boolean {
  if (visited.has(buildingId)) return true;
  const definition = getBuildingDefinition(buildingId);
  if (definition === undefined) return false;
  const nextVisited = new Set(visited).add(buildingId);
  return definition.requirements.every((rawRequirement) => {
    const requirement = resolveBuildingRequirement(
      state.campaignSettings.progressionProfile,
      rawRequirement,
    );
    const levelSatisfied =
      isBuildingEndgameLocked(requirement.buildingId) ||
      getBuildingLevel(planet.buildings, requirement.buildingId) >= requirement.level;
    return (
      levelSatisfied &&
      hasResolvedBuildingPrerequisites(
        state,
        planet,
        requirement.buildingId,
        nextVisited,
      )
    );
  });
}

function hasEndgamePreparationInfrastructure(state: GameState, empireId: string): boolean {
  const factionId = getFactionIdForEmpire(state, empireId);
  const gatesId = getFactionMechanicalRoles(factionId).buildings.complete.supremeGalacticGates;
  return state.planets
    .filter((planet) => planet.ownerEmpireId === empireId)
    .some((planet) => hasResolvedBuildingPrerequisites(state, planet, gatesId));
}

export function getBotProgressionPhase(
  state: GameState,
  empireId: string,
): BotProgressionPhase {
  const factionId = getFactionIdForEmpire(state, empireId);
  const roles = getFactionMechanicalRoles(factionId).ships;
  const snapshot = createCapabilitySnapshot(state, empireId);
  const hasScout = countShip(snapshot, roles.scout) > 0;
  const hasCombat =
    countShip(snapshot, roles.fighter) > 0 ||
    countShip(snapshot, roles.corvette) > 0;
  const hasColonization =
    snapshot.colonyCount > 1 || countShip(snapshot, roles.colonizer) > 0;
  const hasHeavyFleet =
    countShip(snapshot, roles.frigate) > 0 ||
    countShip(snapshot, roles.cruiser) > 0;
  const hasPlanetDestroyer = countShip(snapshot, roles.dreadnought) > 0;

  if (!hasScout) return 'foundation';
  if (!hasCombat) return 'reconnaissance';
  if (!hasColonization) return 'first-combat';
  if (!hasHeavyFleet) return 'colonization';
  if (!hasPlanetDestroyer) return 'heavy-fleet';
  return hasEndgamePreparationInfrastructure(state, empireId)
    ? 'endgame-preparation'
    : 'planet-destruction';
}

export function getAllBotProgressionPhases(
  state: GameState,
): Readonly<Record<string, BotProgressionPhase>> {
  return Object.fromEntries(
    state.empires
      .filter((empireId) => empireId !== 'player')
      .map((empireId) => [empireId, getBotProgressionPhase(state, empireId)]),
  );
}
