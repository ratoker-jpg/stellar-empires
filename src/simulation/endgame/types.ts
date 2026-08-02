export const ALLIANCE_NAME_MIN_LENGTH = 3;
export const ALLIANCE_NAME_MAX_LENGTH = 40;
export const ENDGAME_PARTICIPATION_HISTORY_LIMIT = 64;

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

export interface EndgameParticipationState {
  readonly alliances: readonly EndgameAlliance[];
  readonly participants: readonly EndgameParticipant[];
  readonly membershipHistory: readonly AllianceMembershipHistoryEntry[];
  readonly nextAllianceSequence: number;
  readonly nextMembershipHistorySequence: number;
}
