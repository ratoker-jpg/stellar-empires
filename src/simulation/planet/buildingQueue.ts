import type { ResourceCost } from '../economy/types';
import { enqueueEvent } from '../eventQueue';
import { getResearchEffectsForEmpire } from '../factions/factionResearchEffects';
import { applySpeedPercent } from '../research/progression';
import type { GameState, ScheduledGameEvent } from '../types';
import type { BuildingDefinition } from './buildingCatalog';
import {
  calculateBuildSeconds,
  spendResources,
} from './buildingProgression';
import {
  applySpecializationPercent,
  getPlanetSpecializationEffects,
} from './specialization';
import type { PlanetState } from './types';

export interface BuildingQueueTransition {
  readonly state: GameState;
  readonly queueItemId: string;
  readonly completesAt: number;
}

function replacePlanet(
  planets: readonly PlanetState[],
  planetId: string,
  replacement: PlanetState,
): readonly PlanetState[] {
  return planets.map((planet) => (planet.id === planetId ? replacement : planet));
}

export function queueBuildingConstruction(
  state: GameState,
  planet: PlanetState,
  empireId: string,
  definition: BuildingDefinition,
  targetLevel: number,
  cost: ResourceCost,
  prepaid: boolean,
): BuildingQueueTransition {
  const sequence = state.nextEventSequence;
  const queueItemId = `build-${sequence}`;
  const profileId = state.campaignSettings.progressionProfile;
  const effects = getResearchEffectsForEmpire(state, empireId);
  const researchDuration = applySpeedPercent(
    calculateBuildSeconds(definition, targetLevel, profileId, planet),
    effects?.constructionSpeedPercent ?? 0,
  );
  const specialization = getPlanetSpecializationEffects(planet.specializationId);
  const duration = applySpecializationPercent(
    researchDuration,
    specialization.constructionSpeedPercent,
  );
  const completesAt = state.clock.elapsedSeconds + duration;
  const queueItem = {
    id: queueItemId,
    buildingId: definition.id,
    targetLevel,
    startedAt: state.clock.elapsedSeconds,
    completesAt,
    cost,
  } as const;
  const event: ScheduledGameEvent = {
    id: `event-${sequence}`,
    executeAt: completesAt,
    sequence,
    payload: {
      type: 'BUILDING_COMPLETE',
      planetId: planet.id,
      queueItemId,
      buildingId: definition.id,
      targetLevel,
    },
  };
  const updatedPlanet: PlanetState = {
    ...planet,
    buildQueue: [queueItem],
    economy: prepaid ? planet.economy : spendResources(planet.economy, cost),
  };
  return {
    state: {
      ...state,
      planets: replacePlanet(state.planets, planet.id, updatedPlanet),
      nextEventSequence: sequence + 1,
      pendingEvents: enqueueEvent(state.pendingEvents, event),
    },
    queueItemId,
    completesAt,
  };
}
