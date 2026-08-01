import type { BattleReport } from '../combat/types';
import type { PlanetState } from '../planet/types';
import type { ExecutedGameEvent, GameState } from '../types';
import { materializeGalaxy } from '../universe/model';
import {
  createPirateBaseBaselines,
  PIRATE_EMPIRE_ID,
} from './neutralForces';
import type { SpaceObjectState } from './spaceObjects';

export const PVE_TARGET_RECOVERY_SECONDS = 21_600;
export const SPACE_OBJECT_ACTIVE_COOLDOWN_SECONDS = 300;

const RESOURCE_IDS = ['metal', 'crystal', 'gas'] as const;

export function recoverEligibleSpaceObjectsAt(
  objects: readonly SpaceObjectState[],
  at: number,
): readonly SpaceObjectState[] {
  const eligibleIds = objects
    .filter((object) => object.remainingYield <= 0 && object.cooldownUntil <= at)
    .map((object) => object.id)
    .sort();
  if (eligibleIds.length === 0) return objects;
  const eligible = new Set(eligibleIds);
  return objects.map((object) =>
    eligible.has(object.id)
      ? {
          ...object,
          remainingYield: object.initialYield,
          controllerEmpireId: null,
          controlExpiresAt: null,
          cooldownUntil: 0,
        }
      : object,
  );
}

function countRecordsEqual(
  left: Readonly<Record<string, number>>,
  right: Readonly<Record<string, number>>,
): boolean {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].every((key) => (left[key] ?? 0) === (right[key] ?? 0));
}

function targetResourceAmount(
  current: PlanetState['economy']['resources']['metal'],
  baseline: PlanetState['economy']['resources']['metal'],
): number {
  return Math.min(current.capacity, baseline.amount);
}

function pirateNeedsRecovery(current: PlanetState, baseline: PlanetState): boolean {
  if (
    RESOURCE_IDS.some((resourceId) => {
      const stock = current.economy.resources[resourceId];
      const baselineStock = baseline.economy.resources[resourceId];
      return stock.amount !== targetResourceAmount(stock, baselineStock) ||
        stock.productionPerHour !== 0 ||
        stock.productionRemainder !== 0;
    })
  ) {
    return true;
  }
  return !countRecordsEqual(current.inventory.defenses, baseline.inventory.defenses) ||
    !countRecordsEqual(current.defense.damaged, baseline.defense.damaged) ||
    current.defense.repairQueue.length > 0;
}

function restorePiratePlanet(current: PlanetState, baseline: PlanetState): PlanetState {
  return {
    ...current,
    economy: {
      ...current.economy,
      resources: {
        metal: {
          ...current.economy.resources.metal,
          amount: targetResourceAmount(
            current.economy.resources.metal,
            baseline.economy.resources.metal,
          ),
          productionPerHour: 0,
          productionRemainder: 0,
        },
        crystal: {
          ...current.economy.resources.crystal,
          amount: targetResourceAmount(
            current.economy.resources.crystal,
            baseline.economy.resources.crystal,
          ),
          productionPerHour: 0,
          productionRemainder: 0,
        },
        gas: {
          ...current.economy.resources.gas,
          amount: targetResourceAmount(
            current.economy.resources.gas,
            baseline.economy.resources.gas,
          ),
          productionPerHour: 0,
          productionRemainder: 0,
        },
      },
    },
    inventory: {
      ...current.inventory,
      defenses: { ...baseline.inventory.defenses },
    },
    defense: {
      ...baseline.defense,
      damaged: { ...baseline.defense.damaged },
      repairQueue: [],
    },
  };
}

function collectPirateBattleReports(
  state: GameState,
  at: number,
  recentEvents: readonly ExecutedGameEvent[],
): readonly BattleReport[] {
  const reports = new Map<string, BattleReport>();
  for (const entry of [...state.eventLog, ...recentEvents]) {
    const payload = entry.event.payload;
    if (
      payload.type !== 'BATTLE_REPORT' ||
      payload.report.defenderEmpireId !== PIRATE_EMPIRE_ID ||
      payload.report.resolvedAt > at
    ) {
      continue;
    }
    reports.set(payload.report.id, payload.report);
  }
  return [...reports.values()];
}

function latestReportForBaseline(
  reports: readonly BattleReport[],
  baseline: PlanetState,
): BattleReport | undefined {
  return reports
    .filter((report) =>
      report.targetPlanetId === baseline.id ||
      report.targetGalaxyPlanetId === baseline.galaxyPlanetId,
    )
    .sort((left, right) =>
      right.resolvedAt - left.resolvedAt || right.id.localeCompare(left.id),
    )[0];
}

interface PirateRecoveryCandidate {
  readonly kind: 'recover' | 'respawn';
  readonly baseline: PlanetState;
  readonly current?: PlanetState;
  readonly report: BattleReport;
  readonly eligibleAt: number;
}

function compareRecoveryCandidates(
  left: PirateRecoveryCandidate,
  right: PirateRecoveryCandidate,
): number {
  return left.eligibleAt - right.eligibleAt ||
    left.baseline.coordinate.galaxy - right.baseline.coordinate.galaxy ||
    left.baseline.coordinate.solarSystem - right.baseline.coordinate.solarSystem ||
    left.baseline.coordinate.position - right.baseline.coordinate.position ||
    left.report.id.localeCompare(right.report.id) ||
    left.baseline.id.localeCompare(right.baseline.id);
}

function selectPirateRecoveryCandidate(
  state: GameState,
  at: number,
  recentEvents: readonly ExecutedGameEvent[],
): PirateRecoveryCandidate | undefined {
  const originalGalaxy = materializeGalaxy(state.universe, state.galaxy.galaxy);
  const baselines = createPirateBaseBaselines(originalGalaxy, state.seed);
  const reports = collectPirateBattleReports(state, at, recentEvents);
  const candidates: PirateRecoveryCandidate[] = [];

  for (const baseline of baselines) {
    const report = latestReportForBaseline(reports, baseline);
    if (report === undefined) continue;
    const eligibleAt = report.resolvedAt + PVE_TARGET_RECOVERY_SECONDS;
    if (eligibleAt > at) continue;
    const occupant = state.planets.find(
      (planet) => planet.galaxyPlanetId === baseline.galaxyPlanetId,
    );
    if (
      occupant !== undefined &&
      occupant.id === baseline.id &&
      occupant.ownerEmpireId === PIRATE_EMPIRE_ID
    ) {
      if (pirateNeedsRecovery(occupant, baseline)) {
        candidates.push({
          kind: 'recover',
          baseline,
          current: occupant,
          report,
          eligibleAt,
        });
      }
      continue;
    }
    if (
      occupant === undefined &&
      report.destruction?.planetDestroyed === true
    ) {
      candidates.push({ kind: 'respawn', baseline, report, eligibleAt });
    }
  }

  return candidates.sort(compareRecoveryCandidates)[0];
}

export function recoverPveTargetsAt(
  state: GameState,
  at: number,
  recentEvents: readonly ExecutedGameEvent[] = [],
): GameState {
  const spaceObjects = recoverEligibleSpaceObjectsAt(state.spaceObjects, at);
  const withObjects = spaceObjects === state.spaceObjects
    ? state
    : { ...state, spaceObjects };
  const candidate = selectPirateRecoveryCandidate(withObjects, at, recentEvents);
  if (candidate === undefined) return withObjects;
  if (candidate.kind === 'respawn') {
    return {
      ...withObjects,
      planets: [...withObjects.planets, candidate.baseline],
    };
  }
  const current = candidate.current;
  if (current === undefined) return withObjects;
  const restored = restorePiratePlanet(current, candidate.baseline);
  return {
    ...withObjects,
    planets: withObjects.planets.map((planet) =>
      planet.id === current.id ? restored : planet,
    ),
  };
}
