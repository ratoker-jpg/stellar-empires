import { enqueueEvent } from '../eventQueue';
import { estimateFlightToGalaxyPlanet } from '../fleets/flightCalculations';
import type { FleetState } from '../fleets/types';
import type { PlanetState } from '../planet/types';
import { AEGIS_RESEARCH_CATALOG } from '../research/catalog';
import { calculateResearchEffects } from '../research/progression';
import { getEmpireResearch } from '../research/researchState';
import type {
  CommandLogEntry,
  CommandResult,
  GameCommand,
  GameState,
  ScheduledGameEvent,
} from '../types';

export type ExpeditionOutcome = 'salvage' | 'research-cache' | 'hazard' | 'empty';

export interface ExpeditionReport {
  readonly id: string;
  readonly empireId: string;
  readonly fleetId: string;
  readonly originPlanetId: string;
  readonly targetGalaxyPlanetId: string;
  readonly startedAt: number;
  readonly resolvesAt: number;
  readonly outcome: ExpeditionOutcome;
  readonly reward: {
    readonly metal: number;
    readonly crystal: number;
    readonly gas: number;
  };
  readonly losses: Readonly<Record<string, number>>;
  readonly narrative: string;
}

function appendCommand(state: GameState, command: GameCommand): readonly CommandLogEntry[] {
  return [...state.commandLog, { index: state.commandLog.length, command }];
}

function hashText(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function getFleetSpeedBonus(state: GameState, empireId: string): number {
  const research = getEmpireResearch(state.research, empireId);
  return research === undefined
    ? 0
    : calculateResearchEffects(research, AEGIS_RESEARCH_CATALOG).fleetSpeedPercent;
}

function replaceFleet(
  fleets: readonly FleetState[],
  replacement: FleetState,
): readonly FleetState[] {
  return fleets.map((fleet) => (fleet.id === replacement.id ? replacement : fleet));
}

function replacePlanet(
  planets: readonly PlanetState[],
  replacement: PlanetState,
): readonly PlanetState[] {
  return planets.map((planet) => (planet.id === replacement.id ? replacement : planet));
}

function createOutcome(
  state: GameState,
  fleet: FleetState,
  targetGalaxyPlanetId: string,
  startedAt: number,
  resolvesAt: number,
): ExpeditionReport {
  const roll = hashText(
    `${state.seed}:${state.nextEventSequence}:${fleet.id}:${targetGalaxyPlanetId}:expedition`,
  );
  const outcomeIndex = roll % 4;
  const scale = 1 + (Math.floor(roll / 4) % 5);
  const firstShip = Object.keys(fleet.ships).sort()[0];

  if (outcomeIndex === 0) {
    return {
      id: `expedition-${state.nextEventSequence}`,
      empireId: fleet.empireId,
      fleetId: fleet.id,
      originPlanetId: fleet.location.type === 'planet' ? fleet.location.planetId : fleet.originPlanetId,
      targetGalaxyPlanetId,
      startedAt,
      resolvesAt,
      outcome: 'salvage',
      reward: { metal: 240 * scale, crystal: 120 * scale, gas: 40 * scale },
      losses: {},
      narrative: 'Экспедиция обнаружила дрейфующий промышленный конвой и извлекла уцелевший груз.',
    };
  }
  if (outcomeIndex === 1) {
    return {
      id: `expedition-${state.nextEventSequence}`,
      empireId: fleet.empireId,
      fleetId: fleet.id,
      originPlanetId: fleet.location.type === 'planet' ? fleet.location.planetId : fleet.originPlanetId,
      targetGalaxyPlanetId,
      startedAt,
      resolvesAt,
      outcome: 'research-cache',
      reward: { metal: 40 * scale, crystal: 220 * scale, gas: 120 * scale },
      losses: {},
      narrative: 'В заброшенном научном модуле найдены редкие материалы и энергоячейки.',
    };
  }
  if (outcomeIndex === 2 && firstShip !== undefined) {
    return {
      id: `expedition-${state.nextEventSequence}`,
      empireId: fleet.empireId,
      fleetId: fleet.id,
      originPlanetId: fleet.location.type === 'planet' ? fleet.location.planetId : fleet.originPlanetId,
      targetGalaxyPlanetId,
      startedAt,
      resolvesAt,
      outcome: 'hazard',
      reward: { metal: 60 * scale, crystal: 30 * scale, gas: 0 },
      losses: { [firstShip]: 1 },
      narrative: 'Аномальный фронт повредил корабль, но экипаж вернул часть найденных материалов.',
    };
  }
  return {
    id: `expedition-${state.nextEventSequence}`,
    empireId: fleet.empireId,
    fleetId: fleet.id,
    originPlanetId: fleet.location.type === 'planet' ? fleet.location.planetId : fleet.originPlanetId,
    targetGalaxyPlanetId,
    startedAt,
    resolvesAt,
    outcome: 'empty',
    reward: { metal: 0, crystal: 0, gas: 0 },
    losses: {},
    narrative: 'Сектор оказался пуст. Экспедиция вернулась без значимых находок.',
  };
}

export function startExpedition(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'START_EXPEDITION' }>,
): CommandResult<GameState> {
  const fleet = state.fleets.find((candidate) => candidate.id === command.fleetId);
  if (fleet === undefined) {
    return { ok: false, code: 'FLEET_NOT_FOUND', message: 'Fleet not found.' };
  }
  if (fleet.empireId !== command.empireId) {
    return { ok: false, code: 'NOT_FLEET_OWNER', message: 'Empire does not own the fleet.' };
  }
  if (fleet.status !== 'stationed' || fleet.location.type !== 'planet') {
    return { ok: false, code: 'FLEET_NOT_STATIONED', message: 'Fleet is not ready for an expedition.' };
  }
  if ((fleet.ships['ship.aegis.scout'] ?? 0) <= 0) {
    return {
      ok: false,
      code: 'EXPEDITION_SCOUT_REQUIRED',
      message: 'An expedition requires at least one scout ship.',
    };
  }
  const originPlanetId = fleet.location.planetId;
  const origin = state.planets.find((planet) => planet.id === originPlanetId);
  if (origin === undefined || origin.ownerEmpireId !== command.empireId) {
    return { ok: false, code: 'EXPEDITION_ORIGIN_UNAVAILABLE', message: 'Expedition origin is unavailable.' };
  }
  const target = state.galaxy.systems
    .flatMap((system) => system.planets)
    .find((planet) => planet.id === command.targetGalaxyPlanetId);
  if (target === undefined) {
    return { ok: false, code: 'EXPEDITION_TARGET_NOT_FOUND', message: 'Expedition target does not exist.' };
  }
  if (state.planets.some((planet) => planet.galaxyPlanetId === target.id)) {
    return {
      ok: false,
      code: 'EXPEDITION_TARGET_OCCUPIED',
      message: 'Expeditions require an undeveloped galaxy position.',
    };
  }

  const estimate = estimateFlightToGalaxyPlanet(
    state.galaxy,
    state.planets,
    fleet,
    target.id,
    getFleetSpeedBonus(state, command.empireId),
  );
  const fuelRequired = estimate.fuelCost * 2;
  if (origin.economy.resources.gas.amount < fuelRequired) {
    return {
      ok: false,
      code: 'INSUFFICIENT_EXPEDITION_FUEL',
      message: 'Origin planet does not have enough gas for the round trip.',
      details: { required: fuelRequired, available: origin.economy.resources.gas.amount },
    };
  }

  const startedAt = state.clock.elapsedSeconds;
  const resolvesAt = startedAt + estimate.durationSeconds * 2;
  const report = createOutcome(state, fleet, target.id, startedAt, resolvesAt);
  const event: ScheduledGameEvent = {
    id: `event-${state.nextEventSequence}`,
    executeAt: resolvesAt,
    sequence: state.nextEventSequence,
    payload: { type: 'EXPEDITION_RESOLVE', report },
  };
  const updatedFleet: FleetState = {
    ...fleet,
    status: 'outbound',
    mission: { kind: 'expedition', targetPlanetId: target.id },
    location: {
      type: 'transit',
      fromPlanetId: origin.id,
      toPlanetId: target.id,
      departedAt: startedAt,
      arrivesAt: resolvesAt,
    },
  };
  const updatedOrigin: PlanetState = {
    ...origin,
    economy: {
      ...origin.economy,
      resources: {
        ...origin.economy.resources,
        gas: {
          ...origin.economy.resources.gas,
          amount: origin.economy.resources.gas.amount - fuelRequired,
        },
      },
    },
  };

  return {
    ok: true,
    value: {
      ...state,
      fleets: replaceFleet(state.fleets, updatedFleet),
      planets: replacePlanet(state.planets, updatedOrigin),
      nextEventSequence: state.nextEventSequence + 1,
      pendingEvents: enqueueEvent(state.pendingEvents, event),
      commandLog: appendCommand(state, command),
    },
  };
}

function addReward(planet: PlanetState, report: ExpeditionReport): PlanetState {
  return {
    ...planet,
    economy: {
      ...planet.economy,
      resources: {
        metal: {
          ...planet.economy.resources.metal,
          amount: Math.min(
            planet.economy.resources.metal.capacity,
            planet.economy.resources.metal.amount + report.reward.metal,
          ),
        },
        crystal: {
          ...planet.economy.resources.crystal,
          amount: Math.min(
            planet.economy.resources.crystal.capacity,
            planet.economy.resources.crystal.amount + report.reward.crystal,
          ),
        },
        gas: {
          ...planet.economy.resources.gas,
          amount: Math.min(
            planet.economy.resources.gas.capacity,
            planet.economy.resources.gas.amount + report.reward.gas,
          ),
        },
      },
    },
  };
}

function applyLosses(
  ships: Readonly<Record<string, number>>,
  losses: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> {
  return Object.fromEntries(
    Object.entries(ships)
      .map(([unitId, quantity]) => [unitId, Math.max(0, quantity - (losses[unitId] ?? 0))] as const)
      .filter(([, quantity]) => quantity > 0),
  );
}

export function applyExpeditionEvent(
  state: GameState,
  event: ScheduledGameEvent,
): GameState {
  if (event.payload.type !== 'EXPEDITION_RESOLVE') return state;
  const report = event.payload.report;
  const fleet = state.fleets.find((candidate) => candidate.id === report.fleetId);
  if (
    fleet === undefined ||
    fleet.mission?.kind !== 'expedition' ||
    fleet.mission.targetPlanetId !== report.targetGalaxyPlanetId
  ) {
    return state;
  }
  const origin = state.planets.find((planet) => planet.id === report.originPlanetId);
  const ships = applyLosses(fleet.ships, report.losses);
  const fleets =
    Object.keys(ships).length === 0
      ? state.fleets.filter((candidate) => candidate.id !== fleet.id)
      : replaceFleet(state.fleets, {
          ...fleet,
          ships,
          status: 'stationed',
          mission: null,
          location: { type: 'planet', planetId: report.originPlanetId },
        });
  return {
    ...state,
    fleets,
    planets: origin === undefined ? state.planets : replacePlanet(state.planets, addReward(origin, report)),
  };
}
