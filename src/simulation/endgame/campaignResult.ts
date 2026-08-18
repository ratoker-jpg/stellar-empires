import type { GameState, ScheduledGameEvent } from '../types';

export type CampaignOutcome = 'ongoing' | 'victory' | 'defeat';

export function getCampaignOutcomeForEmpire(
  state: GameState,
  empireId: string,
): CampaignOutcome {
  const result = state.campaignResult;
  if (result?.status !== 'terminal') return 'ongoing';
  return result.winningEmpireIds.includes(empireId) ? 'victory' : 'defeat';
}

export function applyFinalGateStabilization(
  state: GameState,
  event: ScheduledGameEvent,
): GameState {
  if (event.payload.type !== 'FINAL_GATE_STABILIZE') return state;
  if (state.campaignResult?.status !== 'ongoing') return state;

  const project = state.endgameFinalObjects?.activeProjects.find(
    (candidate) => candidate.id === event.payload.projectId,
  );
  if (
    project === undefined ||
    project.phase !== 'vulnerable' ||
    project.stabilizesAt === undefined ||
    project.stabilizesAt !== event.executeAt ||
    state.clock.elapsedSeconds !== event.executeAt
  ) {
    return state;
  }

  const host = state.planets.find((planet) => planet.id === project.ownerPlanetId);
  const gatePresent = host?.buildings.some(
    (building) => building.buildingId === project.gateBuildingId && building.level >= 1,
  ) ?? false;
  if (!gatePresent) return state;

  return {
    ...state,
    campaignResult: {
      status: 'terminal',
      winningParticipationKind: project.participationKind,
      winningParticipationId: project.participationId,
      winningEmpireIds: [...project.eligibleEmpireIds],
      ownerEmpireId: project.ownerEmpireId,
      hostPlanetId: project.ownerPlanetId,
      terminalAt: event.executeAt,
      reason: 'final-gate-stabilized',
    },
  };
}
