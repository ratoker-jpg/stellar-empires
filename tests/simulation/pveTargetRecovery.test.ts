import { describe, expect, it } from 'vitest';
import type { BattleReport, PlanetDestructionReport } from '../../src/simulation/combat/types';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { PIRATE_EMPIRE_ID } from '../../src/simulation/pve/neutralForces';
import {
  applySpaceObjectMissionEvent,
  type SpaceObjectMissionReport,
} from '../../src/simulation/pve/spaceObjects';
import {
  PVE_TARGET_RECOVERY_SECONDS,
  SPACE_OBJECT_ACTIVE_COOLDOWN_SECONDS,
  recoverPveTargetsAt,
} from '../../src/simulation/pve/targetRecovery';
import { processWorldEventEvaluationAt } from '../../src/simulation/pve/worldEvents';
import { executeCommand } from '../../src/simulation/reducer';
import type { ExecutedGameEvent, GameState, ScheduledGameEvent } from '../../src/simulation/types';

function destruction(planetDestroyed: boolean): PlanetDestructionReport {
  return {
    attackerContributions: [], defenderContributions: [], defensePopulation: 0,
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

function battle(
  state: GameState,
  planetId: string,
  resolvedAt: number,
  destroyed = false,
  id = `battle-${planetId}-${resolvedAt}`,
): BattleReport {
  const planet = state.planets.find((candidate) => candidate.id === planetId);
  if (planet === undefined) throw new Error(`Missing pirate planet ${planetId}.`);
  return {
    id, seed: state.seed, resolvedAt,
    targetPlanetId: planet.id,
    targetGalaxyPlanetId: planet.galaxyPlanetId,
    targetCoordinate: planet.coordinate,
    attackerEmpireId: 'player', defenderEmpireId: PIRATE_EMPIRE_ID,
    winner: 'attacker', rounds: [],
    attackerInitial: {}, defenderInitial: {}, attackerRemaining: {}, defenderRemaining: {},
    destruction: destruction(destroyed),
    mode: 'pve', threatMultiplierPermille: 1_000, rewardMultiplierPermille: 1_000,
  };
}

function executed(report: BattleReport, sequence = 90_000): ExecutedGameEvent {
  const event: ScheduledGameEvent = {
    id: `event-${report.id}`,
    executeAt: report.resolvedAt,
    sequence,
    payload: { type: 'BATTLE_REPORT', report },
  };
  return { event, executedAt: report.resolvedAt };
}

function damage(state: GameState, pirateId: string): GameState {
  return {
    ...state,
    planets: state.planets.map((planet) => planet.id === pirateId ? {
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
    } : planet),
  };
}

function withReport(state: GameState, report: BattleReport): GameState {
  return { ...state, eventLog: [...state.eventLog, executed(report)] };
}

function objectEvent(
  state: GameState,
  remainingYield: number,
  depletion: number,
): { readonly state: GameState; readonly event: ScheduledGameEvent; readonly objectId: string } {
  const origin = state.planets.find((planet) => planet.ownerEmpireId === 'player');
  const object = state.spaceObjects[0];
  if (origin === undefined || object === undefined) throw new Error('Missing object fixture.');
  const report: SpaceObjectMissionReport = {
    id: 'space-object-recovery-report', empireId: 'player',
    fleetId: 'space-object-recovery-fleet', originPlanetId: origin.id,
    objectId: object.id, startedAt: 0, resolvesAt: 100,
    reward: { metal: 0, crystal: 0, gas: 0, exoticMatter: 0 },
    depletion, losses: {}, controllerUntil: 3_700,
    narrative: 'Recovery fixture.', rewardMultiplierPermille: 1_000,
  };
  const event: ScheduledGameEvent = {
    id: 'event-space-object-recovery', executeAt: 100,
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
      fleets: [...state.fleets, {
        id: report.fleetId, empireId: 'player', originPlanetId: origin.id,
        location: {
          type: 'transit' as const, fromPlanetId: origin.id, toPlanetId: origin.id,
          departedAt: 0, arrivesAt: 100,
        },
        status: 'outbound' as const,
        ships: { 'ship.aegis.recycler': 1 },
        cargo: { metal: 0, crystal: 0, gas: 0 },
        speed: 10, cargoCapacity: 1_000,
        mission: { kind: 'space-object' as const, targetPlanetId: object.id },
      }],
      pendingEvents: [...state.pendingEvents, event],
    },
  };
}

describe('PvE target recovery', () => {
  it('uses five minutes for non-final extraction and six hours for final depletion', () => {
    const active = objectEvent(createInitialGameState('object-active-cooldown'), 1_000, 100);
    const activeResult = applySpaceObjectMissionEvent(active.state, active.event);
    expect(activeResult.spaceObjects.find((item) => item.id === active.objectId)).toMatchObject({
      remainingYield: 900,
      cooldownUntil: 100 + SPACE_OBJECT_ACTIVE_COOLDOWN_SECONDS,
    });

    const final = objectEvent(createInitialGameState('object-final-cooldown'), 10, 10);
    const finalResult = applySpaceObjectMissionEvent(final.state, final.event);
    expect(finalResult.spaceObjects.find((item) => item.id === final.objectId)).toMatchObject({
      remainingYield: 0,
      cooldownUntil: 100 + PVE_TARGET_RECOVERY_SECONDS,
    });
  });

  it('restores a depleted object at the first eligible evaluation', () => {
    const initial = createInitialGameState('object-recovery-evaluation');
    const object = initial.spaceObjects[0];
    if (object === undefined) throw new Error('Missing object.');
    const at = PVE_TARGET_RECOVERY_SECONDS;
    const state: GameState = {
      ...initial,
      clock: { ...initial.clock, elapsedSeconds: at },
      worldEvents: { ...initial.worldEvents, nextEvaluationAt: at },
      spaceObjects: initial.spaceObjects.map((item) => item.id === object.id ? {
        ...item, remainingYield: 0, controllerEmpireId: 'player',
        controlExpiresAt: at, cooldownUntil: at,
      } : item),
    };
    expect(processWorldEventEvaluationAt(state, at).spaceObjects.find((item) => item.id === object.id)).toMatchObject({
      remainingYield: object.initialYield,
      controllerEmpireId: null,
      controlExpiresAt: null,
      cooldownUntil: 0,
    });
  });

  it('restores a damaged surviving pirate after six hours', () => {
    const initial = createInitialGameState('pirate-survivor-recovery');
    const baseline = initial.planets.find((planet) => planet.ownerEmpireId === PIRATE_EMPIRE_ID);
    if (baseline === undefined) throw new Error('Missing pirate baseline.');
    const state = withReport(damage(initial, baseline.id), battle(initial, baseline.id, 0));
    expect(recoverPveTargetsAt(state, PVE_TARGET_RECOVERY_SECONDS - 1)
      .planets.find((planet) => planet.id === baseline.id)?.inventory.defenses).toEqual({});
    const recovered = recoverPveTargetsAt(state, PVE_TARGET_RECOVERY_SECONDS)
      .planets.find((planet) => planet.id === baseline.id);
    expect(recovered?.inventory.defenses).toEqual(baseline.inventory.defenses);
    expect(recovered?.economy.resources.metal.amount).toBe(baseline.economy.resources.metal.amount);
    expect(recovered?.defense.damaged).toEqual(baseline.defense.damaged);
  });

  it('respawns a destroyed pirate only while its original position is free', () => {
    const initial = createInitialGameState('pirate-respawn');
    const baseline = initial.planets.find((planet) => planet.ownerEmpireId === PIRATE_EMPIRE_ID);
    const player = initial.planets.find((planet) => planet.ownerEmpireId === 'player');
    if (baseline === undefined || player === undefined) throw new Error('Missing respawn fixture.');
    const report = battle(initial, baseline.id, 0, true);
    const destroyed = withReport(
      { ...initial, planets: initial.planets.filter((planet) => planet.id !== baseline.id) },
      report,
    );
    expect(recoverPveTargetsAt(destroyed, PVE_TARGET_RECOVERY_SECONDS)
      .planets.find((planet) => planet.id === baseline.id)).toEqual(baseline);
    const occupied: GameState = {
      ...destroyed,
      planets: [...destroyed.planets, {
        ...player, id: 'occupied-pirate-position',
        galaxyPlanetId: baseline.galaxyPlanetId, systemId: baseline.systemId,
        position: baseline.position, coordinate: baseline.coordinate,
      }],
    };
    expect(recoverPveTargetsAt(occupied, PVE_TARGET_RECOVERY_SECONDS)
      .planets.some((planet) => planet.id === baseline.id)).toBe(false);
  });

  it('recovers at most one pirate target per evaluation', () => {
    const initial = createInitialGameState('pirate-single-recovery');
    const pirates = initial.planets
      .filter((planet) => planet.ownerEmpireId === PIRATE_EMPIRE_ID)
      .sort((left, right) =>
        left.coordinate.galaxy - right.coordinate.galaxy ||
        left.coordinate.solarSystem - right.coordinate.solarSystem ||
        left.coordinate.position - right.coordinate.position || left.id.localeCompare(right.id));
    const first = pirates[0];
    const second = pirates[1];
    if (first === undefined || second === undefined) throw new Error('Missing pirate pair.');
    let state = damage(damage(initial, first.id), second.id);
    state = withReport(state, battle(initial, first.id, 0, false, 'battle-first'));
    state = withReport(state, battle(initial, second.id, 0, false, 'battle-second'));
    const recovered = recoverPveTargetsAt(state, PVE_TARGET_RECOVERY_SECONDS);
    const restored = [first, second].filter((baseline) =>
      JSON.stringify(recovered.planets.find((planet) => planet.id === baseline.id)?.inventory.defenses) ===
      JSON.stringify(baseline.inventory.defenses));
    expect(restored.map((planet) => planet.id)).toEqual([first.id]);
  });

  it('sees a battle executed earlier in the same long ADVANCE_TIME', () => {
    const initial = createInitialGameState('pirate-offline-recovery');
    const baseline = initial.planets.find((planet) => planet.ownerEmpireId === PIRATE_EMPIRE_ID);
    if (baseline === undefined) throw new Error('Missing pirate baseline.');
    const state = damage(initial, baseline.id);
    const report = battle(state, baseline.id, 1_800);
    const scheduled = executeCommand(state, {
      type: 'SCHEDULE_EVENT', executeAt: report.resolvedAt,
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
    expect(advanced.value.planets.find((planet) => planet.id === baseline.id)?.inventory.defenses)
      .toEqual(baseline.inventory.defenses);
    expect(advanced.value.eventLog.some((entry) =>
      entry.event.payload.type === 'BATTLE_REPORT' && entry.event.payload.report.id === report.id))
      .toBe(true);
  });
});
