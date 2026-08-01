import { describe, expect, it } from 'vitest';
import type { BattleReport, PlanetDestructionReport } from '../../src/simulation/combat/types';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { PIRATE_EMPIRE_ID } from '../../src/simulation/pve/neutralForces';
import {
  PVE_TARGET_RECOVERY_SECONDS,
  SPACE_OBJECT_ACTIVE_COOLDOWN_SECONDS,
  recoverPveTargetsAt,
} from '../../src/simulation/pve/targetRecovery';
import {
  applySpaceObjectMissionEvent,
  type SpaceObjectMissionReport,
} from '../../src/simulation/pve/spaceObjects';
import { processWorldEventEvaluationAt } from '../../src/simulation/pve/worldEvents';
import { executeCommand } from '../../src/simulation/reducer';
import type {
  ExecutedGameEvent,
  GameState,
  ScheduledGameEvent,
} from '../../src/simulation/types';

function destructionReport(planetDestroyed: boolean): PlanetDestructionReport {
  return {
    attackerContributions: [],
    defenderContributions: [],
    defensePopulation: 0,
    rawChanceBasisPoints: planetDestroyed ? 10_000 : 0,
    defenseReductionBasisPoints: 0,
    defenderPlanetDestroyerReductionBasisPoints: 0,
    poliasReductionBasisPoints: 0,
    finalChanceBasisPoints: planetDestroyed ? 10_000 : 0,
    rollBasisPoints: 0,
    blockedReason: planetDestroyed ? null : 'ZERO_FINAL_CHANCE',
    planetDestroyed,
  };
}

function pirateBattleReport(
  state: GameState,
  planetId: string,
  resolvedAt: number,
  destroyed = false,
  id = `battle-${planetId}-${resolvedAt}`,
): BattleReport {
  const planet = state.planets.find((candidate) => candidate.id === planetId);
  if (planet === undefined) throw new Error(`Missing pirate planet ${planetId}.`);
  return {
    id,
    seed: state.seed,
    resolvedAt,
    targetPlanetId: planet.id,
    targetGalaxyPlanetId: planet.galaxyPlanetId,
    targetCoordinate: planet.coordinate,
    attackerEmpireId: 'player',
    defenderEmpireId: PIRATE_EMPIRE_ID,
    winner: 'attacker',
    rounds: [],
    attackerInitial: {},
    defenderInitial: {},
    attackerRemaining: {},
    defenderRemaining: {},
    destruction: destructionReport(destroyed),
    mode: 'pve',
    threatMultiplierPermille: 1_000,
    rewardMultiplierPermille: 1_000,
  };
}

function executedBattle(report: BattleReport, sequence = 90_000): ExecutedGameEvent {
  const event: ScheduledGameEvent = {
    id: `event-${report.id}`,
    executeAt: report.resolvedAt,
    sequence,
    payload: { type: 'BATTLE_REPORT', report },
  };
  return { event, executedAt: report.resolvedAt };
}

function damagePirate(state: GameState, pirateId: string): GameState {
  return {
    ...state,
    planets: state.planets.map((planet) =>
      planet.id === pirateId
        ? {
            ...planet,
            economy: {
              ...planet.economy,
              resources: {
                metal: { ...planet.economy.resources.metal, amount: 0 },
                crystal: { ...planet.economy.resources.crystal, amount: 0 },
                gas: { ...planet.economy.resources.gas, amount: 0 },
              },
            },
            inventory: { ...planet.inventory, defenses: {} },
            defense: {
              ...planet.defense,
              damaged: { 'defense.aegis.gun-battery': 3 },
              repairQueue: [],
            },
          }
        : planet,
    ),
  };
}

function addReportToHistory(state: GameState, report: BattleReport): GameState {
  return { ...state, eventLog: [...state.eventLog, executedBattle(report)] };
}

function spaceObjectResolution(
  state: GameState,
  remainingYield: number,
  depletion: number,
): { readonly state: GameState; readonly event: ScheduledGameEvent; readonly objectId: string } {
  const origin = state.planets.find((planet) => planet.ownerEmpireId === 'player');
  const object = state.spaceObjects[0];
  if (origin === undefined || object === undefined) throw new Error('Missing object fixture.');
  const report: SpaceObjectMissionReport = {
    id: 'space-object-recovery-report',
    empireId: 'player',
    fleetId: 'space-object-recovery-fleet',
    originPlanetId: origin.id,
    objectId: object.id,
    startedAt: 0,
    resolvesAt: 100,
    reward: { metal: 0, crystal: 0, gas: 0, exoticMatter: 0 },
    depletion,
    losses: {},
    controllerUntil: 3_700,
    narrative: 'Recovery fixture.',
    rewardMultiplierPermille: 1_000,
  };
  const event: ScheduledGameEvent = {
    id: 'event-space-object-recovery',
    executeAt: 100,
    sequence: state.nextEventSequence,
    payload: { type: 'SPACE_OBJECT_MISSION_RESOLVE', report },
  };
  return {
    objectId: object.id,
    event,
    state: {
      ...state,
      clock: { ...state.clock, elapsedSeconds: 100 },
      spaceObjects: state.spaceObjects.map((candidate) =>
        candidate.id === object.id ? { ...candidate, remainingYield } : candidate),
      fleets: [
        ...state.fleets,
        {
          id: report.fleetId,
          empireId: 'player',
          originPlanetId: origin.id,
          location: {
            type: 'transit' as const,
            fromPlanetId: origin.id,
            toPlanetId: origin.id,
            departedAt: 0,
            arrivesAt: 100,
          },
          status: 'outbound' as const,
          ships: { 'ship.aegis.recycler': 1 },
          cargo: { metal: 0, crystal: 0, gas: 0 },
          speed: 10,
          cargoCapacity: 1_000,
          mission: { kind: 'space-object' as const, targetObjectId: object.id },
        },
      ],
      pendingEvents: [...state.pendingEvents, event],
    },
  };
}

describe('PvE target recovery', () => {
  it('keeps the five-minute cooldown for non-final extraction', () => {
    const fixture = spaceObjectResolution(
      createInitialGameState('object-active-cooldown'),
      1_000,
      100,
    );
    const resolved = applySpaceObjectMissionEvent(fixture.state, fixture.event);
    const object = resolved.spaceObjects.find((candidate) => candidate.id === fixture.objectId);
    expect(object).toMatchObject({
      remainingYield: 900,
      cooldownUntil: 100 + SPACE_OBJECT_ACTIVE_COOLDOWN_SECONDS,
    });
  });

  it('uses the six-hour cooldown for final depletion and recovers at evaluation', () => {
    const fixture = spaceObjectResolution(
      createInitialGameState('object-final-cooldown'),
      10,
      10,
    );
    const resolved = applySpaceObjectMissionEvent(fixture.state, fixture.event);
    const depleted = resolved.spaceObjects.find((candidate) => candidate.id === fixture.objectId);
    expect(depleted).toMatchObject({
      remainingYield: 0,
      cooldownUntil: 100 + PVE_TARGET_RECOVERY_SECONDS,
    });

    const evaluationAt = resolved.worldEvents.nextEvaluationAt;
    const eligibleAt = 100 + PVE_TARGET_RECOVERY_SECONDS;
    const alignedEvaluation = Math.ceil(eligibleAt / 1_800) * 1_800;
    const prepared: GameState = {
      ...resolved,
      worldEvents: { ...resolved.worldEvents, nextEvaluationAt: alignedEvaluation },
      clock: { ...resolved.clock, elapsedSeconds: alignedEvaluation },
    };
    expect(evaluationAt).toBeLessThan(alignedEvaluation);
    const recovered = processWorldEventEvaluationAt(prepared, alignedEvaluation);
    expect(recovered.spaceObjects.find((candidate) => candidate.id === fixture.objectId)).toMatchObject({
      remainingYield: depleted?.initialYield,
      controllerEmpireId: null,
      controlExpiresAt: null,
      cooldownUntil: 0,
    });
  });

  it('restores a damaged surviving pirate base after six hours', () => {
    const initial = createInitialGameState('pirate-survivor-recovery');
    const baseline = initial.planets.find((planet) => planet.ownerEmpireId === PIRATE_EMPIRE_ID);
    if (baseline === undefined) throw new Error('Missing pirate baseline.');
    const report = pirateBattleReport(initial, baseline.id, 0);
    const damaged = addReportToHistory(damagePirate(initial, baseline.id), report);

    const early = recoverPveTargetsAt(damaged, PVE_TARGET_RECOVERY_SECONDS - 1);
    expect(early.planets.find((planet) => planet.id === baseline.id)?.inventory.defenses).toEqual({});

    const recovered = recoverPveTargetsAt(damaged, PVE_TARGET_RECOVERY_SECONDS);
    const pirate = recovered.planets.find((planet) => planet.id === baseline.id);
    expect(pirate?.inventory.defenses).toEqual(baseline.inventory.defenses);
    expect(pirate?.economy.resources.metal.amount).toBe(baseline.economy.resources.metal.amount);
    expect(pirate?.economy.resources.crystal.amount).toBe(baseline.economy.resources.crystal.amount);
    expect(pirate?.economy.resources.gas.amount).toBe(baseline.economy.resources.gas.amount);
    expect(pirate?.defense.damaged).toEqual(baseline.defense.damaged);
  });

  it('respawns a destroyed pirate base only when its original position is free', () => {
    const initial = createInitialGameState('pirate-respawn');
    const baseline = initial.planets.find((planet) => planet.ownerEmpireId === PIRATE_EMPIRE_ID);
    const player = initial.planets.find((planet) => planet.ownerEmpireId === 'player');
    if (baseline === undefined || player === undefined) throw new Error('Missing respawn fixture.');
    const report = pirateBattleReport(initial, baseline.id, 0, true);
    const destroyed = addReportToHistory(
      { ...initial, planets: initial.planets.filter((planet) => planet.id !== baseline.id) },
      report,
    );

    const respawned = recoverPveTargetsAt(destroyed, PVE_TARGET_RECOVERY_SECONDS);
    expect(respawned.planets.find((planet) => planet.id === baseline.id)).toEqual(baseline);

    const occupied: GameState = {
      ...destroyed,
      planets: [
        ...destroyed.planets,
        {
          ...player,
          id: 'occupied-pirate-position',
          galaxyPlanetId: baseline.galaxyPlanetId,
          systemId: baseline.systemId,
          position: baseline.position,
          coordinate: baseline.coordinate,
        },
      ],
    };
    const blocked = recoverPveTargetsAt(occupied, PVE_TARGET_RECOVERY_SECONDS);
    expect(blocked.planets.some((planet) => planet.id === baseline.id)).toBe(false);
  });

  it('recovers at most one pirate target per evaluation in deterministic order', () => {
    const initial = createInitialGameState('pirate-single-recovery');
    const baselines = initial.planets
      .filter((planet) => planet.ownerEmpireId === PIRATE_EMPIRE_ID)
      .sort((left, right) =>
        left.coordinate.galaxy - right.coordinate.galaxy ||
        left.coordinate.solarSystem - right.coordinate.solarSystem ||
        left.coordinate.position - right.coordinate.position ||
        left.id.localeCompare(right.id));
    const first = baselines[0];
    const second = baselines[1];
    if (first === undefined || second === undefined) throw new Error('Missing pirate pair.');
    let state = damagePirate(damagePirate(initial, first.id), second.id);
    state = addReportToHistory(state, pirateBattleReport(initial, first.id, 0, false, 'battle-first'));
    state = addReportToHistory(state, pirateBattleReport(initial, second.id, 0, false, 'battle-second'));

    const recovered = recoverPveTargetsAt(state, PVE_TARGET_RECOVERY_SECONDS);
    const restored = [first, second].filter((baseline) =>
      JSON.stringify(recovered.planets.find((planet) => planet.id === baseline.id)?.inventory.defenses) ===
      JSON.stringify(baseline.inventory.defenses),
    );
    expect(restored).toHaveLength(1);
    expect(restored[0]?.id).toBe(first.id);
  });

  it('sees a battle executed earlier in the same long ADVANCE_TIME', () => {
    const initial = createInitialGameState('pirate-offline-recovery');
    const baseline = initial.planets.find((planet) => planet.ownerEmpireId === PIRATE_EMPIRE_ID);
    if (baseline === undefined) throw new Error('Missing pirate baseline.');
    const damaged = damagePirate(initial, baseline.id);
    const report = pirateBattleReport(damaged, baseline.id, 1_800);
    const scheduled = executeCommand(damaged, {
      type: 'SCHEDULE_EVENT',
      executeAt: report.resolvedAt,
      payload: { type: 'BATTLE_REPORT', report },
    });
    expect(scheduled.ok).toBe(true);
    if (!scheduled.ok) return;

    const advanced = executeCommand(scheduled.value, {
      type: 'ADVANCE_TIME',
      seconds: report.resolvedAt + PVE_TARGET_RECOVERY_SECONDS,
    });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) return;
    const pirate = advanced.value.planets.find((planet) => planet.id === baseline.id);
    expect(pirate?.inventory.defenses).toEqual(baseline.inventory.defenses);
    expect(
      advanced.value.eventLog.some(
        (entry) =>
          entry.event.payload.type === 'BATTLE_REPORT' &&
          entry.event.payload.report.id === report.id,
      ),
    ).toBe(true);
  });
});
