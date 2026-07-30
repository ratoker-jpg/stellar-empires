import { getFactionIdForEmpire } from '../factions/factionMechanicalCatalogRegistry';
import { getFactionMechanicalRoles } from '../factions/factionMechanicalRoles';
import { getBuildingDefinition } from '../planet/buildingCatalog';
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

function countShip(state: GameState, empireId: string, canonicalUnitId: string): number {
  const unitIds = [canonicalUnitId, ...getLegacyUnitIdsForCanonical(canonicalUnitId)];
  const onPlanets = state.planets
    .filter((planet) => planet.ownerEmpireId === empireId)
    .reduce(
      (total, planet) =>
        total + unitIds.reduce(
          (subtotal, unitId) => subtotal + (planet.inventory.ships[unitId] ?? 0),
          0,
        ),
      0,
    );
  return state.fleets
    .filter((fleet) => fleet.empireId === empireId)
    .reduce(
      (total, fleet) =>
        total + unitIds.reduce(
          (subtotal, unitId) => subtotal + (fleet.ships[unitId] ?? 0),
          0,
        ),
      onPlanets,
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
    return (
      getBuildingLevel(planet.buildings, requirement.buildingId) >= requirement.level &&
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
  const hasScout = countShip(state, empireId, roles.scout) > 0;
  const hasCombat =
    countShip(state, empireId, roles.fighter) > 0 ||
    countShip(state, empireId, roles.corvette) > 0;
  const hasColonization =
    state.planets.filter((planet) => planet.ownerEmpireId === empireId).length > 1 ||
    countShip(state, empireId, roles.colonizer) > 0;
  const hasHeavyFleet =
    countShip(state, empireId, roles.frigate) > 0 ||
    countShip(state, empireId, roles.cruiser) > 0;
  const hasPlanetDestroyer = countShip(state, empireId, roles.dreadnought) > 0;

  if (
    hasScout &&
    hasCombat &&
    hasColonization &&
    hasHeavyFleet &&
    hasPlanetDestroyer &&
    hasEndgamePreparationInfrastructure(state, empireId)
  ) {
    return 'endgame-preparation';
  }
  if (hasScout && hasCombat && hasColonization && hasHeavyFleet && hasPlanetDestroyer) {
    return 'planet-destruction';
  }
  if (hasScout && hasCombat && hasColonization && hasHeavyFleet) return 'heavy-fleet';
  if (hasScout && hasCombat && hasColonization) return 'colonization';
  if (hasScout && hasCombat) return 'first-combat';
  if (hasScout) return 'reconnaissance';
  return 'foundation';
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
