import { describe, expect, it } from 'vitest';
import { planBotEconomy } from '../../src/simulation/bots/economyPlanner';
import { planBotFleetMission } from '../../src/simulation/bots/fleetMissionPlanner';
import {
  MAX_BOT_DECISIONS_PER_RUN,
  runBotScheduler,
} from '../../src/simulation/bots/scheduler';
import type { BotProfile } from '../../src/simulation/bots/profiles';
import { planBotResearchAndProduction } from '../../src/simulation/bots/researchProductionPlanner';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import { executeCommand } from '../../src/simulation/reducer';
import { getCompleteResearchId } from '../../src/simulation/research/completeResearchCatalog';
import type { GameState } from '../../src/simulation/types';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';
import { handleBotSchedulerRequest } from '../../src/workers/botScheduler.worker';

function advance(state: ReturnType<typeof createInitialGameState>, seconds: number) {
  const result = executeCommand(state, { type: 'ADVANCE_TIME', seconds });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.message);
  return result.value;
}

function createEqualizedCompressedStrategyFixture(): GameState {
  const empireId = 'aegis-bot';
  const state = createInitialGameState('bot-scheduler-strategy-gap');
  const roles = getFactionMechanicalRoles('aegis');
  const prepared: GameState = {
    ...state,
    planets: state.planets.map((planet) =>
      planet.ownerEmpireId === empireId
        ? {
            ...planet,
            buildings: [
              ...planet.buildings.filter(
                (building) =>
                  building.buildingId !== roles.buildings.command &&
                  building.buildingId !== roles.buildings.laboratory &&
                  building.buildingId !== roles.buildings.shipyard &&
                  building.buildingId !== roles.buildings.sensorGrid,
              ),
              { buildingId: roles.buildings.command, level: 3 },
              { buildingId: roles.buildings.laboratory, level: 3 },
              { buildingId: roles.buildings.shipyard, level: 2 },
              { buildingId: roles.buildings.sensorGrid, level: 1 },
            ],
            economy: {
              ...planet.economy,
              resources: {
                metal: {
                  ...planet.economy.resources.metal,
                  amount: planet.economy.resources.metal.capacity,
                },
                crystal: {
                  ...planet.economy.resources.crystal,
                  amount: planet.economy.resources.crystal.capacity,
                },
                gas: {
                  ...planet.economy.resources.gas,
                  amount: planet.economy.resources.gas.capacity,
                },
              },
              population: {
                ...planet.economy.population,
                capacity: 100,
              },
            },
            inventory: {
              ...planet.inventory,
              ships: {
                ...planet.inventory.ships,
                [roles.ships.scout]: 2,
                [roles.ships.fighter]: 6,
              },
            },
          }
        : planet,
    ),
    research: state.research.map((research) =>
      research.empireId === empireId
        ? {
            ...research,
            levels: {
              [roles.research.construction]: 1,
              [roles.research.sensors]: 1,
              [getCompleteResearchId('aegis', 'astronomy')]: 1,
            },
            queue: [],
          }
        : research,
    ),
  };

  expect(planBotEconomy(prepared, empireId).command).not.toBeNull();
  const science = planBotResearchAndProduction(prepared, empireId);
  expect(science.research.command).not.toBeNull();
  expect(science.production.command).not.toBeNull();
  expect(planBotFleetMission(prepared, empireId).command).not.toBeNull();
  return prepared;
}

function equalizedProfile(personality: BotProfile['personality']): BotProfile {
  return {
    id: `test.equalized-${personality}`,
    empireId: 'aegis-bot',
    personality,
    difficulty: 'normal',
    decisionIntervalSeconds: 300,
    maxCommandsPerDecision: 1,
  };
}

describe('autonomous bot scheduler', () => {
  it('runs due profiles and records accepted normal commands', () => {
    const state = createInitialGameState('bot-scheduler-initial');
    const result = runBotScheduler(state);
    expect(result.audit.length).toBeGreaterThan(0);
    expect(result.audit.every((entry) => entry.accepted)).toBe(true);
    expect(result.state.commandLog.length).toBe(result.audit.length);
    expect(result.processedDecisions).toBe(3);
    expect(result.hasMoreDueDecisions).toBe(false);
    expect(new Set(result.audit.map((entry) => entry.empireId))).toEqual(
      new Set(['aegis-bot', 'synod-bot', 'veyra-bot']),
    );
    expect(new Set(result.audit.map((entry) => entry.decidedAt))).toEqual(new Set([0]));
  });

  it('does not run twice at the same game time', () => {
    const state = createInitialGameState('bot-scheduler-idempotent');
    const first = runBotScheduler(state);
    const second = runBotScheduler(first.state);
    expect(second.audit).toEqual([]);
    expect(second.processedDecisions).toBe(0);
    expect(second.state).toEqual(first.state);
  });

  it('catches up every due profile cadence in canonical game-time order', () => {
    const state = createInitialGameState('bot-scheduler-cadence');
    const first = runBotScheduler(state);
    const second = runBotScheduler(advance(first.state, 600));
    expect(second.processedDecisions).toBe(6);
    expect(second.audit.map((entry) => entry.decidedAt)).toEqual(
      [...second.audit.map((entry) => entry.decidedAt)].sort((left, right) => left - right),
    );
    expect(new Set(second.audit.map((entry) => entry.decidedAt))).toEqual(
      new Set([240]),
    );
    expect(second.state.botAutomation.nextDecisionAtByEmpire).toEqual({
      'aegis-bot': 720,
      'synod-bot': 720,
      'veyra-bot': 720,
    });
  });

  it('bounds large catch-up runs and resumes deterministically until drained', () => {
    const initial = runBotScheduler(createInitialGameState('bot-scheduler-budget')).state;
    const jumped = advance(initial, 86_400);

    function drain() {
      let state = jumped;
      const decidedAt: number[] = [];
      let runs = 0;
      while (runs < 1_000) {
        const result = runBotScheduler(state);
        expect(result.processedDecisions).toBeLessThanOrEqual(MAX_BOT_DECISIONS_PER_RUN);
        decidedAt.push(...result.audit.map((entry) => entry.decidedAt));
        state = result.state;
        runs += 1;
        if (!result.hasMoreDueDecisions) return { state, decidedAt, runs };
      }
      throw new Error('Bot catch-up did not drain within the safety limit.');
    }

    const first = drain();
    const second = drain();
    expect(first).toEqual(second);
    expect(first.runs).toBeGreaterThan(1);
    expect(first.decidedAt).toEqual([...first.decidedAt].sort((left, right) => left - right));
  }, 20_000);

  it('enforces difficulty limits and honest personality fallback', () => {
    const state = createInitialGameState('bot-scheduler-profile');
    const easyIndustrial: BotProfile = {
      id: 'test.easy-industrial',
      empireId: 'aegis-bot',
      personality: 'industrial',
      difficulty: 'easy',
      decisionIntervalSeconds: 900,
      maxCommandsPerDecision: 1,
    };
    const industrial = runBotScheduler(state, [easyIndustrial]);
    expect(industrial.audit).toHaveLength(1);
    expect(industrial.audit[0]).toMatchObject({
      personality: 'industrial',
      source: 'economy',
      decidedAt: 0,
    });

    const aggressive: BotProfile = {
      ...easyIndustrial,
      id: 'test.easy-aggressive',
      personality: 'aggressive',
    };
    const attackFirst = runBotScheduler(state, [aggressive]);
    expect(attackFirst.audit).toHaveLength(1);
    expect(attackFirst.audit[0]).toMatchObject({
      personality: 'aggressive',
      source: 'economy',
      decidedAt: 0,
    });
  });

  it('differentiates compressed ordinary strategy on an equalized multi-source fixture', () => {
    const state = createEqualizedCompressedStrategyFixture();
    const industrial = runBotScheduler(state, [equalizedProfile('industrial')]);
    const explorer = runBotScheduler(state, [equalizedProfile('explorer')]);
    const aggressive = runBotScheduler(state, [equalizedProfile('aggressive')]);

    expect(industrial.audit).toHaveLength(1);
    expect(explorer.audit).toHaveLength(1);
    expect(aggressive.audit).toHaveLength(1);
    expect(industrial.audit[0]).toMatchObject({
      personality: 'industrial',
      source: 'economy',
      accepted: true,
    });
    expect(explorer.audit[0]).toMatchObject({
      personality: 'explorer',
      source: 'research',
      accepted: true,
    });
    expect(aggressive.audit[0]).toMatchObject({
      personality: 'aggressive',
      source: 'production',
      accepted: true,
    });
    expect(new Set([
      industrial.audit[0]?.source,
      explorer.audit[0]?.source,
      aggressive.audit[0]?.source,
    ])).toEqual(new Set(['economy', 'research', 'production']));

    expect(runBotScheduler(state, [equalizedProfile('industrial')])).toEqual(industrial);
    expect(runBotScheduler(state, [equalizedProfile('explorer')])).toEqual(explorer);
    expect(runBotScheduler(state, [equalizedProfile('aggressive')])).toEqual(aggressive);

    const hiddenPlayerChange: GameState = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.ownerEmpireId === 'player'
          ? {
              ...planet,
              economy: {
                ...planet.economy,
                resources: {
                  ...planet.economy.resources,
                  gas: { ...planet.economy.resources.gas, amount: 999_999 },
                },
              },
            }
          : planet,
      ),
    };
    expect(runBotScheduler(hiddenPlayerChange, [equalizedProfile('industrial')]).audit)
      .toEqual(industrial.audit);
    expect(runBotScheduler(hiddenPlayerChange, [equalizedProfile('explorer')]).audit)
      .toEqual(explorer.audit);
    expect(runBotScheduler(hiddenPlayerChange, [equalizedProfile('aggressive')]).audit)
      .toEqual(aggressive.audit);
  });

  it('uses a serializable worker request and response without runtime-only cursor state', () => {
    const state = createInitialGameState('bot-scheduler-worker');
    const response = handleBotSchedulerRequest({
      type: 'RUN_BOT_SCHEDULER',
      requestId: 7,
      baseStateChecksum: createStateChecksum(state),
      state,
    });
    expect(response).toMatchObject({
      type: 'BOT_SCHEDULER_RESULT',
      requestId: 7,
      baseStateChecksum: createStateChecksum(state),
      processedDecisions: 3,
      hasMoreDueDecisions: false,
    });
    expect(JSON.parse(JSON.stringify(response))).toEqual(response);
  });

  it('preserves the next bot decisions across save and load', () => {
    const first = runBotScheduler(createInitialGameState('bot-scheduler-save')).state;
    const partiallyCaughtUp = runBotScheduler(advance(first, 3_600), undefined, 2).state;
    const save = createSaveEnvelope('bot-time', partiallyCaughtUp, '2026-07-21T16:00:00.000Z');
    const parsed = parseSaveJson(serializeSave(save));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.value.state.botAutomation).toEqual(partiallyCaughtUp.botAutomation);
    expect(runBotScheduler(parsed.value.state)).toEqual(runBotScheduler(partiallyCaughtUp));
  });

  it('records shared mission blockers as serializable scheduler diagnostics', () => {
    let state = createInitialGameState('bot-scheduler-diagnostic');
    const empireId = 'aegis-bot';
    const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
    const roles = getFactionMechanicalRoles('aegis');
    state = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.id === origin.id
          ? {
              ...planet,
              inventory: { ships: {}, defenses: {} },
              economy: {
                ...planet.economy,
                resources: {
                  ...planet.economy.resources,
                  gas: { ...planet.economy.resources.gas, amount: 0 },
                },
              },
            }
          : planet,
      ),
      fleets: [{
        id: 'diagnostic-scout',
        empireId,
        originPlanetId: origin.id,
        location: { type: 'planet' as const, planetId: origin.id },
        status: 'stationed' as const,
        ships: { [roles.ships.scout]: 1 },
        cargo: { metal: 0, crystal: 0, gas: 0 },
        speed: 1_000,
        cargoCapacity: 100,
        mission: null,
      }],
    };
    const profile: BotProfile = {
      id: 'test.blocked-explorer',
      empireId,
      personality: 'explorer',
      difficulty: 'easy',
      decisionIntervalSeconds: 900,
      maxCommandsPerDecision: 1,
    };
    const result = runBotScheduler(state, [profile]);
    expect(result.diagnostics).toEqual([{
      empireId,
      profileId: profile.id,
      personality: 'explorer',
      decidedAt: 0,
      source: 'fleet',
      reasonCode: 'mission-blocked-fuel',
      availabilityCode: 'INSUFFICIENT_FLIGHT_FUEL',
      explanation: expect.any(String),
    }]);
    expect(JSON.parse(JSON.stringify(result.diagnostics))).toEqual(result.diagnostics);
  });

  it('does not change decisions when hidden player resources change', () => {
    const state = createInitialGameState('bot-scheduler-hidden');
    const before = runBotScheduler(state);
    const changed = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.ownerEmpireId === 'player'
          ? {
              ...planet,
              economy: {
                ...planet.economy,
                resources: {
                  ...planet.economy.resources,
                  gas: { ...planet.economy.resources.gas, amount: 9_999 },
                },
              },
            }
          : planet,
      ),
    };
    const after = runBotScheduler(changed);
    expect(after.audit).toEqual(before.audit);
    expect(after.state.botAutomation).toEqual(before.state.botAutomation);
  });
});
