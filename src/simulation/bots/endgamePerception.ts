import {
  getCurrentSolarWarCycle,
  getSolarWarPublicResults,
  type SolarWarPublicResult,
} from '../endgame/solarWarView';
import type {
  CampaignResult,
  EndgameAlliance,
  EndgameParticipant,
  FinalObjectProject,
  SolarWarCycle,
} from '../endgame/types';
import type { ResourceCost } from '../economy/types';
import type { GameState } from '../types';

export interface BotPublicAlliancePerception {
  readonly id: string;
  readonly name: string;
  readonly founderEmpireId: string;
  readonly createdAt: number;
  readonly memberEmpireIds: readonly string[];
}

export interface BotPublicFinalProjectPerception {
  readonly id: string;
  readonly ownerEmpireId: string;
  readonly ownerPlanetId: string;
  readonly factionId: FinalObjectProject['factionId'];
  readonly participationKind: FinalObjectProject['participationKind'];
  readonly participationId: string;
  readonly allianceId: string | null;
  readonly phase: FinalObjectProject['phase'];
  readonly startedAt: number;
  readonly vulnerabilityStartedAt: number | null;
  readonly stabilizesAt: number | null;
}

export interface BotEligibleFinalProjectPerception extends BotPublicFinalProjectPerception {
  readonly eligibleEmpireIds: readonly string[];
  readonly qualification: FinalObjectProject['qualification'];
  readonly requiredResources: ResourceCost;
  readonly contributedResources: ResourceCost;
  readonly contributionByEmpire: FinalObjectProject['contributionByEmpire'];
  readonly fundedAt: number | null;
  readonly gateCompletesAt: number | null;
}

export interface BotEndgamePerception {
  readonly empireId: string;
  readonly perceivedAt: number;
  readonly publicAlliances: readonly BotPublicAlliancePerception[];
  readonly ownParticipation: EndgameParticipant | null;
  readonly currentSolarWarCycle: SolarWarCycle;
  readonly publicSolarWarResults: readonly SolarWarPublicResult[];
  readonly ownSolarWarResults: readonly SolarWarPublicResult[];
  readonly publicFinalProjects: readonly BotPublicFinalProjectPerception[];
  readonly eligibleFinalProjects: readonly BotEligibleFinalProjectPerception[];
  readonly campaignResult: CampaignResult;
}

function resourceCopy(resources: ResourceCost): ResourceCost {
  return {
    metal: resources.metal,
    crystal: resources.crystal,
    gas: resources.gas,
  };
}

function publicProject(project: FinalObjectProject): BotPublicFinalProjectPerception {
  return {
    id: project.id,
    ownerEmpireId: project.ownerEmpireId,
    ownerPlanetId: project.ownerPlanetId,
    factionId: project.factionId,
    participationKind: project.participationKind,
    participationId: project.participationId,
    allianceId: project.allianceId,
    phase: project.phase,
    startedAt: project.startedAt,
    vulnerabilityStartedAt: project.vulnerabilityStartedAt ?? null,
    stabilizesAt: project.stabilizesAt ?? null,
  };
}

function eligibleProject(project: FinalObjectProject): BotEligibleFinalProjectPerception {
  return {
    ...publicProject(project),
    eligibleEmpireIds: [...project.eligibleEmpireIds],
    qualification: { ...project.qualification },
    requiredResources: resourceCopy(project.requiredResources),
    contributedResources: resourceCopy(project.contributedResources),
    contributionByEmpire: project.contributionByEmpire.map((entry) => ({
      empireId: entry.empireId,
      resources: resourceCopy(entry.resources),
    })),
    fundedAt: project.fundedAt ?? null,
    gateCompletesAt: project.gateCompletesAt ?? null,
  };
}

function publicAlliance(
  alliance: EndgameAlliance,
  participants: readonly EndgameParticipant[],
): BotPublicAlliancePerception {
  return {
    ...alliance,
    memberEmpireIds: participants
      .filter((participant) => participant.allianceId === alliance.id)
      .map((participant) => participant.empireId)
      .sort((left, right) => left.localeCompare(right)),
  };
}

export function createBotEndgamePerception(
  state: GameState,
  empireId: string,
): BotEndgamePerception {
  const participation = state.endgameParticipation;
  const participants = participation?.participants ?? [];
  const publicSolarWarResults = getSolarWarPublicResults(state);
  const projects = state.endgameFinalObjects?.activeProjects ?? [];

  return {
    empireId,
    perceivedAt: state.clock.elapsedSeconds,
    publicAlliances: [...(participation?.alliances ?? [])]
      .map((alliance) => publicAlliance(alliance, participants))
      .sort((left, right) => left.id.localeCompare(right.id)),
    ownParticipation: participation?.participants.find(
      (participant) => participant.empireId === empireId,
    ) ?? null,
    currentSolarWarCycle: getCurrentSolarWarCycle(state),
    publicSolarWarResults: publicSolarWarResults.map((result) => ({ ...result })),
    ownSolarWarResults: publicSolarWarResults
      .filter((result) => result.empireId === empireId)
      .map((result) => ({ ...result })),
    publicFinalProjects: projects
      .map(publicProject)
      .sort((left, right) => left.id.localeCompare(right.id)),
    eligibleFinalProjects: projects
      .filter((project) => project.eligibleEmpireIds.includes(empireId))
      .map(eligibleProject)
      .sort((left, right) => left.id.localeCompare(right.id)),
    campaignResult: state.campaignResult === undefined
      ? { status: 'ongoing' }
      : structuredClone(state.campaignResult),
  };
}
