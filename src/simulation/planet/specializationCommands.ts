import { refreshPlanetEconomy } from '../economy/planetEconomy';
import { AEGIS_RESEARCH_CATALOG } from '../research/catalog';
import { calculateResearchEffects } from '../research/progression';
import { getEmpireResearch } from '../research/researchState';
import type {
  CommandLogEntry,
  CommandResult,
  GameCommand,
  GameState,
} from '../types';
import {
  COLONY_SPECIALIZATION_CHANGE_COST,
  getResourceProductionBonusPercent,
  isColonySpecializationId,
} from './specialization';
import { canAfford, spendResources } from './buildingProgression';
import type { PlanetState } from './types';

function appendCommand(
  state: GameState,
  command: GameCommand,
): readonly CommandLogEntry[] {
  return [...state.commandLog, { index: state.commandLog.length, command }];
}

function replacePlanet(
  planets: readonly PlanetState[],
  replacement: PlanetState,
): readonly PlanetState[] {
  return planets.map((planet) =>
    planet.id === replacement.id ? replacement : planet,
  );
}

export function setPlanetSpecialization(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'SET_PLANET_SPECIALIZATION' }>,
): CommandResult<GameState> {
  const planet = state.planets.find(
    (candidate) => candidate.id === command.planetId,
  );
  if (planet === undefined) {
    return { ok: false, code: 'PLANET_NOT_FOUND', message: 'Planet not found.' };
  }
  if (planet.ownerEmpireId !== command.empireId) {
    return {
      ok: false,
      code: 'NOT_PLANET_OWNER',
      message: 'Empire does not own the selected planet.',
    };
  }
  if (!isColonySpecializationId(command.specialization)) {
    return {
      ok: false,
      code: 'INVALID_COLONY_SPECIALIZATION',
      message: 'Colony specialization is not registered.',
    };
  }
  if (planet.specialization === command.specialization) {
    return {
      ok: false,
      code: 'SPECIALIZATION_ALREADY_ACTIVE',
      message: 'The selected specialization is already active.',
    };
  }
  if (
    planet.buildQueue.length > 0 ||
    planet.productionQueues.shipyard.length > 0 ||
    planet.productionQueues.defense.length > 0
  ) {
    return {
      ok: false,
      code: 'SPECIALIZATION_LOCAL_QUEUE_BUSY',
      message: 'Local construction and production queues must be idle.',
    };
  }

  const research = getEmpireResearch(state.research, command.empireId);
  if (research?.queue.some((item) => item.planetId === planet.id)) {
    return {
      ok: false,
      code: 'SPECIALIZATION_RESEARCH_QUEUE_BUSY',
      message: 'Research funded by this colony must finish or be cancelled.',
    };
  }
  if (!canAfford(planet.economy, COLONY_SPECIALIZATION_CHANGE_COST)) {
    return {
      ok: false,
      code: 'INSUFFICIENT_RESOURCES',
      message: 'Planet does not have enough resources to reorganize.',
      details: { cost: COLONY_SPECIALIZATION_CHANGE_COST },
    };
  }

  const energyOutputPercent =
    research === undefined
      ? 0
      : calculateResearchEffects(research, AEGIS_RESEARCH_CATALOG)
          .energyOutputPercent;
  const spent = spendResources(
    planet.economy,
    COLONY_SPECIALIZATION_CHANGE_COST,
  );
  const updatedPlanet: PlanetState = {
    ...planet,
    specialization: command.specialization,
    economy: refreshPlanetEconomy(
      spent,
      planet.buildings,
      energyOutputPercent,
      getResourceProductionBonusPercent(command.specialization),
    ),
  };

  return {
    ok: true,
    value: {
      ...state,
      planets: replacePlanet(state.planets, updatedPlanet),
      commandLog: appendCommand(state, command),
    },
  };
}
