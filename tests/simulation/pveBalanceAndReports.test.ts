import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import type { FleetState } from '../../src/simulation/fleets/types';
import type { PlanetState } from '../../src/simulation/planet/types';
import { PIRATE_EMPIRE_ID } from '../../src/simulation/pve/neutralForces';
import {
  PVE_MAX_THREAT_MULTIPLIER_PERMILLE,
  PVE_MIN_REWARD_MULTIPLIER_PERMILLE,
  applyPvePlunderMultiplier,
  calculatePirateThreatMultiplier,
  calculatePveRewardMultiplier,
  scalePveUnits,
} from '../../src/simulation/pve/pveBalance';
import type { ArenaResult } from '../../src/simulation/pveMeta/reputation';
import {
  compareEmpirePvePvp,
  createUnifiedMissionReports,
  filterMissionReports,
  summarizeMissionReports,
} from '../../src/simulation/reports/missionReports';
import type {
  ExecutedGameEvent,
  GameState,
  ScheduledGameEvent,
} from '../../src/simulation/types';

function executedEvent(
  sequence: number,
  executedAt: number,
  payload: ScheduledGameEvent['payload'],
): ExecutedGameEvent {
  return {
    event: {
      id: `event-${sequence}`,
      executeAt: executedAt,
      sequence,
      payload,
    },
    executedAt,
  };
}

function battleEvent(
  sequence: number,
  executedAt: number,
  options: {
    readonly targetId?: string;
    readonly attacker?: string;
    readonly defender?: string;
    readonly winner?: 'attacker' | 'defender' | 'draw';
    readonly mode?: 'pve' | 'pvp';
    readonly rewardMultiplierPermille?: number;
    readonly threatMultiplierPermille?: number;
  } = {},
): ExecutedGameEvent {
  const attacker = options.attacker ?? 'player';
  const defender = options.defender ?? PIRATE_EMPIRE_ID;
  const winner = options.winner ?? 'attacker';
  return executedEvent(sequence, executedAt, {
    type: 'BATTLE_REPORT',
    report: {
      id: `battle-${sequence}`,
      seed: sequence,
      resolvedAt: executedAt,
      targetPlanetId: options.targetId ?? 'pirate-base-test',
      attackerEmpireId: attacker,
      defenderEmpireId: defender,
      winner,
      rounds: [],
      attackerInitial: { 'ship.aegis.fighter': 5 },
      defenderInitial: { 'defense.aegis.gun-battery': 4 },
      attackerRemaining: winner === 'defender' ? {} : { 'ship.aegis.fighter': 3 },
      defenderRemaining: winner === 'attacker' ? {} : { 'defense.aegis.gun-battery': 2 },
      debrisCreated: { metal: 100, crystal: 50 },
      plunderedCargo: { metal: 300, crystal: 200, gas: 100 },
      mode: options.mode ?? (defender === PIRATE_EMPIRE_ID ? 'pve' : 'pvp'),
      rewardMultiplierPermille: options.rewardMultiplierPermille ?? 1_000,
      threatMultiplierPermille: options.threatMultiplierPermille ?? 1_000,
    },
  });
}

function expeditionEvent(
  sequence: number,
  executedAt: number,
  targetId = 'galaxy-target',
): ExecutedGameEvent {
  return executedEvent(sequence, executedAt, {
    type: 'EXPEDITION_RESOLVE',
    report: {
      id: `expedition-${sequence}`,
      empireId: 'player',
      fleetId: 'fleet-expedition',
      originPlanetId: 'player-home',
      targetGalaxyPlanetId: targetId,
      startedAt: executedAt - 600,
      resolvesAt: executedAt,
      outcome: 'salvage',
      reward: { metal: 200, crystal: 100, gas: 40 },
      losses: { 'ship.aegis.scout': 1 },
      narrative: 'Тестовая экспедиция.',
      rewardMultiplierPermille: 750,
    },
  });
}

function spaceObjectEvent(
  sequence: number,
  executedAt: number,
  objectId = 'space-object-test',
): ExecutedGameEvent {
  return executedEvent(sequence, executedAt, {
    type: 'SPACE_OBJECT_MISSION_RESOLVE',
    report: {
      id: `space-object-report-${sequence}`,
      empireId: 'player',
      fleetId: 'fleet-mining',
      originPlanetId: 'player-home',
      objectId,
      startedAt: executedAt - 900,
      resolvesAt: executedAt,
      reward: { metal: 0, crystal: 0, gas: 0, exoticMatter: 2 },
      depletion: 2,
      losses: {},
      controllerUntil: executedAt + 3_600,
      narrative: 'Тестовая аномалия.',
      rewardMultiplierPermille: 500,
    },
  });
}

function arenaResult(
  resolvedAt: number,
  outcome: ArenaResult['outcome'] = 'victory',
): ArenaResult {
  return {
    id: `arena-result-${outcome}`,
    entryId: `arena-entry-${outcome}`,
    challengeId: 'arena-4-1',
    empireId: 'player',
    fleetId: 'arena-report-fleet',
    difficulty: 'assault',
    resolvedAt,
    outcome,
    attackerInitial: {
      'ship.aegis.fighter': 10,
      'ship.aegis.frigate': 4,
    },
    enemyInitial: {
      'ship.synod.fighter': 8,
      'ship.synod.frigate': 3,
    },
    attackerRemaining: {
      'ship.aegis.fighter': 7,
      'ship.aegis.frigate': 3,
    },
    enemyRemaining: {
      'ship.synod.fighter': 2,
    },
    rewardGranted: outcome === 'victory'
      ? { metal: 4_000, crystal: 2_000, gas: 700 }
      : { metal: 0, crystal: 0, gas: 0 },
    reputationAward: outcome === 'victory' ? 20 : 0,
    tacticalSnapshot: {
      doctrineId: 'vanguard',
      commandLevel: 5,
      isFlagship: true,
      formation: 'wedge',
      targetPriority: 'capitals',
      commanderId: 'commander.shared.executor',
    },
  };
}

function withEventLog(
  state: GameState,
  eventLog: readonly ExecutedGameEvent[],
): GameState {
  return {
    ...state,
    clock: { ...state.clock, elapsedSeconds: 10_000 },
    eventLog,
  };
}

function totalPlanetAndFleetResource(
  planet: PlanetState,
  fleet: FleetState,
  resourceId: 'metal' | 'crystal' | 'gas',
): number {
  return planet.economy.resources[resourceId].amount + fleet.cargo[resourceId];
}

describe('PvE balance policy', () => {
  it('applies diminishing returns for repeated target farming and respects the floor', () => {
    const base = createInitialGameState('pve-repeat-policy');
    const targetId = 'repeated-pirate-base';
    const state = withEventLog(base, [
      battleEvent(1, 4_000, { targetId }),
      battleEvent(2, 5_000, { targetId }),
      battleEvent(3, 6_000, { targetId }),
      battleEvent(4, 7_000, { targetId }),
      battleEvent(5, 8_000, { targetId }),
    ]);

    expect(calculatePveRewardMultiplier(base, 'player', 'pirate-raid', targetId, 10_000)).toBe(1_000);
    expect(
      calculatePveRewardMultiplier(
        withEventLog(base, [battleEvent(1, 9_000, { targetId })]),
        'player',
        'pirate-raid',
        targetId,
        10_000,
      ),
    ).toBe(750);
    expect(calculatePveRewardMultiplier(state, 'player', 'pirate-raid', targetId, 10_000)).toBe(
      PVE_MIN_REWARD_MULTIPLIER_PERMILLE,
    );
    expect(calculatePveRewardMultiplier(state, 'player', 'pirate-raid', 'other-target', 10_000)).toBe(1_000);
  });

  it('increases pirate threat with victories and caps the multiplier', () => {
    const base = createInitialGameState('pve-threat-policy');
    const victories = Array.from({ length: 15 }, (_, index) =>
      battleEvent(index, index * 100, { targetId: `pirate-${index}` }),
    );
    const state = withEventLog(base, victories);
    expect(calculatePirateThreatMultiplier(base, 'player')).toBe(1_000);
    expect(calculatePirateThreatMultiplier(state, 'player')).toBe(
      PVE_MAX_THREAT_MULTIPLIER_PERMILLE,
    );
    expect(scalePveUnits({ fighter: 3, frigate: 1 }, 1_500)).toEqual({
      fighter: 5,
      frigate: 2,
    });
  });

  it('reduces plunder without destroying resources or prior cargo', () => {
    const state = createInitialGameState('pve-plunder-conservation');
    const planet = state.planets.find((candidate) => candidate.ownerEmpireId === PIRATE_EMPIRE_ID)!;
    const fleet: FleetState = {
      id: 'test-plunder-fleet',
      empireId: 'player',
      originPlanetId: state.planets.find((candidate) => candidate.ownerEmpireId === 'player')!.id,
      location: { type: 'planet', planetId: planet.id },
      status: 'stationed',
      ships: { 'ship.aegis.cargo': 1 },
      cargo: { metal: 450, crystal: 300, gas: 150 },
      speed: 10,
      cargoCapacity: 1_000,
      mission: null,
    };
    const before = {
      metal: totalPlanetAndFleetResource(planet, fleet, 'metal'),
      crystal: totalPlanetAndFleetResource(planet, fleet, 'crystal'),
      gas: totalPlanetAndFleetResource(planet, fleet, 'gas'),
    };
    const result = applyPvePlunderMultiplier(
      planet,
      fleet,
      { metal: 400, crystal: 200, gas: 100 },
      500,
    );
    expect(result.plundered).toEqual({ metal: 200, crystal: 100, gas: 50 });
    expect(totalPlanetAndFleetResource(result.planet, result.fleet, 'metal')).toBe(before.metal);
    expect(totalPlanetAndFleetResource(result.planet, result.fleet, 'crystal')).toBe(before.crystal);
    expect(totalPlanetAndFleetResource(result.planet, result.fleet, 'gas')).toBe(before.gas);
  });
});

describe('unified mission reports', () => {
  it('includes persisted Arena victory exactly once as battle/PvE with one reward and loss contribution', () => {
    const base = createInitialGameState('arena-unified-report-regression');
    const result = arenaResult(4_500);
    const state: GameState = {
      ...base,
      pveMeta: {
        ...base.pveMeta!,
        arenaHistory: [result],
      },
    };

    const allReports = createUnifiedMissionReports(state);
    const arenaReports = allReports.filter((report) => report.id === result.id);
    expect(arenaReports).toHaveLength(1);
    expect(arenaReports[0]).toMatchObject({
      kind: 'battle',
      mode: 'pve',
      primaryEmpireId: 'player',
      secondaryEmpireId: null,
      outcome: 'success',
      reward: { metal: 4_000, crystal: 2_000, gas: 700, exoticMatter: 0 },
      primaryLosses: {
        'ship.aegis.fighter': 3,
        'ship.aegis.frigate': 1,
      },
      secondaryLosses: {
        'ship.synod.fighter': 6,
        'ship.synod.frigate': 3,
      },
      tacticalContext: { primary: result.tacticalSnapshot },
    });

    expect(summarizeMissionReports(allReports)).toEqual({
      total: 1,
      pve: 1,
      pvp: 0,
      system: 0,
      successes: 1,
      rewards: { metal: 4_000, crystal: 2_000, gas: 700, exoticMatter: 0 },
      losses: 4,
    });
    expect(compareEmpirePvePvp(state).find((entry) => entry.empireId === 'player')).toMatchObject({
      pveOperations: 1,
      pveSuccesses: 1,
      reward: { metal: 4_000, crystal: 2_000, gas: 700, exoticMatter: 0 },
      losses: 4,
    });
  });

  it('maps all Arena outcomes without treating draw, defeat or withdrawal as success', () => {
    const base = createInitialGameState('arena-outcome-mapping');
    const history = [
      arenaResult(4_000, 'victory'),
      arenaResult(3_000, 'draw'),
      arenaResult(2_000, 'defeat'),
      arenaResult(1_000, 'withdrawn'),
    ];
    const reports = createUnifiedMissionReports({
      ...base,
      pveMeta: { ...base.pveMeta!, arenaHistory: history },
    }).filter((report) => report.title.startsWith('Арена'));

    expect(reports.map((report) => [report.id, report.outcome])).toEqual([
      ['arena-result-victory', 'success'],
      ['arena-result-draw', 'draw'],
      ['arena-result-defeat', 'failure'],
      ['arena-result-withdrawn', 'failure'],
    ]);
    expect(summarizeMissionReports(reports).successes).toBe(1);
  });

  it('keeps canonical deterministic ordering when Arena and event reports share a timestamp', () => {
    const base = createInitialGameState('arena-ordering');
    const result = arenaResult(5_000);
    const state: GameState = {
      ...withEventLog(base, [battleEvent(7, 5_000)]),
      pveMeta: { ...base.pveMeta!, arenaHistory: [result] },
    };
    const first = createUnifiedMissionReports(state);
    const second = createUnifiedMissionReports(state);
    expect(second).toEqual(first);
    expect(first.map((report) => report.id)).toEqual([
      result.id,
      'battle-7',
    ]);
  });

  it('combines battle, expedition, space-object and world-event histories once', () => {
    const base = createInitialGameState('unified-reports');
    const state: GameState = {
      ...withEventLog(base, [
        battleEvent(1, 1_000),
        expeditionEvent(2, 2_000),
        spaceObjectEvent(3, 3_000),
      ]),
      worldEvents: {
        ...base.worldEvents,
        history: [{
          id: 'world-event-history',
          definitionId: 'solar-storm',
          targetType: 'system',
          targetId: base.galaxy.systems[0]!.id,
          startedAt: 3_100,
          endsAt: 4_000,
          chainDepth: 0,
          completedAt: 4_000,
          completion: 'completed',
        }],
      },
    };
    const reports = createUnifiedMissionReports(state);
    expect(reports).toHaveLength(4);
    expect(reports.map((report) => report.kind)).toEqual([
      'world-event',
      'space-object',
      'expedition',
      'battle',
    ]);
    expect(new Set(reports.map((report) => report.id)).size).toBe(reports.length);
    expect(filterMissionReports(reports, { mode: 'pve' })).toHaveLength(3);
    expect(filterMissionReports(reports, { search: 'аномалия' })).toHaveLength(1);
  });

  it('summarizes rewards, losses and PvE/PvP activity', () => {
    const base = createInitialGameState('unified-report-summary');
    const state = withEventLog(base, [
      battleEvent(1, 1_000),
      battleEvent(2, 2_000, {
        attacker: 'player',
        defender: 'aegis-bot',
        mode: 'pvp',
        winner: 'defender',
      }),
      expeditionEvent(3, 3_000),
      spaceObjectEvent(4, 4_000),
    ]);
    const reports = createUnifiedMissionReports(state);
    const summary = summarizeMissionReports(reports);
    expect(summary).toMatchObject({
      total: 4,
      pve: 3,
      pvp: 1,
      system: 0,
      successes: 3,
    });
    expect(summary.rewards).toEqual({
      metal: 800,
      crystal: 500,
      gas: 240,
      exoticMatter: 2,
    });
    expect(summary.losses).toBeGreaterThan(0);

    const comparison = compareEmpirePvePvp(state);
    expect(comparison.find((entry) => entry.empireId === 'player')).toMatchObject({
      pveOperations: 3,
      pveSuccesses: 3,
      pvpBattles: 1,
      pvpWins: 0,
    });
    expect(comparison.find((entry) => entry.empireId === 'aegis-bot')).toMatchObject({
      pvpBattles: 1,
      pvpWins: 1,
    });
  });
});
