import type {
  EmpireIntelligenceState,
  IntelObservation,
} from './types';

export function createInitialIntelligenceStates(
  empireIds: readonly string[],
): readonly EmpireIntelligenceState[] {
  return empireIds.map((empireId) => ({
    empireId,
    observations: [],
    alerts: [],
  }));
}

export function getEmpireIntelligence(
  states: readonly EmpireIntelligenceState[],
  empireId: string,
): EmpireIntelligenceState | undefined {
  return states.find((state) => state.empireId === empireId);
}

export function getLatestObservationForTarget(
  state: EmpireIntelligenceState,
  targetPlanetId: string,
): IntelObservation | undefined {
  return [...state.observations]
    .filter((observation) => observation.targetPlanetId === targetPlanetId)
    .sort(
      (left, right) =>
        right.observedAt - left.observedAt || left.id.localeCompare(right.id),
    )[0];
}

export function getCurrentObservations(
  state: EmpireIntelligenceState,
  elapsedSeconds: number,
): readonly IntelObservation[] {
  return state.observations.filter(
    (observation) => observation.expiresAt > elapsedSeconds,
  );
}
