import { enqueueEvent } from '../eventQueue';
import { getResearchCatalogForFaction } from '../factions/factionMechanicalCatalogRegistry';
import { canUseMechanicalDefinition } from '../factions/sharedMechanicalCatalog';
import {
  canAfford,
  refundResources,
  spendResources,
} from '../planet/buildingProgression';
import type { PlanetState } from '../planet/types';
import type {
  CommandLogEntry,
  CommandResult,
  GameCommand,
  GameEventPayload,
  GameState,
  ScheduledGameEvent,
} from '../types';
import { getResearchDefinition } from './catalog';
import {
  applySpeedPercent,
  calculateResearchCost,
  calculateResearchEffects,
  calculateResearchSeconds,
} from './progression';
import {
  findMissingResearchRequirements,
  getEmpireResearch,
  getResearchLevel,
} from './researchState';
import type { EmpireResearchState } from './types';

function appendCommand(state: GameState, command: GameCommand): readonly CommandLogEntry[] {
  return [...state.commandLog, { index: state.commandLog.length, command }];
}

function replacePlanet(
  planets: readonly PlanetState[],
  replacement: PlanetState,
): readonly PlanetState[] {
  return planets.map((planet) => (planet.id === replacement.id ? replacement : planet));
}

function replaceResearch(
  states: readonly EmpireResearchState[],
  replacement: EmpireResearchState,
): readonly EmpireResearchState[] {
  return states.map((state) =>
    state.empireId === replacement.empireId ? replacement : state,
  );
}

export function queueResearch(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'QUEUE_RESEARCH' }>,
): CommandResult<GameState> {
  const planet = state.planets.find((candidate) => candidate.id === command.planetId);
  if (planet === undefined) {
    return { ok: false, code: 'PLANET_NOT_FOUND', message: 'Research planet not found.' };
  }
  if (planet.ownerEmpireId !== command.empireId) {
    return {
      ok: false,
      code: 'NOT_PLANET_OWNER',
      message: 'Empire does not own the research planet.',
    };
  }

  const research = getEmpireResearch(state.research, command.empireId);
  if (research === undefined) {
    return {
      ok: false,
      code: 'RESEARCH_STATE_NOT_FOUND',
      message: 'Empire research state not found.',
    };
  }
  if (research.queue.length > 0) {
    return {
      ok: false,
      code: 'RESEARCH_QUEUE_BUSY',
      message: 'Research queue is already occupied.',
    };
  }

  const definition = getResearchDefinition(command.technologyId);
  if (definition === undefined) {
    return {
      ok: false,
      code: 'RESEARCH_NOT_FOUND',
      message: 'Technology is not registered.',
    };
  }
  if (!canUseMechanicalDefinition(definition.factionId, planet.factionId)) {
    return {
      ok: false,
      code: 'WRONG_FACTION_RESEARCH',
      message: 'Technology belongs to another faction.',
    };
  }

  const currentLevel = getResearchLevel(research, definition.id);
  const targetLevel = currentLevel + 1;
  if (targetLevel > definition.maxLevel) {
    return {
      ok: false,
      code: 'RESEARCH_MAX_LEVEL',
      message: 'Technology is at maximum level.',
    };
  }

  const missingRequirements = findMissingResearchRequirements(definition, research, planet);
  if (missingRequirements.length > 0) {
    return {
      ok: false,
      code: 'RESEARCH_REQUIREMENTS_NOT_MET',
      message: 'Technology requirements are not met.',
      details: { missingRequirements },
    };
  }

  const cost = calculateResearchCost(definition, targetLevel);
  if (!canAfford(planet.economy, cost)) {
    return {
      ok: false,
      code: 'INSUFFICIENT_RESOURCES',
      message: 'Planet does not have enough resources for research.',
      details: { cost },
    };
  }

  const sequence = state.nextEventSequence;
  const queueItemId = `research-${sequence}`;
  const effects = calculateResearchEffects(
    research,
    getResearchCatalogForFaction(planet.factionId),
  );
  const baseSeconds = calculateResearchSeconds(definition, targetLevel);
  const duration = applySpeedPercent(
    baseSeconds,
    Math.floor(effects.constructionSpeedPercent / 2),
  );
  const completesAt = state.clock.elapsedSeconds + duration;
  const queueItem = {
    id: queueItemId,
    technologyId: definition.id,
    targetLevel,
    startedAt: state.clock.elapsedSeconds,
    completesAt,
    cost,
    planetId: planet.id,
  } as const;
  const event: ScheduledGameEvent = {
    id: `event-${sequence}`,
    executeAt: completesAt,
    sequence,
    payload: {
      type: 'RESEARCH_COMPLETE',
      empireId: command.empireId,
      queueItemId,
      technologyId: definition.id,
      targetLevel,
    },
  };
  const updatedResearch: EmpireResearchState = {
    ...research,
    queue: [queueItem],
  };
  const updatedPlanet: PlanetState = {
    ...planet,
    economy: spendResources(planet.economy, cost),
  };

  return {
    ok: true,
    value: {
      ...state,
      planets: replacePlanet(state.planets, updatedPlanet),
      research: replaceResearch(state.research, updatedResearch),
      nextEventSequence: sequence + 1,
      pendingEvents: enqueueEvent(state.pendingEvents, event),
      commandLog: appendCommand(state, command),
    },
  };
}

export function cancelResearch(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'CANCEL_RESEARCH' }>,
): CommandResult<GameState> {
  const research = getEmpireResearch(state.research, command.empireId);
  if (research === undefined) {
    return {
      ok: false,
      code: 'RESEARCH_STATE_NOT_FOUND',
      message: 'Empire research state not found.',
    };
  }
  const queueItem = research.queue.find((item) => item.id === command.queueItemId);
  if (queueItem === undefined) {
    return {
      ok: false,
      code: 'RESEARCH_QUEUE_ITEM_NOT_FOUND',
      message: 'Research order not found.',
    };
  }
  const planet = state.planets.find((candidate) => candidate.id === queueItem.planetId);
  if (planet === undefined || planet.ownerEmpireId !== command.empireId) {
    return {
      ok: false,
      code: 'RESEARCH_PLANET_NOT_FOUND',
      message: 'Research planet not found.',
    };
  }

  const updatedResearch: EmpireResearchState = {
    ...research,
    queue: research.queue.filter((item) => item.id !== queueItem.id),
  };
  const updatedPlanet: PlanetState = {
    ...planet,
    economy: refundResources(planet.economy, queueItem.cost, 750),
  };

  return {
    ok: true,
    value: {
      ...state,
      planets: replacePlanet(state.planets, updatedPlanet),
      research: replaceResearch(state.research, updatedResearch),
      pendingEvents: state.pendingEvents.filter(
        (event) =>
          !(
            event.payload.type === 'RESEARCH_COMPLETE' &&
            event.payload.queueItemId === queueItem.id
          ),
      ),
      commandLog: appendCommand(state, command),
    },
  };
}

export function completeResearch(
  states: readonly EmpireResearchState[],
  payload: Extract<GameEventPayload, { readonly type: 'RESEARCH_COMPLETE' }>,
): readonly EmpireResearchState[] {
  const research = getEmpireResearch(states, payload.empireId);
  if (research === undefined) {
    return states;
  }
  const queueItem = research.queue.find((item) => item.id === payload.queueItemId);
  if (
    queueItem === undefined ||
    queueItem.technologyId !== payload.technologyId ||
    queueItem.targetLevel !== payload.targetLevel
  ) {
    return states;
  }

  return replaceResearch(states, {
    ...research,
    levels: {
      ...research.levels,
      [payload.technologyId]: payload.targetLevel,
    },
    queue: research.queue.filter((item) => item.id !== queueItem.id),
  });
}
