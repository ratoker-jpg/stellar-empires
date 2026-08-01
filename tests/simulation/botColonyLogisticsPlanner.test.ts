import { describe, expect, it } from 'vitest';
import { updateGalaxyPlanetOwner } from '../../src/simulation/colonization/colonization';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionIdForEmpire } from '../../src/simulation/factions/factionMechanicalCatalogRegistry';
import {
  BOT_LOGISTICS_INTERVAL_SECONDS,
  planBotColonyLogistics,
} from '../../src/simulation/bots/colonyLogisticsPlanner';
import type { BotProfile } from '../../src/simulation/bots/profiles';
import { runBotScheduler } from '../../src/simulation/bots/scheduler';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState } from '../../src/simulation/types';

function setResource(
  state: GameState,
  planetId: string,
  resourceId: 'metal' | 'crystal' | 'gas',
  amount: number,
  capacity: number,
  productionPerHour: number,
): GameState {
  return {
    ...state,
    planets: state.planets.map((planet) =>
      planet.id === planetId
        ? {
            ...planet,
            economy: {
              ...planet.economy,
              resources: {
                ...planet.economy.resources,
                [resourceId]: {
                  ...planet.economy.resources[resourceId],
                  amount,
                  capacity,
                  productionPerHour,
                  productionRemainder: 0,
                },
              },
            },
          }
        : planet),
  };
}

function createTwoColonyBotState(
  seed: string,
  empireId = 'aegis-bot',
  canonicalRoles = false,
): GameState {
  const initial = createInitialGameState(seed);
  const home = initial.planets.find((planet) => planet.ownerEmpireId === empireId);
  const secondary = initial.planets.find((planet) => planet.ownerEmpireId === 'player');
  if (home === undefined || secondary === undefined) {
    throw new Error('Expected bot and player colonies.');
  }
  const factionId = getFactionIdForEmpire(initial, empireId);
  const candidates = [
    {
      ...home,
      buildQueue: [],
      productionQueues: { shipyard: [], defense: [] },
    },
    {
      ...secondary,
      ownerEmpireId: empireId,
      factionId,
      name: `${empireId} logistics colony`,
      buildQueue: [],
      productionQueues: { shipyard: [], defense: [] },
    },
  ].sort((left, right) =>
    left.systemId.localeCompare(right.systemId) ||
    left.position - right.position ||
    left.id.localeCompare(right.id));
  const assignments = canonicalRoles
    ? [
        { specializationId: 'industry' as const, developmentTemplateId: 'industrial-hub' as const },
        { specializationId: 'resource' as const, developmentTemplateId: 'resource-hub' as const },
      ]
    : [
        { specializationId: 'resource' as const, developmentTemplateId: 'resource-hub' as const },
        { specializationId: 'balanced' as const, developmentTemplateId: 'balanced' as const },
      ];
  const replacements = new Map(candidates.map((planet, index) => [
    planet.id,
    { ...planet, ...assignments[index]! },
  ]));
  return {
    ...initial,
    galaxy: updateGalaxyPlanetOwner(initial.galaxy, secondary.galaxyPlanetId, empireId),
    planets: initial.planets.map((planet) => replacements.get(planet.id) ?? planet),
    fleets: initial.fleets.filter((fleet) =>
      fleet.originPlanetId !== secondary.id &&
      !(fleet.location.type === 'planet' && fleet.location.planetId === secondary.id)),
    botAutomation: {
      nextDecisionAtByEmpire: {
        ...initial.botAutomation.nextDecisionAtByEmpire,
        [empireId]: 0,
      },
    },
  };
}

function createPressureState(seed: string): GameState {
  let state = createTwoColonyBotState(seed, 'aegis-bot', true);
  const colonies = state.planets
    .filter((planet) => planet.ownerEmpireId === 'aegis-bot')
    .sort((left, right) =>
      left.systemId.localeCompare(right.systemId) ||
      left.position - right.position ||
      left.id.localeCompare(right.id));
  const donor = colonies[0]!;
  const receiver = colonies[1]!;
  for (const resourceId of ['metal', 'crystal', 'gas'] as const) {
    state = setResource(state, donor.id, resourceId, 5_000, 10_000, 0);
    state = setResource(state, receiver.id, resourceId, 5_000, 10_000, 0);
  }
  state = setResource(state, donor.id, 'metal', 8_000, 10_000, 500);
  state = setResource(state, receiver.id, 'metal', 1_000, 10_000, 0);
  return state;
}

describe('bot colony logistics planner', () => {
  it('converges mismatched preexisting roles in canonical colony order', () => {
    let state = createTwoColonyBotState('bot-role-convergence');
    const empireId = 'aegis-bot';
    const acceptedCommands: string[] = [];

    for (let index = 0; index < 4; index += 1) {
      const plan = planBotColonyLogistics(state, empireId);
      expect(plan.command).not.toBeNull();
      if (plan.command === null) return;
      acceptedCommands.push(plan.command.type);
      const result = executeCommand(state, plan.command);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      state = result.value;
    }

    expect(acceptedCommands).toEqual([
      'SET_PLANET_SPECIALIZATION',
      'SET_PLANET_DEVELOPMENT_TEMPLATE',
      'SET_PLANET_SPECIALIZATION',
      'SET_PLANET_DEVELOPMENT_TEMPLATE',
    ]);
    const colonies = state.planets
      .filter((planet) => planet.ownerEmpireId === empireId)
      .sort((left, right) =>
        left.systemId.localeCompare(right.systemId) ||
        left.position - right.position ||
        left.id.localeCompare(right.id));
    expect(colonies[0]).toMatchObject({
      specializationId: 'industry',
      developmentTemplateId: 'industrial-hub',
    });
    expect(colonies[1]).toMatchObject({
      specializationId: 'resource',
      developmentTemplateId: 'resource-hub',
    });
  });

  it('waits for a blocking local queue instead of changing a later colony first', () => {
    const initial = createTwoColonyBotState('bot-role-queue');
    const first = initial.planets
      .filter((planet) => planet.ownerEmpireId === 'aegis-bot')
      .sort((left, right) =>
        left.systemId.localeCompare(right.systemId) ||
        left.position - right.position ||
        left.id.localeCompare(right.id))[0]!;
    const state: GameState = {
      ...initial,
      planets: initial.planets.map((planet) =>
        planet.id === first.id
          ? {
              ...planet,
              buildQueue: [{
                id: 'blocking-build',
                buildingId: planet.buildings[0]?.buildingId ?? 'building.aegis.command',
                targetLevel: 2,
                startedAt: 0,
                completesAt: 100,
                cost: { metal: 1, crystal: 1, gas: 1 },
              }],
            }
          : planet),
    };

    expect(planBotColonyLogistics(state, 'aegis-bot')).toMatchObject({
      reasonCode: 'role-specialization-busy',
      command: null,
      roleChange: false,
    });
  });

  it('creates and updates an ordinary route from deterministic pressure', () => {
    const state = createPressureState('bot-route-create');
    const colonies = state.planets
      .filter((planet) => planet.ownerEmpireId === 'aegis-bot')
      .sort((left, right) =>
        left.systemId.localeCompare(right.systemId) ||
        left.position - right.position ||
        left.id.localeCompare(right.id));
    const create = planBotColonyLogistics(state, 'aegis-bot');
    expect(create).toMatchObject({ reasonCode: 'create-route', roleChange: false });
    expect(create.command).toEqual({
      type: 'CREATE_LOGISTICS_ROUTE',
      empireId: 'aegis-bot',
      originPlanetId: colonies[0]!.id,
      targetPlanetId: colonies[1]!.id,
      resourceId: 'metal',
      amountPerTrip: 500,
      originReserve: 4_000,
      intervalSeconds: BOT_LOGISTICS_INTERVAL_SECONDS,
      priority: 3,
    });
    if (create.command === null) return;
    const created = executeCommand(state, create.command);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const altered: GameState = {
      ...created.value,
      logisticsRoutes: created.value.logisticsRoutes.map((route) => ({
        ...route,
        status: 'paused' as const,
        amountPerTrip: 100,
        priority: 1 as const,
      })),
    };

    expect(planBotColonyLogistics(altered, 'aegis-bot')).toMatchObject({
      reasonCode: 'update-route',
      command: {
        type: 'UPDATE_LOGISTICS_ROUTE',
        amountPerTrip: 500,
        originReserve: 4_000,
        intervalSeconds: BOT_LOGISTICS_INTERVAL_SECONDS,
        priority: 3,
        status: 'active',
      },
    });
  });

  it('uses the ordinary market on a critical receiver with no eligible donor', () => {
    let state = createTwoColonyBotState('bot-market-fallback', 'aegis-bot', true);
    const colonies = state.planets
      .filter((planet) => planet.ownerEmpireId === 'aegis-bot')
      .sort((left, right) =>
        left.systemId.localeCompare(right.systemId) ||
        left.position - right.position ||
        left.id.localeCompare(right.id));
    const first = colonies[0]!;
    const receiver = colonies[1]!;
    for (const resourceId of ['metal', 'crystal', 'gas'] as const) {
      state = setResource(state, first.id, resourceId, 5_000, 10_000, 0);
      state = setResource(state, receiver.id, resourceId, 5_000, 10_000, 0);
    }
    state = setResource(state, receiver.id, 'metal', 8_000, 10_000, 0);
    state = setResource(state, receiver.id, 'gas', 1_000, 10_000, 0);

    const plan = planBotColonyLogistics(state, 'aegis-bot');
    expect(plan).toMatchObject({
      reasonCode: 'emergency-market',
      roleChange: false,
      command: {
        type: 'MARKET_SWAP',
        empireId: 'aegis-bot',
        planetId: receiver.id,
        giveResourceId: 'metal',
        receiveResourceId: 'gas',
      },
    });
  });

  it('schedules at most one logistics-source command per bot decision', () => {
    const state = createTwoColonyBotState('bot-scheduler-logistics');
    const profile: BotProfile = {
      id: 'test-logistics-profile',
      empireId: 'aegis-bot',
      personality: 'industrial',
      difficulty: 'normal',
      decisionIntervalSeconds: 300,
      maxCommandsPerDecision: 3,
    };

    const result = runBotScheduler(state, [profile], 1);
    expect(result.audit.filter((entry) => entry.source === 'logistics')).toHaveLength(1);
    expect(result.audit.find((entry) => entry.source === 'logistics')).toMatchObject({
      accepted: true,
      command: { type: 'SET_PLANET_SPECIALIZATION' },
    });
  });
});
