import { refreshPlanetEconomy } from '../economy/planetEconomy';
import type { CommandLogEntry, CommandResult, GameCommand, GameState } from '../types';
import {
  hasActivePlanetQueues,
  isPlanetDevelopmentTemplateId,
  isPlanetSpecializationId,
} from './specialization';
import type { PlanetState } from './types';

function appendCommand(state: GameState, command: GameCommand): readonly CommandLogEntry[] {
  return [...state.commandLog, { index: state.commandLog.length, command }];
}

function replacePlanet(
  planets: readonly PlanetState[],
  replacement: PlanetState,
): readonly PlanetState[] {
  return planets.map((planet) => (planet.id === replacement.id ? replacement : planet));
}

function getOwnedPlanet(
  state: GameState,
  empireId: string,
  planetId: string,
): CommandResult<PlanetState> {
  const planet = state.planets.find((candidate) => candidate.id === planetId);
  if (planet === undefined) {
    return { ok: false, code: 'PLANET_NOT_FOUND', message: 'The requested planet does not exist.' };
  }
  if (planet.ownerEmpireId !== empireId) {
    return { ok: false, code: 'NOT_PLANET_OWNER', message: 'An empire cannot manage another empire planet.' };
  }
  return { ok: true, value: planet };
}

export function setPlanetSpecialization(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'SET_PLANET_SPECIALIZATION' }>,
): CommandResult<GameState> {
  if (!isPlanetSpecializationId(command.specializationId)) {
    return {
      ok: false,
      code: 'INVALID_PLANET_SPECIALIZATION',
      message: 'Planet specialization is not registered.',
    };
  }
  const owned = getOwnedPlanet(state, command.empireId, command.planetId);
  if (!owned.ok) return owned;
  if (owned.value.specializationId === command.specializationId) {
    return {
      ok: false,
      code: 'PLANET_SPECIALIZATION_UNCHANGED',
      message: 'Planet already uses this specialization.',
    };
  }
  if (hasActivePlanetQueues(owned.value)) {
    return {
      ok: false,
      code: 'PLANET_SPECIALIZATION_BUSY',
      message: 'Planet specialization cannot change while local queues are active.',
    };
  }

  const planet: PlanetState = {
    ...owned.value,
    specializationId: command.specializationId,
    economy: refreshPlanetEconomy(
      owned.value.economy,
      owned.value.buildings,
      0,
      command.specializationId,
    ),
  };
  return {
    ok: true,
    value: {
      ...state,
      planets: replacePlanet(state.planets, planet),
      commandLog: appendCommand(state, command),
    },
  };
}

export function setPlanetDevelopmentTemplate(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'SET_PLANET_DEVELOPMENT_TEMPLATE' }>,
): CommandResult<GameState> {
  if (!isPlanetDevelopmentTemplateId(command.developmentTemplateId)) {
    return {
      ok: false,
      code: 'INVALID_DEVELOPMENT_TEMPLATE',
      message: 'Planet development template is not registered.',
    };
  }
  const owned = getOwnedPlanet(state, command.empireId, command.planetId);
  if (!owned.ok) return owned;
  if (owned.value.developmentTemplateId === command.developmentTemplateId) {
    return {
      ok: false,
      code: 'DEVELOPMENT_TEMPLATE_UNCHANGED',
      message: 'Planet already uses this development template.',
    };
  }

  const planet: PlanetState = {
    ...owned.value,
    developmentTemplateId: command.developmentTemplateId,
  };
  return {
    ok: true,
    value: {
      ...state,
      planets: replacePlanet(state.planets, planet),
      commandLog: appendCommand(state, command),
    },
  };
}
