import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BOT_PROFILES,
  type BotPersonality,
  type BotProfile,
} from '../../src/simulation/bots/profiles';
import {
  planAllBotThreatsAndRecovery,
  planBotThreatAndRecovery,
} from '../../src/simulation/bots/threatRecoveryPlanner';
import type { BattleReport } from '../../src/simulation/combat/types';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionIdForEmpire } from '../../src/simulation/factions/factionMechanicalCatalogRegistry';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import { executeCommand } from '../../src/simulation/reducer';
import { getCompleteResearchId } from '../../src/simulation/research/completeResearchCatalog';
import type { ExecutedGameEvent, GameState } from '../../src/simulation/types';
import { getUnitDefinition } from '../../src/simulation/units/catalog';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

const ZERO_CARGO = { metal: 0, crystal: 0, gas: 0 } as const;

function prepareMilitaryIndustry(state: GameState, empireId: string): GameState {
  const factionId = getFactionIdForEmpire(state, empireId);
  const roles = getFactionMechanicalRoles(factionId);
  return {
    ...state,
    planets: state.planets.map((planet) =>
      planet.ownerEmpireId === empireId
        ? {
            ...planet,
            specializationId: 'military' as const,
            buildings: [
              ...planet.buildings.filter(
                (building) =>
                  building.buildingId !== roles.buildings.command &&
                  building.buildingId !== roles.buildings.shipyard &&
                  building.buildingId !== roles.buildings.laboratory &&
                  building.buildingId !== roles.buildings.sensorGrid,
              ),
              { buildingId: roles.buildings.command, level: 3 },
              { buildingId: roles.buildings.shipyard, level: 2 },
              { buildingId: roles.buildings.laboratory, level: 3 },
              { buildingId: roles.buildings.sensorGrid, level: 2 },
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
              population: { ...planet.economy.population, capacity: 100 },
            },
          }
        : planet,
    ),
    research: state.research.map((research) =>
      research.empireId === empireId
        ? {
            ...research,
            levels: {
              ...research.levels,
              [roles.research.construction]: 2,
              [roles.research.energy]: 2,
              [roles.research.sensors]: 2,
              [roles.research.weapons]: 1,
              [getCompleteResearchId(factionId, 'astronomy')]: 1,
            },
            queue: [],
          }
        : research,
    ),
  };
}

function prepareOutcomeRecoveryState(seed: string, empireId: string): GameState {
  const state = prepareMilitaryIndustry(createInitialGameState(seed), empireId);
  const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId);
  if (origin === undefined) throw new Error('Missing outcome recovery origin.');
  const roles = getFactionMechanicalRoles(origin.factionId);
  return {
    ...state,
    planets: state.planets.map((planet) =>
      planet.ownerEmpireId === empireId
        ? {
            ...planet,
            inventory: {
              ships: planet.id === origin.id ? { [roles.ships.fighter]: 2 } : {},
              defenses: {},
            },
          }
        : planet,
    ),
    fleets: state.fleets.filter((fleet) => fleet.empireId !== empireId),
    intelligence: state.intelligence.map((entry) =>
      entry.empireId === empireId
        ? { ...entry, observations: [], alerts: [] }
        : entry,
    ),
  };
}

function pvpBattleEvent(
  id: string,
  executeAt: number,
  sequence: number,
  attackerEmpireId: string,
  defenderEmpireId: string,
  winner: BattleReport['winner'],
  targetPlanetId: string,
): ExecutedGameEvent {
  const report: BattleReport = {
    id,
    seed: sequence,
    resolvedAt: executeAt,
    targetPlanetId,
    attackerEmpireId,
    defenderEmpireId,
    winner,
    rounds: [],
    attackerInitial: {},
    defenderInitial: {},
    attackerRemaining: {},
    defenderRemaining: {},
    mode: 'pvp',
  };
  return {
    event: {
      id: `event-${id}`,
      executeAt,
      sequence,
      payload: { type: 'BATTLE_REPORT', report },
    },
    executedAt: executeAt,
  };
}

function tacticalProfile(personality: BotPersonality): BotProfile {
  const base = DEFAULT_BOT_PROFILES.find((profile) => profile.empireId === 'aegis-bot');
  if (base === undefined) throw new Error('Missing Aegis bot profile.');
  return { ...base, id: `aegis-${personality}-threat-risk`, personality };
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
      const ownPower = catalogPower(ownUnitId, ownCount);
      const targetPower = catalogPower(targetUnitId, targetCount);
      const riskPermille = Math.min(
        9_999,
        Math.floor((targetPower * 1_000) / Math.max(1, ownPower)),
      );
      if (riskPermille > minimumExclusive && riskPermille <= maximumInclusive) {
        return { ownCount, targetCount, riskPermille };
      }
    }
  }
  throw new Error(`No catalog risk window (${minimumExclusive}, ${maximumInclusive}] found.`);
}

function threatRiskFixture(
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
  let state = createInitialGameState(seed);
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
  state = {
    ...state,
    planets: state.planets.map((planet) =>
      planet.ownerEmpireId === empireId
        ? {
            ...planet,
            inventory: {
              ships: planet.id === origin.id
                ? { [fighterId]: configuration.ownCount }
                : {},
              defenses: {},
            },
          }
        : planet,
    ),
    fleets: state.fleets.filter((fleet) => fleet.empireId !== empireId),
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

function targetAssessment(
  state: GameState,
  empireId: string,
  targetId: string,
  profile: BotProfile,
) {
  return planBotThreatAndRecovery(state, empireId, {}, profile).targets
    .find((candidate) => candidate.planetId === targetId);
}

describe('bot threat, target and recovery planner', () => {
  it('does not react to hidden player changes without intelligence', () => {
    const state = createInitialGameState('bot-threat-hidden');
    const before = planBotThreatAndRecovery(state, 'synod-bot');
    const changed = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.ownerEmpireId === 'player'
          ? {
              ...planet,
              inventory: {
                ...planet.inventory,
                ships: { 'ship.aegis.frigate': 99 },
              },
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
    expect(planBotThreatAndRecovery(changed, 'synod-bot')).toEqual(before);
  });

  it('selects a profitable current target from stored intelligence', () => {
    let state = prepareMilitaryIndustry(
      createInitialGameState('bot-threat-target'),
      'aegis-bot',
    );
    const empireId = 'aegis-bot';
    const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
    const target = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    state = {
      ...state,
      fleets: [
        {
          id: 'strike-target',
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
                  id: 'profitable-target',
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
                    resources: {
                      metal: 2_000,
                      crystal: 1_000,
                      gas: 500,
                      energyProduced: 100,
                      energyConsumed: 50,
                    },
                    buildings: { 'building.aegis.command': 2 },
                    defenses: {},
                    stationedFleets: [],
                  },
                },
              ],
            }
          : entry,
      ),
    };

    const plan = planBotThreatAndRecovery(state, empireId);
    expect(plan.selectedTargetPlanetId).toBe(target.id);
    expect(plan.targets[0]).toMatchObject({
      planetId: target.id,
      attackRecommended: true,
      estimatedReward: 4_200,
    });
    expect(plan.command).toMatchObject({
      type: 'SEND_FLEET',
      fleetId: 'strike-target',
      targetPlanetId: target.id,
      mission: 'attack',
    });
  });

  it('applies exact 700/800/900 thresholds to the same deterministic threat-risk concept', () => {
    const safe = threatRiskFixture('threat-risk-safe', 0, 700);
    const explorerWindow = threatRiskFixture('threat-risk-explorer', 700, 800);
    const aggressiveWindow = threatRiskFixture('threat-risk-aggressive', 800, 900);
    const overAggressive = threatRiskFixture('threat-risk-over-aggressive', 900, 1_200);
    const industrial = tacticalProfile('industrial');
    const explorer = tacticalProfile('explorer');
    const aggressive = tacticalProfile('aggressive');

    expect(safe.riskPermille).toBeLessThanOrEqual(700);
    expect(targetAssessment(safe.state, safe.empireId, safe.targetId, industrial)).toMatchObject({
      riskPermille: safe.riskPermille,
      attackRecommended: true,
    });

    expect(explorerWindow.riskPermille).toBeGreaterThan(700);
    expect(explorerWindow.riskPermille).toBeLessThanOrEqual(800);
    expect(targetAssessment(
      explorerWindow.state,
      explorerWindow.empireId,
      explorerWindow.targetId,
      industrial,
    )?.attackRecommended).toBe(false);
    expect(targetAssessment(
      explorerWindow.state,
      explorerWindow.empireId,
      explorerWindow.targetId,
      explorer,
    )?.attackRecommended).toBe(true);

    expect(aggressiveWindow.riskPermille).toBeGreaterThan(800);
    expect(aggressiveWindow.riskPermille).toBeLessThanOrEqual(900);
    expect(targetAssessment(
      aggressiveWindow.state,
      aggressiveWindow.empireId,
      aggressiveWindow.targetId,
      explorer,
    )?.attackRecommended).toBe(false);
    expect(targetAssessment(
      aggressiveWindow.state,
      aggressiveWindow.empireId,
      aggressiveWindow.targetId,
      aggressive,
    )?.attackRecommended).toBe(true);
    expect(targetAssessment(
      aggressiveWindow.state,
      aggressiveWindow.empireId,
      aggressiveWindow.targetId,
      industrial,
    )?.attackRecommended).toBe(false);

    expect(overAggressive.riskPermille).toBeGreaterThan(900);
    expect(targetAssessment(
      overAggressive.state,
      overAggressive.empireId,
      overAggressive.targetId,
      aggressive,
    )?.attackRecommended).toBe(false);
  });

  it('requires current full level-three intelligence for tactical recommendations', () => {
    const fixture = threatRiskFixture('threat-risk-intel', 800, 900);
    const aggressive = tacticalProfile('aggressive');
    const full = targetAssessment(fixture.state, fixture.empireId, fixture.targetId, aggressive);
    expect(full).toMatchObject({
      riskPermille: fixture.riskPermille,
      attackRecommended: true,
    });

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
    expect(targetAssessment(partial, fixture.empireId, fixture.targetId, aggressive)).toMatchObject({
      estimatedDefense: null,
      riskPermille: null,
      attackRecommended: false,
    });

    const stale: GameState = {
      ...fixture.state,
      clock: { ...fixture.state.clock, elapsedSeconds: 20_000 },
    };
    expect(targetAssessment(stale, fixture.empireId, fixture.targetId, aggressive)).toMatchObject({
      freshness: 'stale',
      riskPermille: fixture.riskPermille,
      attackRecommended: false,
    });
  });

  it('keeps threat target scoring deterministic and invariant to hidden foreign state', () => {
    const fixture = threatRiskFixture('threat-risk-hidden', 800, 900);
    const aggressive = tacticalProfile('aggressive');
    const first = planBotThreatAndRecovery(fixture.state, fixture.empireId, {}, aggressive);
    expect(planBotThreatAndRecovery(fixture.state, fixture.empireId, {}, aggressive)).toEqual(first);

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
    expect(planBotThreatAndRecovery(hiddenChanged, fixture.empireId, {}, aggressive)).toEqual(first);
  });

  it('uses a latest-three loss-dominant outcome only for bounded military recovery', () => {
    const empireId = 'aegis-bot';
    const state = prepareOutcomeRecoveryState('bot-threat-outcome-loss', empireId);
    const target = state.planets.find((planet) => planet.ownerEmpireId === 'player');
    if (target === undefined) throw new Error('Missing outcome target.');
    const baseline = planBotThreatAndRecovery(state, empireId);
    expect(baseline.recoveryPhase).toBe('stable');
    expect(baseline.reasonCode).not.toBe('military-recovery');

    const lossDominant: GameState = {
      ...state,
      eventLog: [
        pvpBattleEvent('outcome-win', 100, 1, empireId, 'player', 'attacker', target.id),
        pvpBattleEvent('outcome-loss-1', 200, 2, empireId, 'player', 'defender', target.id),
        pvpBattleEvent('outcome-loss-2', 300, 3, 'player', empireId, 'attacker', target.id),
      ],
    };
    const adapted = planBotThreatAndRecovery(lossDominant, empireId);
    expect(adapted.recoveryPhase).toBe('stable');
    expect(adapted.reasonCode).toBe('military-recovery');
    expect(adapted.command).toMatchObject({
      type: 'QUEUE_UNIT_BATCH',
      empireId,
      quantity: 3,
    });
    if (adapted.command !== null) {
      expect(executeCommand(lossDominant, adapted.command).ok).toBe(true);
    }
  });

  it('returns exactly to baseline when losses age out and gives wins no aggression bonus', () => {
    const empireId = 'aegis-bot';
    const state = prepareOutcomeRecoveryState('bot-threat-outcome-aging', empireId);
    const target = state.planets.find((planet) => planet.ownerEmpireId === 'player');
    if (target === undefined) throw new Error('Missing outcome target.');
    const profile = tacticalProfile('aggressive');
    const baseline = planBotThreatAndRecovery(state, empireId, {}, profile);

    const lossDominant: GameState = {
      ...state,
      eventLog: [
        pvpBattleEvent('aging-loss-1', 100, 1, empireId, 'player', 'defender', target.id),
        pvpBattleEvent('aging-loss-2', 200, 2, 'player', empireId, 'attacker', target.id),
        pvpBattleEvent('aging-win-1', 300, 3, empireId, 'player', 'attacker', target.id),
      ],
    };
    expect(planBotThreatAndRecovery(lossDominant, empireId, {}, profile).reasonCode)
      .toBe('military-recovery');

    const aged: GameState = {
      ...lossDominant,
      eventLog: [
        ...lossDominant.eventLog,
        pvpBattleEvent('aging-win-2', 400, 4, empireId, 'player', 'attacker', target.id),
      ],
    };
    expect(planBotThreatAndRecovery(aged, empireId, {}, profile)).toEqual(baseline);

    const winsOnly: GameState = {
      ...state,
      eventLog: [
        pvpBattleEvent('wins-1', 100, 1, empireId, 'player', 'attacker', target.id),
        pvpBattleEvent('wins-2', 200, 2, empireId, 'player', 'attacker', target.id),
        pvpBattleEvent('wins-3', 300, 3, 'player', empireId, 'defender', target.id),
      ],
    };
    expect(planBotThreatAndRecovery(winsOnly, empireId, {}, profile)).toEqual(baseline);
  });

  it('preserves the same next outcome-biased recovery decision across save and load', () => {
    const empireId = 'aegis-bot';
    const state = prepareOutcomeRecoveryState('bot-threat-outcome-save', empireId);
    const target = state.planets.find((planet) => planet.ownerEmpireId === 'player');
    if (target === undefined) throw new Error('Missing outcome target.');
    const lossDominant: GameState = {
      ...state,
      eventLog: [
        pvpBattleEvent('save-loss-1', 100, 1, empireId, 'player', 'defender', target.id),
        pvpBattleEvent('save-win', 200, 2, empireId, 'player', 'attacker', target.id),
        pvpBattleEvent('save-loss-2', 300, 3, 'player', empireId, 'attacker', target.id),
      ],
    };
    const expected = planBotThreatAndRecovery(lossDominant, empireId);
    expect(expected.reasonCode).toBe('military-recovery');

    const save = createSaveEnvelope(
      'bot-outcome-recovery',
      lossDominant,
      '2026-08-23T12:00:00.000Z',
    );
    const parsed = parseSaveJson(serializeSave(save));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(planBotThreatAndRecovery(parsed.value.state, empireId)).toEqual(expected);
  });

  it('rebuilds military production after fleet losses', () => {
    const state = prepareMilitaryIndustry(
      createInitialGameState('bot-threat-rebuild'),
      'veyra-bot',
    );
    const plan = planBotThreatAndRecovery(state, 'veyra-bot');
    expect(plan.recoveryPhase).toBe('fleet');
    expect(plan.reasonCode).toBe('military-recovery');
    expect(plan.command).toMatchObject({
      type: 'QUEUE_UNIT_BATCH',
      empireId: 'veyra-bot',
      unitId: 'ship.veyra.nox-dart',
      quantity: 3,
    });
    if (plan.command !== null) {
      expect(executeCommand(state, plan.command).ok).toBe(true);
    }
  });

  it('classifies a stronger known defender as a high threat', () => {
    let state = prepareMilitaryIndustry(
      createInitialGameState('bot-threat-high'),
      'synod-bot',
    );
    const empireId = 'synod-bot';
    const target = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    state = {
      ...state,
      intelligence: state.intelligence.map((entry) =>
        entry.empireId === empireId
          ? {
              ...entry,
              observations: [
                {
                  id: 'strong-defender',
                  observerEmpireId: empireId,
                  targetPlanetId: target.id,
                  observedAt: 0,
                  expiresAt: 10_000,
                  detected: true,
                  snapshot: {
                    planetId: target.id,
                    name: target.name,
                    ownerEmpireId: 'player',
                    factionId: target.factionId,
                    level: 3 as const,
                    defenses: { 'defense.aegis.gun-battery': 20 },
                    stationedFleets: [],
                  },
                },
              ],
              alerts: [
                {
                  id: 'high-alert',
                  empireId,
                  sourceEmpireId: 'player',
                  targetPlanetId: entry.empireId,
                  detectedAt: 0,
                  confidence: 'high' as const,
                },
              ],
            }
          : entry,
      ),
    };

    const plan = planBotThreatAndRecovery(state, empireId);
    expect(plan.threatLevel).toBe('high');
    expect(plan.selectedTargetPlanetId).toBeNull();
    expect(plan.reasonCode).toBe('high-threat-response');
    expect(plan.command).toMatchObject({
      type: 'QUEUE_UNIT_BATCH',
      unitId: 'ship.synod.fighter',
      quantity: 3,
    });
  });

  it('does not exceed the bounded combat reserve under a persistent high alert', () => {
    const empireId = 'aegis-bot';
    const roles = getFactionMechanicalRoles('aegis');
    let state = prepareMilitaryIndustry(
      createInitialGameState('bot-threat-bounded-reserve'),
      empireId,
    );
    state = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.ownerEmpireId === empireId
          ? {
              ...planet,
              inventory: {
                ...planet.inventory,
                ships: {
                  ...planet.inventory.ships,
                  [roles.ships.fighter]: 6,
                },
              },
            }
          : planet,
      ),
      intelligence: state.intelligence.map((entry) =>
        entry.empireId === empireId
          ? {
              ...entry,
              alerts: [
                {
                  id: 'persistent-high-alert',
                  empireId,
                  sourceEmpireId: 'player',
                  targetPlanetId: entry.empireId,
                  detectedAt: 0,
                  confidence: 'high' as const,
                },
              ],
            }
          : entry,
      ),
    };

    const plan = planBotThreatAndRecovery(state, empireId);
    expect(plan.threatLevel).toBe('high');
    expect(plan.command).not.toMatchObject({
      type: 'QUEUE_UNIT_BATCH',
      unitId: roles.ships.fighter,
    });
  });

  it('returns a critical no-action plan after complete planet loss', () => {
    const state = createInitialGameState('bot-threat-defeat');
    const empireId = 'aegis-bot';
    const defeated = {
      ...state,
      planets: state.planets.filter((planet) => planet.ownerEmpireId !== empireId),
    };
    expect(planBotThreatAndRecovery(defeated, empireId)).toMatchObject({
      recoveryPhase: 'critical',
      keyPlanetId: null,
      command: null,
    });
  });

  it('is deterministic for every bot empire', () => {
    const state = createInitialGameState('bot-threat-determinism');
    expect(planAllBotThreatsAndRecovery(state)).toEqual(
      planAllBotThreatsAndRecovery(state),
    );
  });
});
