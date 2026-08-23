import { describe, expect, it } from 'vitest';
import {
  planAllBotFleetMissions,
  planBotFleetMission,
} from '../../src/simulation/bots/fleetMissionPlanner';
import {
  DEFAULT_BOT_PROFILES,
  type BotPersonality,
  type BotProfile,
} from '../../src/simulation/bots/profiles';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import { getMissionAvailability } from '../../src/simulation/fleets/missionRules';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState } from '../../src/simulation/types';
import { getUnitDefinition } from '../../src/simulation/units/catalog';

const ZERO_CARGO = { metal: 0, crystal: 0, gas: 0 } as const;

function fillGas(state: GameState, empireId: string): GameState {
  return {
    ...state,
    planets: state.planets.map((planet) =>
      planet.ownerEmpireId === empireId
        ? {
            ...planet,
            economy: {
              ...planet.economy,
              resources: {
                ...planet.economy.resources,
                gas: {
                  ...planet.economy.resources.gas,
                  amount: planet.economy.resources.gas.capacity,
                },
              },
            },
          }
        : planet,
    ),
  };
}

function isolatedScoutState(seed: string): {
  readonly state: GameState;
  readonly empireId: string;
  readonly originId: string;
  readonly targetId: string;
  readonly scoutId: string;
} {
  let state = fillGas(createInitialGameState(seed), 'aegis-bot');
  const empireId = 'aegis-bot';
  const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
  const target = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
  const roles = getFactionMechanicalRoles('aegis');
  const scoutId = `${seed}-scout`;
  state = {
    ...state,
    planets: state.planets.map((planet) =>
      planet.id === origin.id
        ? { ...planet, inventory: { ships: {}, defenses: {} } }
        : planet,
    ),
    fleets: [{
      id: scoutId,
      empireId,
      originPlanetId: origin.id,
      location: { type: 'planet' as const, planetId: origin.id },
      status: 'stationed' as const,
      ships: { [roles.ships.scout]: 1 },
      cargo: ZERO_CARGO,
      speed: 1_000,
      cargoCapacity: 100,
      mission: null,
    }],
    pendingEvents: [],
  };
  return { state, empireId, originId: origin.id, targetId: target.id, scoutId };
}

function tacticalProfile(personality: BotPersonality): BotProfile {
  const base = DEFAULT_BOT_PROFILES.find((profile) => profile.empireId === 'aegis-bot');
  if (base === undefined) throw new Error('Missing Aegis bot profile.');
  return { ...base, id: `aegis-${personality}-risk-test`, personality };
}

function catalogPower(unitId: string, quantity: number): number {
  const definition = getUnitDefinition(unitId);
  if (definition === undefined) throw new Error(`Missing unit definition: ${unitId}`);
  return quantity * (
    definition.stats.attack * 2 +
    definition.stats.armor +
    definition.stats.shield
  );
}

function findRiskWindow(
  ownUnitId: string,
  targetUnitId: string,
  minimumExclusive: number,
  maximumInclusive: number,
): { readonly ownCount: number; readonly targetCount: number; readonly riskPermille: number } {
  for (let ownCount = 1; ownCount <= 20; ownCount += 1) {
    for (let targetCount = 1; targetCount <= 20; targetCount += 1) {
      const riskPermille = Math.min(
        9_999,
        Math.floor(
          (catalogPower(targetUnitId, targetCount) * 1_000) /
          Math.max(1, catalogPower(ownUnitId, ownCount)),
        ),
      );
      if (riskPermille > minimumExclusive && riskPermille <= maximumInclusive) {
        return { ownCount, targetCount, riskPermille };
      }
    }
  }
  throw new Error(`No catalog risk window (${minimumExclusive}, ${maximumInclusive}] found.`);
}

function tacticalAttackFixture(
  seed: string,
  minimumExclusive: number,
  maximumInclusive: number,
): {
  readonly state: GameState;
  readonly empireId: string;
  readonly targetId: string;
  readonly riskPermille: number;
} {
  const empireId = 'aegis-bot';
  let state = fillGas(createInitialGameState(seed), empireId);
  const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
  const target = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
  const ownRoles = getFactionMechanicalRoles(origin.factionId);
  const targetRoles = getFactionMechanicalRoles(target.factionId);
  const fighterId = ownRoles.ships.fighter;
  const defenseId = targetRoles.defenses.light;
  const configuration = findRiskWindow(
    fighterId,
    defenseId,
    minimumExclusive,
    maximumInclusive,
  );
  const speed = getUnitDefinition(fighterId)?.stats.speed;
  if (speed === undefined) throw new Error(`Missing fighter speed: ${fighterId}`);
  state = {
    ...state,
    planets: state.planets.map((planet) =>
      planet.id === origin.id
        ? { ...planet, inventory: { ships: {}, defenses: {} } }
        : planet,
    ),
    fleets: [{
      id: `${seed}-strike`,
      empireId,
      originPlanetId: origin.id,
      location: { type: 'planet' as const, planetId: origin.id },
      status: 'stationed' as const,
      ships: { [fighterId]: configuration.ownCount },
      cargo: ZERO_CARGO,
      speed,
      cargoCapacity: 1_000,
      mission: null,
    }],
    pendingEvents: [],
    intelligence: state.intelligence.map((entry) =>
      entry.empireId === empireId
        ? {
            ...entry,
            observations: [{
              id: `${seed}-intel`,
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
  return { state, empireId, targetId: target.id, riskPermille: configuration.riskPermille };
}

describe('bot fleet and mission planner', () => {
  it('forms a valid scout fleet from owned inventory', () => {
    let state = createInitialGameState('bot-fleet-create');
    const empireId = 'synod-bot';
    const planet = state.planets.find((candidate) => candidate.ownerEmpireId === empireId)!;
    state = {
      ...state,
      planets: state.planets.map((candidate) =>
        candidate.id === planet.id
          ? {
              ...candidate,
              inventory: {
                ...candidate.inventory,
                ships: { 'ship.synod.whisper': 1 },
              },
            }
          : candidate,
      ),
    };

    const plan = planBotFleetMission(state, empireId);
    expect(plan).toMatchObject({
      reasonCode: 'fleet-created',
      command: {
        type: 'CREATE_FLEET',
        empireId,
        planetId: planet.id,
        ships: { 'ship.synod.whisper': 1 },
      },
    });
    if (plan.command !== null) {
      expect(executeCommand(state, plan.command).ok).toBe(true);
    }
  });

  it('refreshes observed foreign intelligence without reading hidden resources', () => {
    let state = fillGas(createInitialGameState('bot-fleet-scout'), 'synod-bot');
    const empireId = 'synod-bot';
    const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
    const target = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    state = {
      ...state,
      fleets: [
        {
          id: 'synod-scout',
          empireId,
          originPlanetId: origin.id,
          location: { type: 'planet' as const, planetId: origin.id },
          status: 'stationed' as const,
          ships: { 'ship.synod.whisper': 1 },
          cargo: ZERO_CARGO,
          speed: 16,
          cargoCapacity: 18,
          mission: null,
        },
      ],
      intelligence: state.intelligence.map((entry) =>
        entry.empireId === empireId
          ? {
              ...entry,
              observations: [
                {
                  id: 'synod-old-player-intel',
                  observerEmpireId: empireId,
                  targetPlanetId: target.id,
                  observedAt: 0,
                  expiresAt: 1,
                  detected: false,
                  snapshot: {
                    planetId: target.id,
                    name: target.name,
                    ownerEmpireId: 'player',
                    factionId: target.factionId,
                    level: 1 as const,
                  },
                },
              ],
            }
          : entry,
      ),
      clock: { ...state.clock, elapsedSeconds: 10_000 },
    };

    const before = planBotFleetMission(state, empireId);
    const hiddenChanged = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.id === target.id
          ? {
              ...planet,
              economy: {
                ...planet.economy,
                resources: {
                  ...planet.economy.resources,
                  metal: { ...planet.economy.resources.metal, amount: 9_999 },
                },
              },
            }
          : planet,
      ),
    };
    expect(planBotFleetMission(hiddenChanged, empireId)).toEqual(before);
    expect(before.command).toMatchObject({
      type: 'SEND_FLEET',
      fleetId: 'synod-scout',
      targetPlanetId: target.id,
      mission: 'scout',
    });
    if (before.command !== null) {
      expect(executeCommand(state, before.command).ok).toBe(true);
    }
  });

  it('sends loaded cargo to the weakest owned colony', () => {
    let state = fillGas(createInitialGameState('bot-fleet-transport'), 'aegis-bot');
    const empireId = 'aegis-bot';
    const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
    const second = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    state = {
      ...state,
      planets: state.planets.map((planet) => {
        if (planet.id === second.id) {
          return {
            ...planet,
            ownerEmpireId: empireId,
            factionId: origin.factionId,
            economy: {
              ...planet.economy,
              resources: {
                ...planet.economy.resources,
                metal: { ...planet.economy.resources.metal, amount: 0 },
              },
            },
          };
        }
        return planet;
      }),
      fleets: [
        {
          id: 'aegis-transport',
          empireId,
          originPlanetId: origin.id,
          location: { type: 'planet' as const, planetId: origin.id },
          status: 'stationed' as const,
          ships: { 'ship.aegis.cargo': 1 },
          cargo: { metal: 300, crystal: 0, gas: 0 },
          speed: 9,
          cargoCapacity: 1_200,
          mission: null,
        },
      ],
    };

    const plan = planBotFleetMission(state, empireId);
    expect(plan.command).toMatchObject({
      type: 'SEND_FLEET',
      fleetId: 'aegis-transport',
      targetPlanetId: second.id,
      mission: 'transport',
    });
    if (plan.command !== null) {
      expect(executeCommand(state, plan.command).ok).toBe(true);
    }
  });

  it('selects a legal colonization target through normal mission validation', () => {
    let state = fillGas(createInitialGameState('bot-fleet-colonize'), 'veyra-bot');
    const empireId = 'veyra-bot';
    const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
    state = {
      ...state,
      research: state.research.map((research) =>
        research.empireId === empireId
          ? {
              ...research,
              levels: { ...research.levels, 'technology.veyra.brood-seeding': 1 },
            }
          : research,
      ),
      fleets: [
        {
          id: 'veyra-colonizer',
          empireId,
          originPlanetId: origin.id,
          location: { type: 'planet' as const, planetId: origin.id },
          status: 'stationed' as const,
          ships: { 'ship.veyra.brood-ark': 1 },
          cargo: ZERO_CARGO,
          speed: 6,
          cargoCapacity: 500,
          mission: null,
        },
      ],
    };

    const plan = planBotFleetMission(state, empireId);
    expect(plan.reasonCode).toBe('mission-colonize-selected');
    expect(plan.command).toMatchObject({
      type: 'SEND_FLEET',
      fleetId: 'veyra-colonizer',
      mission: 'colonize',
    });
    if (plan.command !== null) {
      expect(executeCommand(state, plan.command).ok).toBe(true);
    }
  });

  it('attacks only a current level-three target with favorable perceived power', () => {
    let state = fillGas(createInitialGameState('bot-fleet-attack'), 'aegis-bot');
    const empireId = 'aegis-bot';
    const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
    const target = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    state = {
      ...state,
      fleets: [
        {
          id: 'aegis-strike',
          empireId,
          originPlanetId: origin.id,
          location: { type: 'planet' as const, planetId: origin.id },
          status: 'stationed' as const,
          ships: { 'ship.aegis.fighter': 3 },
          cargo: ZERO_CARGO,
          speed: 13,
          cargoCapacity: 90,
          mission: null,
        },
      ],
      intelligence: state.intelligence.map((entry) =>
        entry.empireId === empireId
          ? {
              ...entry,
              observations: [
                {
                  id: 'aegis-target-intel',
                  observerEmpireId: empireId,
                  targetPlanetId: target.id,
                  observedAt: 0,
                  expiresAt: 10_000,
                  detected: false,
                  snapshot: {
                    planetId: target.id,
                    name: target.name,
                    ownerEmpireId: 'player',
                    factionId: target.factionId,
                    level: 3 as const,
                    defenses: {},
                    stationedFleets: [],
                  },
                },
              ],
            }
          : entry,
      ),
    };

    const plan = planBotFleetMission(state, empireId);
    expect(plan).toMatchObject({
      reasonCode: 'mission-attack-selected',
      command: {
        type: 'SEND_FLEET',
        fleetId: 'aegis-strike',
        targetPlanetId: target.id,
        mission: 'attack',
      },
    });
  });

  it('applies the active profile thresholds to the same real marginal fleet risk', () => {
    const safe = tacticalAttackFixture('bot-risk-safe', 0, 700);
    const explorerWindow = tacticalAttackFixture('bot-risk-explorer', 700, 800);
    const aggressiveWindow = tacticalAttackFixture('bot-risk-aggressive', 800, 900);
    const overAggressive = tacticalAttackFixture('bot-risk-over-aggressive', 900, 1_200);

    const industrial = tacticalProfile('industrial');
    const explorer = tacticalProfile('explorer');
    const aggressive = tacticalProfile('aggressive');

    expect(safe.riskPermille).toBeLessThanOrEqual(700);
    expect(planBotFleetMission(safe.state, safe.empireId, industrial).reasonCode)
      .toBe('mission-attack-selected');

    expect(explorerWindow.riskPermille).toBeGreaterThan(700);
    expect(explorerWindow.riskPermille).toBeLessThanOrEqual(800);
    expect(planBotFleetMission(explorerWindow.state, explorerWindow.empireId, industrial).reasonCode)
      .not.toBe('mission-attack-selected');
    expect(planBotFleetMission(explorerWindow.state, explorerWindow.empireId, explorer).reasonCode)
      .toBe('mission-attack-selected');

    expect(aggressiveWindow.riskPermille).toBeGreaterThan(800);
    expect(aggressiveWindow.riskPermille).toBeLessThanOrEqual(900);
    expect(planBotFleetMission(aggressiveWindow.state, aggressiveWindow.empireId, explorer).reasonCode)
      .not.toBe('mission-attack-selected');
    expect(planBotFleetMission(aggressiveWindow.state, aggressiveWindow.empireId, aggressive).reasonCode)
      .toBe('mission-attack-selected');
    expect(planBotFleetMission(aggressiveWindow.state, aggressiveWindow.empireId, industrial).reasonCode)
      .not.toBe('mission-attack-selected');

    expect(overAggressive.riskPermille).toBeGreaterThan(900);
    expect(planBotFleetMission(overAggressive.state, overAggressive.empireId, aggressive).reasonCode)
      .not.toBe('mission-attack-selected');
  });

  it('keeps full current level-three intelligence plus mission and reducer validation mandatory', () => {
    const fixture = tacticalAttackFixture('bot-risk-validation', 800, 900);
    const aggressive = tacticalProfile('aggressive');
    const accepted = planBotFleetMission(fixture.state, fixture.empireId, aggressive);
    expect(accepted.reasonCode).toBe('mission-attack-selected');
    expect(accepted.command).not.toBeNull();
    if (accepted.command === null || accepted.command.type !== 'SEND_FLEET') {
      throw new Error('Expected an accepted SEND_FLEET attack.');
    }
    expect(getMissionAvailability(fixture.state, accepted.command).allowed).toBe(true);
    expect(executeCommand(fixture.state, accepted.command).ok).toBe(true);

    const partial: GameState = {
      ...fixture.state,
      intelligence: fixture.state.intelligence.map((entry) =>
        entry.empireId === fixture.empireId
          ? {
              ...entry,
              observations: entry.observations.map((observation) => ({
                ...observation,
                snapshot: {
                  planetId: observation.snapshot.planetId,
                  name: observation.snapshot.name,
                  ownerEmpireId: observation.snapshot.ownerEmpireId,
                  factionId: observation.snapshot.factionId,
                  level: 2 as const,
                },
              })),
            }
          : entry,
      ),
    };
    expect(planBotFleetMission(partial, fixture.empireId, aggressive).reasonCode)
      .not.toBe('mission-attack-selected');

    const stale = {
      ...fixture.state,
      clock: { ...fixture.state.clock, elapsedSeconds: 20_000 },
    };
    expect(planBotFleetMission(stale, fixture.empireId, aggressive).reasonCode)
      .not.toBe('mission-attack-selected');
  });

  it('keeps tactical fleet decisions deterministic and invariant to unobserved target state', () => {
    const fixture = tacticalAttackFixture('bot-risk-hidden-state', 800, 900);
    const aggressive = tacticalProfile('aggressive');
    const first = planBotFleetMission(fixture.state, fixture.empireId, aggressive);
    expect(planBotFleetMission(fixture.state, fixture.empireId, aggressive)).toEqual(first);
    const hiddenChanged: GameState = {
      ...fixture.state,
      planets: fixture.state.planets.map((planet) =>
        planet.id === fixture.targetId
          ? {
              ...planet,
              inventory: {
                ships: { 'ship.aegis.dreadnought': 999 },
                defenses: { 'defense.aegis.fortress-array': 999 },
              },
              economy: {
                ...planet.economy,
                resources: {
                  ...planet.economy.resources,
                  metal: { ...planet.economy.resources.metal, amount: 99_999 },
                  crystal: { ...planet.economy.resources.crystal, amount: 99_999 },
                  gas: { ...planet.economy.resources.gas, amount: 99_999 },
                },
              },
            }
          : planet,
      ),
    };
    expect(planBotFleetMission(hiddenChanged, fixture.empireId, aggressive)).toEqual(first);
  });

  it('reports missing full intelligence instead of planning a blind attack', () => {
    let state = fillGas(createInitialGameState('bot-blocked-intelligence'), 'aegis-bot');
    const empireId = 'aegis-bot';
    const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
    const roles = getFactionMechanicalRoles('aegis');
    state = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.id === origin.id
          ? { ...planet, inventory: { ships: {}, defenses: {} } }
          : planet,
      ),
      fleets: [{
        id: 'blind-strike',
        empireId,
        originPlanetId: origin.id,
        location: { type: 'planet' as const, planetId: origin.id },
        status: 'stationed' as const,
        ships: { [roles.ships.fighter]: 5 },
        cargo: ZERO_CARGO,
        speed: 1_000,
        cargoCapacity: 100,
        mission: null,
      }],
    };

    expect(planBotFleetMission(state, empireId)).toMatchObject({
      reasonCode: 'mission-blocked-intelligence',
      availabilityCode: 'ATTACK_INTELLIGENCE_REQUIRED',
      command: null,
    });
  });

  it('surfaces the exact shared flight-slot blocker', () => {
    const fixture = isolatedScoutState('bot-blocked-slots');
    const active = {
      ...fixture.state.fleets[0]!,
      id: 'active-slot',
      status: 'returning' as const,
      location: {
        type: 'transit' as const,
        fromPlanetId: fixture.originId,
        toPlanetId: fixture.targetId,
        departedAt: 0,
        arrivesAt: 1_000,
      },
      mission: { kind: 'scout' as const, targetPlanetId: fixture.targetId },
    };
    const state = { ...fixture.state, fleets: [...fixture.state.fleets, active] };
    expect(planBotFleetMission(state, fixture.empireId)).toMatchObject({
      reasonCode: 'mission-blocked-flight-slots',
      availabilityCode: 'FLIGHT_SLOT_LIMIT_REACHED',
      command: null,
    });
  });

  it('surfaces the exact scout cooldown blocker', () => {
    const fixture = isolatedScoutState('bot-blocked-cooldown');
    const target = fixture.state.planets.find((planet) => planet.id === fixture.targetId)!;
    const state = {
      ...fixture.state,
      intelligence: fixture.state.intelligence.map((entry) =>
        entry.empireId === fixture.empireId
          ? {
              ...entry,
              observations: [{
                id: 'recent-observation',
                observerEmpireId: fixture.empireId,
                targetPlanetId: target.id,
                coordinate: target.coordinate,
                observedAt: fixture.state.clock.elapsedSeconds,
                expiresAt: fixture.state.clock.elapsedSeconds + 86_400,
                detected: false,
                snapshot: {
                  planetId: target.id,
                  coordinate: target.coordinate,
                  name: target.name,
                  ownerEmpireId: target.ownerEmpireId,
                  factionId: target.factionId,
                  level: 1 as const,
                },
              }],
            }
          : entry,
      ),
    };
    expect(planBotFleetMission(state, fixture.empireId)).toMatchObject({
      reasonCode: 'mission-blocked-scout-cooldown',
      availabilityCode: 'SCOUT_COOLDOWN_ACTIVE',
      command: null,
    });
  });

  it('surfaces the exact insufficient-fuel blocker', () => {
    const fixture = isolatedScoutState('bot-blocked-fuel');
    const state = {
      ...fixture.state,
      planets: fixture.state.planets.map((planet) =>
        planet.id === fixture.originId
          ? {
              ...planet,
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
    };
    expect(planBotFleetMission(state, fixture.empireId)).toMatchObject({
      reasonCode: 'mission-blocked-fuel',
      availabilityCode: 'INSUFFICIENT_FLIGHT_FUEL',
      command: null,
    });
  });
  it('is deterministic for all bot empires', () => {
    const state = createInitialGameState('bot-fleet-determinism');
    expect(planAllBotFleetMissions(state)).toEqual(planAllBotFleetMissions(state));
  });
});
