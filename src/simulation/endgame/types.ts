import type { BattleReport } from '../combat/types';
import type { ResourceCost } from '../economy/types';
import type { FactionId } from '../planet/types';

export const ALLIANCE_NAME_MIN_LENGTH = 3;
export const ALLIANCE_NAME_MAX_LENGTH = 40;
export const ENDGAME_PARTICIPATION_HISTORY_LIMIT = 64;
export const SOLAR_WAR_CYCLE_SECONDS = 86_400;
export const SOLAR_WAR_HISTORY_LIMIT = 64;
export const FINAL_OBJECT_HISTORY_LIMIT = 64;
export const FINAL_OBJECT_CONTRIBUTION_HISTORY_LIMIT = 64;

export interface EndgameAlliance {
  readonly id: string;
  readonly name: string;
  readonly founderEmpireId: string;
  readonly createdAt: number;
}

export interface EndgameParticipant {
  readonly empireId: string;
  readonly allianceId: string | null;
  readonly joinedAt: number | null;
  readonly soloEligible: true;
}

export type AllianceMembershipAction = 'created' | 'joined' | 'left';

export interface AllianceMembershipHistoryEntry {
  readonly sequence: number;
  readonly action: AllianceMembershipAction;
  readonly empireId: string;
  readonly allianceId: string;
  readonly occurredAt: number;
}

export interface SolarWarCycle {
  readonly id: string;
  readonly cycleIndex: number;
  readonly startsAt: number;
  readonly resolvesAt: number;
  readonly factionId: FactionId;
  readonly enemyUnits: Readonly<Record<string, number>>;
  readonly combatSeed: number;
}

export type SolarWarParticipationKind = 'solo' | 'alliance';
export type SolarWarOutcome = 'victory' | 'defeat' | 'draw';

export interface SolarWarEntry {
  readonly id: string;
  readonly cycle: SolarWarCycle;
  readonly empireId: string;
  readonly fleetId: string;
  readonly originPlanetId: string;
  readonly participationKind: SolarWarParticipationKind;
  readonly participationId: string;
  readonly allianceId: string | null;
  readonly enteredAt: number;
  readonly resolvesAt: number;
}

export interface SolarWarResult {
  readonly id: string;
  readonly entryId: string;
  readonly cycleId: string;
  readonly cycleIndex: number;
  readonly empireId: string;
  readonly fleetId: string;
  readonly originPlanetId: string;
  readonly participationKind: SolarWarParticipationKind;
  readonly participationId: string;
  readonly allianceId: string | null;
  readonly resolvedAt: number;
  readonly outcome: SolarWarOutcome;
  readonly score: number;
  readonly attackerInitial: Readonly<Record<string, number>>;
  readonly enemyInitial: Readonly<Record<string, number>>;
  readonly attackerRemaining: Readonly<Record<string, number>>;
  readonly enemyRemaining: Readonly<Record<string, number>>;
  readonly battleReport: BattleReport;
}

export interface SolarWarState {
  readonly activeEntries: readonly SolarWarEntry[];
  readonly history: readonly SolarWarResult[];
}

export interface EndgameParticipationState {
  readonly alliances: readonly EndgameAlliance[];
  readonly participants: readonly EndgameParticipant[];
  readonly membershipHistory: readonly AllianceMembershipHistoryEntry[];
  readonly nextAllianceSequence: number;
  readonly nextMembershipHistorySequence: number;
  readonly solarWar: SolarWarState;
}

export type FinalObjectProjectPhase = 'funding' | 'building' | 'vulnerable';

export interface FinalObjectContributionByEmpire {
  readonly empireId: string;
  readonly resources: ResourceCost;
}

export interface FinalObjectQualificationSnapshot {
  readonly cycleId: string;
  readonly cycleIndex: number;
  readonly resolvedAt: number;
  readonly score: number;
}

export interface FinalObjectProject {
  readonly id: string;
  readonly ownerEmpireId: string;
  readonly ownerPlanetId: string;
  readonly factionId: FactionId;
  readonly obeliskBuildingId: string;
  readonly gateBuildingId: string;
  readonly participationKind: SolarWarParticipationKind;
  readonly participationId: string;
  readonly allianceId: string | null;
  readonly eligibleEmpireIds: readonly string[];
  readonly qualification: FinalObjectQualificationSnapshot;
  readonly phase: FinalObjectProjectPhase;
  readonly requiredResources: ResourceCost;
  readonly contributedResources: ResourceCost;
  readonly contributionByEmpire: readonly FinalObjectContributionByEmpire[];
  readonly startedAt: number;
  readonly fundedAt?: number;
  readonly gateQueueItemId?: string;
  readonly gateCompletesAt?: number;
  readonly vulnerabilityStartedAt?: number;
  readonly stabilizesAt?: number;
}

export interface FinalObjectContributionHistoryEntry {
  readonly sequence: number;
  readonly projectId: string;
  readonly empireId: string;
  readonly sourcePlanetId: string;
  readonly resources: ResourceCost;
  readonly occurredAt: number;
}

export type FinalObjectHistoryAction = 'cancelled';

export interface FinalObjectHistoryEntry {
  readonly sequence: number;
  readonly projectId: string;
  readonly action: FinalObjectHistoryAction;
  readonly ownerEmpireId: string;
  readonly ownerPlanetId: string;
  readonly participationId: string;
  readonly occurredAt: number;
}

export interface EndgameFinalObjectState {
  readonly activeProjects: readonly FinalObjectProject[];
  readonly history: readonly FinalObjectHistoryEntry[];
  readonly contributionHistory: readonly FinalObjectContributionHistoryEntry[];
  readonly nextProjectSequence: number;
  readonly nextHistorySequence: number;
  readonly nextContributionSequence: number;
}

export interface OngoingCampaignResult {
  readonly status: 'ongoing';
}

export interface TerminalCampaignResult {
  readonly status: 'terminal';
  readonly winningParticipationKind: SolarWarParticipationKind;
  readonly winningParticipationId: string;
  readonly winningEmpireIds: readonly string[];
  readonly ownerEmpireId: string;
  readonly hostPlanetId: string;
  readonly terminalAt: number;
  readonly reason: 'final-gate-stabilized';
}

export type CampaignResult = OngoingCampaignResult | TerminalCampaignResult;
