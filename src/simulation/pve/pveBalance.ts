import type { ResourceCost } from '../economy/types';
import type { FleetState } from '../fleets/types';
import type { PlanetState } from '../planet/types';
import type { GameState } from '../types';
import { PIRATE_EMPIRE_ID } from './neutralForces';

export type PveActivityKind = 'pirate-raid' | 'expedition' | 'space-object';

export const PVE_REPEAT_WINDOW_SECONDS = 7_200;
export const PVE_MIN_REWARD_MULTIPLIER_PERMILLE = 250;
export const PVE_REPEAT_PENALTY_PERMILLE = 250;
export const PVE_MAX_THREAT_MULTIPLIER_PERMILLE = 2_000;
export const PVE_THREAT_STEP_PERMILLE = 100;

export function countRecentPveCompletions(
  state: GameState,
  empireId: string,
  activity: PveActivityKind,
  targetId: string,
  at = state.clock.elapsedSeconds,
): number {
  const since = Math.max(0, at - PVE_REPEAT_WINDOW_SECONDS);
  return state.eventLog.filter((entry) => {
    const payload = entry.event.payload;
    if (entry.executedAt < since) return false;
    if (activity === 'pirate-raid' && payload.type === 'BATTLE_REPORT') {
      return (
        payload.report.attackerEmpireId === empireId &&
        payload.report.defenderEmpireId === PIRATE_EMPIRE_ID &&
        payload.report.targetPlanetId === targetId &&
        payload.report.winner === 'attacker'
      );
    }
    if (activity === 'expedition' && payload.type === 'EXPEDITION_RESOLVE') {
      return (
        payload.report.empireId === empireId &&
        payload.report.targetGalaxyPlanetId === targetId
      );
    }
    if (activity === 'space-object' && payload.type === 'SPACE_OBJECT_MISSION_RESOLVE') {
      return payload.report.empireId === empireId && payload.report.objectId === targetId;
    }
    return false;
  }).length;
}

export function calculatePveRewardMultiplier(
  state: GameState,
  empireId: string,
  activity: PveActivityKind,
  targetId: string,
  at = state.clock.elapsedSeconds,
): number {
  const repeats = countRecentPveCompletions(state, empireId, activity, targetId, at);
  return Math.max(
    PVE_MIN_REWARD_MULTIPLIER_PERMILLE,
    1_000 - repeats * PVE_REPEAT_PENALTY_PERMILLE,
  );
}

export function countPirateVictories(
  state: GameState,
  empireId: string,
): number {
  return state.eventLog.filter((entry) => {
    const payload = entry.event.payload;
    return (
      payload.type === 'BATTLE_REPORT' &&
      payload.report.attackerEmpireId === empireId &&
      payload.report.defenderEmpireId === PIRATE_EMPIRE_ID &&
      payload.report.winner === 'attacker'
    );
  }).length;
}

export function calculatePirateThreatMultiplier(
  state: GameState,
  empireId: string,
): number {
  return Math.min(
    PVE_MAX_THREAT_MULTIPLIER_PERMILLE,
    1_000 + countPirateVictories(state, empireId) * PVE_THREAT_STEP_PERMILLE,
  );
}

export function scalePveUnits(
  units: Readonly<Record<string, number>>,
  multiplierPermille: number,
): Readonly<Record<string, number>> {
  return Object.fromEntries(
    Object.entries(units)
      .map(([unitId, count]) => [
        unitId,
        Math.max(count, Math.ceil((count * multiplierPermille) / 1_000)),
      ] as const)
      .filter(([, count]) => count > 0),
  );
}

export function scalePveReward(
  reward: ResourceCost,
  multiplierPermille: number,
): ResourceCost {
  return {
    metal: Math.floor((reward.metal * multiplierPermille) / 1_000),
    crystal: Math.floor((reward.crystal * multiplierPermille) / 1_000),
    gas: Math.floor((reward.gas * multiplierPermille) / 1_000),
  };
}

export interface AdjustedPlunder {
  readonly planet: PlanetState;
  readonly fleet: FleetState;
  readonly plundered: ResourceCost;
}

export function applyPvePlunderMultiplier(
  planet: PlanetState,
  fleet: FleetState,
  plundered: ResourceCost,
  multiplierPermille: number,
): AdjustedPlunder {
  const adjusted = scalePveReward(plundered, multiplierPermille);
  const withheld: ResourceCost = {
    metal: plundered.metal - adjusted.metal,
    crystal: plundered.crystal - adjusted.crystal,
    gas: plundered.gas - adjusted.gas,
  };
  return {
    planet: {
      ...planet,
      economy: {
        ...planet.economy,
        resources: {
          metal: {
            ...planet.economy.resources.metal,
            amount: planet.economy.resources.metal.amount + withheld.metal,
          },
          crystal: {
            ...planet.economy.resources.crystal,
            amount: planet.economy.resources.crystal.amount + withheld.crystal,
          },
          gas: {
            ...planet.economy.resources.gas,
            amount: planet.economy.resources.gas.amount + withheld.gas,
          },
        },
      },
    },
    fleet: {
      ...fleet,
      cargo: {
        metal: fleet.cargo.metal - withheld.metal,
        crystal: fleet.cargo.crystal - withheld.crystal,
        gas: fleet.cargo.gas - withheld.gas,
      },
    },
    plundered: adjusted,
  };
}
