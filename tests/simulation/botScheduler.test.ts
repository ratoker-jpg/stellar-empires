import { describe, expect, it } from 'vitest';
import { planBotEconomy } from '../../src/simulation/bots/economyPlanner';
import {
  MAX_BOT_DECISIONS_PER_RUN,
  runBotScheduler,
} from '../../src/simulation/bots/scheduler';
import type { BotProfile } from '../../src/simulation/bots/profiles';
import { getBotProgressionPhase } from '../../src/simulation/bots/progressionPhase';
import { planBotResearchAndProduction } from '../../src/simulation/bots/researchProductionPlanner';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import { executeCommand } from '../../src/simulation/reducer';
import { getCompleteResearchId } from '../../src/simulation/research/completeResearchCatalog';
import type { GameState } from '../../src/simulation/types';
import { getUnitDefinition } from '../../src/simulation/units/catalog';
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
                  building.buildingId !== roles.buildings.sensorGrid &&
                  building.buildingId !== roles.buildings.depot,
              ),
              { buildingId: roles.buildings.command, level: 3 },
              { buildingId: roles.buildings.laboratory, level: 3 },
              { buildingId: roles.buildings.shipyard, level: 3 },
              { buildingId: roles.buildings.sensorGrid, level: 1 },
              { buildingId: roles.buildings.depot, level: 1 },
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
          }
        : planet,
    ),
    research: state.research.map((research) =>
      research.empireId === empireId
        ? {
            ...research,
            levels: {
              [roles.research.construction]: 1,
              [roles.research.sensors]: 2,
              [roles.research.logistics]: 1,
              [getCompleteResearchId('aegis', 'astronomy')]: 1,
            },
            queue: [],
          }
        : research,
    ),
  };

  expect(getBotProgressionPhase(prepared, empireId)).toBe('first-combat');
  expect(planBotEconomy(prepared, empireId).command).not.toBeNull();
  const science = planBotResearchAndProduction(prepared, empireId);
  expect(science.research.command).not.toBeNull();
  expect(science.production.command).not.toBeNull();
  if (science.production.command?.type === 'QUEUE_UNIT_BATCH') {
    expect(science.production.command.unitId).not.toBe(roles.ships.colonizer);
  }
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

function createTacticalProfilePassThroughFixture(): {
  readonly state: GameState;
  readonly industrial: BotProfile;
  readonly aggressive: BotProfile;
  readonly riskPermille: number;
} {
  const empireId = 'aegis-bot';
  const state = createInitialGameState('bot-scheduler-tactical-profile');
  const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
  const target = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
  const roles = getFactionMechanicalRoles(origin.factionId);
  const targetRoles = getFactionMechanicalRoles(target.factionId);
  const fighterId = roles.ships.fighter;
  const defenseId = targetRoles.defenses.light;
  const fighter = getUnitDefinition(fighterId);
  const defense = getUnitDefinition(defenseId);
  if (fighter === undefined || defense === undefined) throw new Error('Missing tactical units.');
  const power = (definition: typeof fighter, quantity: number) => quantity * (
    definition.stats.attack * 2 + definition.stats.armor + definition.stats.shield
  );
  let configuration: { ownCount: number; targetCount: number; riskPermille: number } | null = null;
  for (let ownCount = 1; ownCount <= 20 && configuration === null; ownCount += 1) {
    for (let targetCount = 1; targetCount <= 20; targetCount += 1) {
      const riskPermille = Math.floor(
        (power(defense, targetCount) * 1_000) / Math.max(1, power(fighter, ownCount)),
      );
      if (riskPermille > 800 && riskPermille <= 900) {
        configuration = { ownCount, targetCount, riskPermille };
        break;
      }
    }
  }
  if (configuration === null) throw new Error('Missing 800-900 permille tactical fixture.');
  const zeroCost = { metal: 0, crystal: 0, gas: 0 } as const;
  const prepared: GameState = {
    ...state,
    planets: state.planets.map((planet) =>
      planet.id === origin.id
        ? {
            ...planet,
            specializationId: 'military' as const,
            buildQueue: [{
              id: 'busy-build',
              buildingId: roles.buildings.command,
              targetLevel: 99,
              startedAt: 0,
              completesAt: 100_000,
              cost: zeroCost,
            }],
            economy: {
              ...planet.economy,
              resources: {
                ...planet.economy.resources,
                gas: { ...planet.economy.resources.gas, amount: planet.economy.resources.gas.capacity },
              },
            },
            inventory: { ships: {}, defenses: {} },
            productionQueues: {
              shipyard: [{
                id: 'busy-shipyard',
                unitId: fighterId,
                kind: 'ship' as const,
                quantity: 1,
                startedAt: 0,
                completesAt: 100_000,
                cost: zeroCost,
                populationReserved: 0,
                hangarReserved: 0,
              }],
              defense: [{
                id: 'busy-defense',
                unitId: defenseId,
                kind: 'defense' as const,
                quantity: 1,
                startedAt: 0,
                completesAt: 100_000,
                cost: zeroCost,
                populationReserved: 0,
                hangarReserved: 0,
              }],
            },
          }
        : planet,
    ),
    fleets: [{
      id: 'scheduler-marginal-strike',
      empireId,
      originPlanetId: origin.id,
      location: { type: 'planet' as const, planetId: origin.id },
      status: 'stationed' as const,
      ships: { [fighterId]: configuration.ownCount },
      cargo: { metal: 0, crystal: 0, gas: 0 },
      speed: fighter.stats.speed,
      cargoCapacity: 1_000,
      mission: null,
    }],
    research: state.research.map((research) =>
      research.empireId === empireId
        ? {
            ...research,
            queue: [{
              id: 'busy-research',
              technologyId: roles.research.construction,
              targetLevel: 99,
              startedAt: 0,
              completesAt: 100_000,
              cost: zeroCost,
              planetId: origin.id,
            }],
          }
        : research,
    ),
    intelligence: state.intelligence.map((entry) =>
      entry.empireId === empireId
        ? {
            ...entry,
            observations: [{
              id: 'scheduler-marginal-intel',
              observerEmpireId: empireId,
              targetPlanetId: target.id,
              coordinate: target.coordinate,
              observedAt: state.clock.elapsedSeconds,
              expiresAt: state.clock.elapsedSeconds + 10_000,
              detected: false,
              snapshot: {
                planetId: target.id,
                coordinate: target.coordinate,
                name: target.name,
                ownerEmpireId: target.ownerEmpireId,
                factionId: target.factionId,
                level: 3 as const,
                defenses: { [defenseId]: configuration.targetCount },
                stationedFleets: [],
              },
            }],
          }
        : entry,
    ),
  };
  const baseProfile: BotProfile = {
    id: 'test.scheduler-tactical-industrial',
    empireId,
    personality: 'industrial',
    difficulty: 'normal',
    decisionIntervalSeconds: 300,
    maxCommandsPerDecision: 1,
  };
  return {
    state: prepared,
    industrial: baseProfile,
    aggressive: {
      ...baseProfile,
      id: 'test.scheduler-tactical-aggressive',
      personality: 'aggressive',
    },
    riskPermille: configuration.riskPermille,
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

  it('passes the active custom profile into tactical fleet selection', () => {
    const fixture = createTacticalProfilePassThroughFixture();
    expect(fixture.riskPermille).toBeGreaterThan(800);
    expect(fixture.riskPermille).toBeLessThanOrEqual(900);

    const industrial = runBotScheduler(fixture.state, [fixture.industrial]);
    const aggressive = runBotScheduler(fixture.state, [fixture.aggressive]);
    expect(industrial.audit.find((entry) => entry.source === 'fleet')).toBeUndefined();
    expect(aggressive.audit).toContainEqual(expect.objectContaining({
      profileId: fixture.aggressive.id,
      personality: 'aggressive',
      source: 'fleet',
      accepted: true,
      command: expect.objectContaining({
        type: 'SEND_FLEET',
        mission: 'attack',
      }),
    }));
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
