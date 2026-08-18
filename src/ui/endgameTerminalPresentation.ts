import { getCampaignOutcomeForEmpire, type CampaignOutcome } from '../simulation/endgame/campaignResult';
import type { FinalObjectProject } from '../simulation/endgame/types';
import type { GameState } from '../simulation/types';

export interface FinalProjectPresentation {
  readonly id: string;
  readonly ownerEmpireId: string;
  readonly hostPlanetId: string;
  readonly hostLabel: string;
  readonly participationLabel: string;
  readonly phase: FinalObjectProject['phase'];
  readonly phaseLabel: string;
  readonly fundingLabel: string;
  readonly fundingPercent: number;
  readonly vulnerabilityDeadline: number | null;
  readonly vulnerabilityRemainingSeconds: number | null;
  readonly viewerEligible: boolean;
  readonly terminalWinner: boolean;
}

export interface CampaignTerminalPresentation {
  readonly outcome: Exclude<CampaignOutcome, 'ongoing'>;
  readonly outcomeLabel: string;
  readonly terminalAt: number;
  readonly ownerEmpireId: string;
  readonly hostPlanetId: string;
  readonly hostLabel: string;
  readonly winningParticipationLabel: string;
  readonly winningEmpireIds: readonly string[];
}

const PHASE_LABELS: Readonly<Record<FinalObjectProject['phase'], string>> = {
  funding: 'Финансирование',
  building: 'Строительство Врат',
  vulnerable: 'Уязвимость Врат',
};

function resourceFundingLabel(project: FinalObjectProject): string {
  return [
    `M ${project.contributedResources.metal}/${project.requiredResources.metal}`,
    `C ${project.contributedResources.crystal}/${project.requiredResources.crystal}`,
    `G ${project.contributedResources.gas}/${project.requiredResources.gas}`,
  ].join(' · ');
}

function fundingPercent(project: FinalObjectProject): number {
  const required = project.requiredResources.metal +
    project.requiredResources.crystal +
    project.requiredResources.gas;
  const contributed = project.contributedResources.metal +
    project.contributedResources.crystal +
    project.contributedResources.gas;
  if (required <= 0) return 100;
  return Math.max(0, Math.min(100, Math.floor((contributed * 100) / required)));
}

function participationLabel(kind: 'solo' | 'alliance', id: string): string {
  return kind === 'alliance' ? `Альянс ${id}` : `Империя ${id}`;
}

function hostLabel(state: GameState, planetId: string): string {
  const host = state.planets.find((planet) => planet.id === planetId);
  if (host === undefined) return planetId;
  return `${host.name} · ${host.coordinate.galaxy}:${host.coordinate.solarSystem}:${host.coordinate.position}`;
}

export function createFinalProjectPresentations(
  state: GameState,
  viewerEmpireId = 'player',
): readonly FinalProjectPresentation[] {
  const terminal = state.campaignResult?.status === 'terminal' ? state.campaignResult : undefined;
  return (state.endgameFinalObjects?.activeProjects ?? [])
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((project): FinalProjectPresentation => ({
      id: project.id,
      ownerEmpireId: project.ownerEmpireId,
      hostPlanetId: project.ownerPlanetId,
      hostLabel: hostLabel(state, project.ownerPlanetId),
      participationLabel: participationLabel(project.participationKind, project.participationId),
      phase: project.phase,
      phaseLabel: PHASE_LABELS[project.phase],
      fundingLabel: resourceFundingLabel(project),
      fundingPercent: fundingPercent(project),
      vulnerabilityDeadline: project.stabilizesAt ?? null,
      vulnerabilityRemainingSeconds: project.stabilizesAt === undefined
        ? null
        : Math.max(0, project.stabilizesAt - state.clock.elapsedSeconds),
      viewerEligible: project.eligibleEmpireIds.includes(viewerEmpireId),
      terminalWinner: terminal !== undefined &&
        terminal.ownerEmpireId === project.ownerEmpireId &&
        terminal.hostPlanetId === project.ownerPlanetId,
    }));
}

export function createCampaignTerminalPresentation(
  state: GameState,
  viewerEmpireId = 'player',
): CampaignTerminalPresentation | null {
  const result = state.campaignResult;
  if (result?.status !== 'terminal') return null;
  const outcome = getCampaignOutcomeForEmpire(state, viewerEmpireId);
  if (outcome === 'ongoing') return null;
  return {
    outcome,
    outcomeLabel: outcome === 'victory' ? 'Победа' : 'Поражение',
    terminalAt: result.terminalAt,
    ownerEmpireId: result.ownerEmpireId,
    hostPlanetId: result.hostPlanetId,
    hostLabel: hostLabel(state, result.hostPlanetId),
    winningParticipationLabel: participationLabel(
      result.winningParticipationKind,
      result.winningParticipationId,
    ),
    winningEmpireIds: [...result.winningEmpireIds],
  };
}
