import type { BattleReport } from '../combat/types';
import type { FactionId } from '../planet/types';

export const ALLIANCE_NAME_MIN_LENGTH = 3;
export const ALLIANCE_NAME_MAX_LENGTH = 40;
export const ENDGAME_PARTICIPATION_HISTORY_LIMIT = 64;
export const SOLAR_WAR_CYCLE_SECONDS = 86_400;
export const SOLAR_WAR_HISTORY_LIMIT = 64;

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
