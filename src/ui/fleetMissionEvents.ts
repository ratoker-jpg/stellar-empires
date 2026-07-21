import type { FleetMissionKind } from '../simulation/fleets/types';
import type { GalaxyIntelVisibility } from '../simulation/galaxy/intelligenceView';

export const FLEET_MISSION_TARGET_EVENT = 'stellar:fleet-mission-target';

export interface FleetMissionTargetRequest {
  readonly targetId: string;
  readonly label: string;
  readonly mission: FleetMissionKind;
}

export function inferMissionForGalaxyTarget(
  ownerEmpireId: string | null,
  visibility: GalaxyIntelVisibility,
): FleetMissionKind {
  if (visibility === 'unclaimed') return 'colonize';
  if (ownerEmpireId === 'player') return 'transport';
  return 'scout';
}

export function dispatchFleetMissionTarget(detail: FleetMissionTargetRequest): void {
  window.dispatchEvent(
    new CustomEvent<FleetMissionTargetRequest>(FLEET_MISSION_TARGET_EVENT, {
      detail,
    }),
  );
}
