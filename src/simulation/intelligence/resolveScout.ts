import { getFactionMechanicalRoles } from '../factions/factionMechanicalRoles';
import { getResearchEffectsForEmpire } from '../factions/factionResearchEffects';
import type { FleetState } from '../fleets/types';
import { getBuildingLevel } from '../planet/buildingProgression';
import type { PlanetState } from '../planet/types';
import type { GameState } from '../types';
import { getShipCountByRole } from '../units/shipCapabilities';
import { getEmpireIntelligence } from './intelligenceState';
import type {
  EmpireIntelligenceState,
  IntelPlanetSnapshot,
  IntelligenceAlert,
} from './types';

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

function createSnapshot(
  state: GameState,
  target: PlanetState,
  level: 1 | 2 | 3,
): IntelPlanetSnapshot {
  const snapshot: IntelPlanetSnapshot = {
    planetId: target.id,
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

export function resolveScoutArrival(
  state: GameState,
  fleet: FleetState,
  target: PlanetState,
  eventSequence: number,
): GameState {
  const observer = getEmpireIntelligence(state.intelligence, fleet.empireId);
  if (observer === undefined) return state;

  const scoutCount = getShipCountByRole(fleet.ships, 'scout');
  const observerStrength = getSensorStrength(state, fleet.empireId) + scoutCount;
  const targetSensorGrid = getFactionMechanicalRoles(target.factionId).buildings.sensorGrid;
  const counterStrength =
    getSensorStrength(state, target.ownerEmpireId) +
    getBuildingLevel(target.buildings, targetSensorGrid);
  const level = Math.max(
    1,
    Math.min(3, 1 + Math.floor(observerStrength / 2)),
  ) as 1 | 2 | 3;
  const detectionChance = Math.max(
    5,
    Math.min(90, 30 + counterStrength * 10 - observerStrength * 7),
  );
  const roll =
    hashText(`${state.seed}:${eventSequence}:${fleet.id}:${target.id}`) % 100;
  const detected = roll < detectionChance;
  const observedAt = state.clock.elapsedSeconds;
  const observation = {
    id: `intel-${eventSequence}-${fleet.id}`,
    observerEmpireId: fleet.empireId,
    targetPlanetId: target.id,
    observedAt,
    expiresAt: observedAt + (level + 1) * 86_400,
    detected,
    snapshot: createSnapshot(state, target, level),
  } as const;
  let intelligence = replaceIntelligence(state.intelligence, {
    ...observer,
    observations: [
      ...observer.observations.filter(
        (item) => item.targetPlanetId !== target.id,
      ),
      observation,
    ],
  });

  if (detected && target.ownerEmpireId !== fleet.empireId) {
    const defender = getEmpireIntelligence(intelligence, target.ownerEmpireId);
    if (defender !== undefined) {
      const confidence: IntelligenceAlert['confidence'] =
        counterStrength >= observerStrength + 2
          ? 'high'
          : counterStrength >= observerStrength
            ? 'medium'
            : 'low';
      const alert: IntelligenceAlert = {
        id: `alert-${eventSequence}-${fleet.id}`,
        empireId: target.ownerEmpireId,
        sourceEmpireId: confidence === 'low' ? null : fleet.empireId,
        targetPlanetId: target.id,
        detectedAt: observedAt,
        confidence,
      };
      intelligence = replaceIntelligence(intelligence, {
        ...defender,
        alerts: [...defender.alerts, alert],
      });
    }
  }

  return { ...state, intelligence };
}
