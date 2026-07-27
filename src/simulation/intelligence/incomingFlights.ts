import { getResearchEffectsForEmpire } from '../factions/factionResearchEffects';
import type { FleetMissionKind } from '../fleets/types';
import type { SpaceCoordinate } from '../space/coordinates';
import type { GameState } from '../types';
import { getEmpireIntelligence } from './intelligenceState';

export type IncomingFlightVisibility = 'contact' | 'source' | 'full';

export interface IncomingFlightContact {
  readonly id: string;
  readonly targetPlanetId: string;
  readonly targetCoordinate: SpaceCoordinate;
  readonly targetName: string;
  readonly arrivesAt: number;
  readonly etaSeconds: number;
  readonly visibility: IncomingFlightVisibility;
  readonly sourceEmpireId: string | null;
  readonly missionKind: FleetMissionKind | null;
  readonly ships: Readonly<Record<string, number>> | null;
}

function hasCurrentLevelThreeSourceIntel(
  state: GameState,
  viewerEmpireId: string,
  sourceEmpireId: string,
): boolean {
  const intelligence = getEmpireIntelligence(state.intelligence, viewerEmpireId);
  return intelligence?.observations.some(
    (observation) =>
      observation.expiresAt > state.clock.elapsedSeconds &&
      observation.snapshot.level === 3 &&
      observation.snapshot.ownerEmpireId === sourceEmpireId,
  ) ?? false;
}

function visibilityForIncomingFleet(
  state: GameState,
  viewerEmpireId: string,
  sourceEmpireId: string,
): IncomingFlightVisibility {
  if (hasCurrentLevelThreeSourceIntel(state, viewerEmpireId, sourceEmpireId)) {
    return 'full';
  }
  const sensorStrength = getResearchEffectsForEmpire(state, viewerEmpireId).sensorStrength;
  if (sensorStrength >= 10) return 'full';
  if (sensorStrength >= 5) return 'source';
  return 'contact';
}

export function createIncomingFlightContacts(
  state: GameState,
  viewerEmpireId: string,
): readonly IncomingFlightContact[] {
  const ownedTargets = new Map(
    state.planets
      .filter((planet) => planet.ownerEmpireId === viewerEmpireId)
      .map((planet) => [planet.id, planet] as const),
  );

  return state.fleets
    .filter(
      (fleet) =>
        fleet.empireId !== viewerEmpireId &&
        fleet.location.type === 'transit' &&
        ownedTargets.has(fleet.location.toPlanetId),
    )
    .map((fleet): IncomingFlightContact => {
      if (fleet.location.type !== 'transit') {
        throw new Error('Incoming flight selector received a non-transit fleet.');
      }
      const target = ownedTargets.get(fleet.location.toPlanetId);
      if (target === undefined) {
        throw new Error('Incoming flight target is not owned by the viewer.');
      }
      const visibility = visibilityForIncomingFleet(state, viewerEmpireId, fleet.empireId);
      return {
        id: `incoming-${fleet.id}`,
        targetPlanetId: target.id,
        targetCoordinate: target.coordinate,
        targetName: target.name,
        arrivesAt: fleet.location.arrivesAt,
        etaSeconds: Math.max(0, fleet.location.arrivesAt - state.clock.elapsedSeconds),
        visibility,
        sourceEmpireId: visibility === 'contact' ? null : fleet.empireId,
        missionKind: visibility === 'full' ? fleet.mission?.kind ?? null : null,
        ships: visibility === 'full' ? { ...fleet.ships } : null,
      };
    })
    .sort((left, right) => left.arrivesAt - right.arrivesAt || left.id.localeCompare(right.id));
}
