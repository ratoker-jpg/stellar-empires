import { describe, expect, it } from 'vitest';
import { runCampaignCatchUp } from '../../src/runtime/campaignTimeRuntime';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { SOLAR_WAR_CYCLE_SECONDS } from '../../src/simulation/endgame/types';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import type { FleetState } from '../../src/simulation/fleets/types';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState } from '../../src/simulation/types';
import { createCampaignRuntimeMetadata } from '../../src/storage/runtimeMetadata';

const START_TIME = '2026-08-03T00:00:00.000Z';
const TARGET_TIME = '2026-08-04T00:00:00.000Z';

function execute(state: GameState, command: Parameters<typeof executeCommand>[1]): GameState {
  const result = executeCommand(state, command);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(`${result.code}: ${result.message}`);
  return result.value;
}

function createSolarWarState(): GameState {
  const initial = createInitialGameState('solar-war-offline-partition');
  const origin = initial.planets.find((planet) => planet.ownerEmpireId === 'player');
  if (origin === undefined) throw new Error('Player origin is missing.');
  const ships = getFactionMechanicalRoles(origin.factionId).ships.complete;
  const fleet: FleetState = {
    id: 'solar-war-offline-fleet',
    empireId: 'player',
    originPlanetId: origin.id,
    location: { type: 'planet', planetId: origin.id },
    status: 'stationed',
    ships: {
      [ships.heavyAssault]: 80,
      [ships.lineBattleship]: 120,
      [ships.interceptor]: 160,
    },
    cargo: { metal: 0, crystal: 0, gas: 0 },
    speed: 6,
    cargoCapacity: 10_000,
    mission: null,
  };
  const fast: GameState = {
    ...initial,
    fleets: [fleet],
    pendingEvents: [],
    logisticsRoutes: [],
    botAutomation: {
      nextDecisionAtByEmpire: Object.fromEntries(
        initial.empires
          .filter((empireId) => empireId !== 'player')
          .map((empireId) => [empireId, Number.MAX_SAFE_INTEGER]),
      ),
    },
    worldEvents: {
      ...initial.worldEvents,
      active: [],
      nextEvaluationAt: Number.MAX_SAFE_INTEGER,
    },
  };
  return execute(fast, {
    type: 'ENTER_SOLAR_WAR',
    empireId: 'player',
    fleetId: fleet.id,
  });
}

function projection(state: GameState) {
  return {
    clock: state.clock,
    fleets: state.fleets,
    endgameParticipation: state.endgameParticipation,
    pendingEvents: state.pendingEvents,
    nextEventSequence: state.nextEventSequence,
  };
}

describe('Solar War offline runtime partition', () => {
  it('matches direct campaign time at the exact cycle boundary', async () => {
    const entered = createSolarWarState();
    const direct = execute(entered, {
      type: 'ADVANCE_TIME',
      seconds: SOLAR_WAR_CYCLE_SECONDS,
    });
    const offline = await runCampaignCatchUp({
      state: entered,
      runtimeMetadata: createCampaignRuntimeMetadata(START_TIME),
      targetAtReal: TARGET_TIME,
      checkpoint: async () => undefined,
      yieldControl: async () => undefined,
    });

    expect(offline.runtimeMetadata.pendingCatchUp).toBeUndefined();
    expect(offline.runtimeMetadata.lastActiveAtReal).toBe(TARGET_TIME);
    expect(projection(offline.state)).toEqual(projection(direct));
  });
});
