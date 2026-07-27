import { getFactionMechanicalRoles } from '../factions/factionMechanicalRoles';
import { getResearchEffectsForEmpire } from '../factions/factionResearchEffects';
import type { FleetState } from '../fleets/types';
import { retainNewest, STATE_HISTORY_LIMITS } from '../history/stateHistory';
import { getBuildingLevel } from '../planet/buildingProgression';
import type { PlanetState } from '../planet/types';
import type { GameState } from '../types';
import {
  getEmpireIntelligence,
  getLatestObservationForTarget,
} from './intelligenceState';
import type {
  EmpireIntelligenceState,
  IntelPlanetSnapshot,
  IntelligenceAlert,
} from './types';

const MIN_SCOUT_COOLDOWN_SECONDS = 300;
const MAX_SCOUT_COOLDOWN_SECONDS = 7_200;

function clamp(minimum: number, maximum: number, value: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function hashText(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function replaceIntelligence(
  states: readonly EmpireIntelligenceState[],
  replacement: EmpireIntelligenceState,
): readonly EmpireIntelligenceState[] {
  return states.map((state) =>
    state.empireId === replacement.empireId ? replacement : state,
  );
}

function getSensorStrength(state: GameState, empireId: string): number {
  return getResearchEffectsForEmpire(state, empireId).sensorStrength;
}

export interface ScoutStrengthSummary {
  readonly observerStrength: number;
  readonly counterStrength: number;
  readonly delta: number;
  readonly level: 1 | 2 | 3;
  readonly detectionChance: number;
  readonly cooldownSeconds: number;
}

export interface ScoutCooldownStatus {
  readonly allowed: boolean;
  readonly cooldownSeconds: number;
  readonly nextAllowedAt: number;
  readonly remainingSeconds: number;
}

export interface ScoutResolution {
  readonly state: GameState;
  readonly detected: boolean;
  readonly probeLost: boolean;
  readonly level: 1 | 2 | 3;
  readonly observerStrength: number;
  readonly counterStrength: number;
  readonly detectionChance: number;
  readonly roll: number;
}

export function getScoutStrengthSummary(
  state: GameState,
  observerEmpireId: string,
  target: PlanetState,
): ScoutStrengthSummary {
  const observerStrength = getSensorStrength(state, observerEmpireId) + 1;
  const targetSensorGrid = getFactionMechanicalRoles(target.factionId).buildings.sensorGrid;
  const counterStrength =
    getSensorStrength(state, target.ownerEmpireId) +
    getBuildingLevel(target.buildings, targetSensorGrid);
  const delta = observerStrength - counterStrength;
  const level: 1 | 2 | 3 = delta >= 3 ? 3 : delta >= 0 ? 2 : 1;
  const detectionChance = clamp(
    5,
    90,
    30 + counterStrength * 10 - observerStrength * 7,
  );
  const cooldownSeconds = clamp(
    MIN_SCOUT_COOLDOWN_SECONDS,
    MAX_SCOUT_COOLDOWN_SECONDS,
    3_600 - observerStrength * 120 + counterStrength * 60,
  );
  return {
    observerStrength,
    counterStrength,
    delta,
    level,
    detectionChance,
    cooldownSeconds,
  };
}

export function getScoutCooldownStatus(
  state: GameState,
  observerEmpireId: string,
  target: PlanetState,
): ScoutCooldownStatus {
  const summary = getScoutStrengthSummary(state, observerEmpireId, target);
  const intelligence = getEmpireIntelligence(state.intelligence, observerEmpireId);
  const latest = intelligence === undefined
    ? undefined
    : getLatestObservationForTarget(intelligence, target.id);
  const nextAllowedAt = latest === undefined
    ? 0
    : latest.observedAt + summary.cooldownSeconds;
  const remainingSeconds = Math.max(0, nextAllowedAt - state.clock.elapsedSeconds);
  return {
    allowed: remainingSeconds === 0,
    cooldownSeconds: summary.cooldownSeconds,
    nextAllowedAt,
    remainingSeconds,
  };
}

function createSnapshot(
  state: GameState,
  target: PlanetState,
  level: 1 | 2 | 3,
): IntelPlanetSnapshot {
  const snapshot: IntelPlanetSnapshot = {
    planetId: target.id,
    coordinate: target.coordinate,
    name: target.name,
    ownerEmpireId: target.ownerEmpireId,
    factionId: target.factionId,
    level,
  };

  if (level === 1) return snapshot;

  const withEconomy: IntelPlanetSnapshot = {
    ...snapshot,
    resources: {
      metal: target.economy.resources.metal.amount,
      crystal: target.economy.resources.crystal.amount,
      gas: target.economy.resources.gas.amount,
      energyProduced: target.economy.energy.produced,
      energyConsumed: target.economy.energy.consumed,
    },
    buildings: Object.fromEntries(
      target.buildings.map((building) => [building.buildingId, building.level]),
    ),
  };

  if (level === 2) return withEconomy;

  return {
    ...withEconomy,
    defenses: { ...target.inventory.defenses },
    stationedFleets: state.fleets
      .filter(
        (fleet) =>
          fleet.status === 'stationed' &&
          fleet.location.type === 'planet' &&
          fleet.location.planetId === target.id,
      )
      .map((fleet) => ({ fleetId: fleet.id, ships: { ...fleet.ships } })),
  };
}

export function resolveScoutArrivalOutcome(
  state: GameState,
  fleet: FleetState,
  target: PlanetState,
  eventSequence: number,
): ScoutResolution {
  const summary = getScoutStrengthSummary(state, fleet.empireId, target);
  const roll = hashText(
    `${state.seed}:${eventSequence}:${fleet.id}:${target.id}`,
  ) % 100;
  const detected = roll < summary.detectionChance;
  const observer = getEmpireIntelligence(state.intelligence, fleet.empireId);
  if (observer === undefined) {
    return {
      state,
      detected,
      probeLost: detected,
      level: summary.level,
      observerStrength: summary.observerStrength,
      counterStrength: summary.counterStrength,
      detectionChance: summary.detectionChance,
      roll,
    };
  }

  const observedAt = state.clock.elapsedSeconds;
  const observation = {
    id: `intel-${eventSequence}-${fleet.id}`,
    observerEmpireId: fleet.empireId,
    targetPlanetId: target.id,
    coordinate: target.coordinate,
    observedAt,
    expiresAt: observedAt + (summary.level + 1) * 86_400,
    detected,
    snapshot: createSnapshot(state, target, summary.level),
  } as const;
  let intelligence = replaceIntelligence(state.intelligence, {
    ...observer,
    observations: retainNewest(
      [
        ...observer.observations.filter(
          (item) => item.targetPlanetId !== target.id,
        ),
        observation,
      ],
      STATE_HISTORY_LIMITS.intelligenceObservationsPerEmpire,
    ),
  });

  if (detected && target.ownerEmpireId !== fleet.empireId) {
    const defender = getEmpireIntelligence(intelligence, target.ownerEmpireId);
    if (defender !== undefined) {
      const confidence: IntelligenceAlert['confidence'] =
        summary.counterStrength >= summary.observerStrength + 2
          ? 'high'
          : summary.counterStrength >= summary.observerStrength
            ? 'medium'
            : 'low';
      const alert: IntelligenceAlert = {
        id: `alert-${eventSequence}-${fleet.id}`,
        empireId: target.ownerEmpireId,
        sourceEmpireId: confidence === 'low' ? null : fleet.empireId,
        targetPlanetId: target.id,
        coordinate: target.coordinate,
        detectedAt: observedAt,
        confidence,
      };
      intelligence = replaceIntelligence(intelligence, {
        ...defender,
        alerts: retainNewest(
          [...defender.alerts, alert],
          STATE_HISTORY_LIMITS.intelligenceAlertsPerEmpire,
        ),
      });
    }
  }

  return {
    state: { ...state, intelligence },
    detected,
    probeLost: detected,
    level: summary.level,
    observerStrength: summary.observerStrength,
    counterStrength: summary.counterStrength,
    detectionChance: summary.detectionChance,
    roll,
  };
}

export function resolveScoutArrival(
  state: GameState,
  fleet: FleetState,
  target: PlanetState,
  eventSequence: number,
): GameState {
  return resolveScoutArrivalOutcome(state, fleet, target, eventSequence).state;
}
