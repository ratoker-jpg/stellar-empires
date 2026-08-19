import {
  getEligibleSolarWarFleets,
  getSolarWarEntryForEmpire,
} from '../endgame/solarWarView';
import type { GameCommand, GameState } from '../types';
import { planBotEndgameFinalObjects } from './endgameFinalObjectPlanner';
import { createBotEndgamePerception } from './endgamePerception';
import type { BotProfile } from './profiles';

export type BotEndgameParticipationReasonCode =
  | 'campaign-terminal'
  | 'final-object-action'
  | 'participation-unavailable'
  | 'alliance-create'
  | 'alliance-join'
  | 'solo-selected'
  | 'solar-war-already-entered'
  | 'solar-war-already-resolved'
  | 'solar-war-no-eligible-fleet'
  | 'solar-war-enter';

export interface BotEndgameParticipationPlan {
  readonly command: GameCommand | null;
  readonly reasonCode: BotEndgameParticipationReasonCode;
}

const ALLIANCE_POLICY: Readonly<Record<string, {
  readonly mode: 'alliance' | 'solo';
  readonly allianceName?: string;
}>> = {
  'aegis-bot': { mode: 'alliance', allianceName: 'Aegis Vanguard' },
  'synod-bot': { mode: 'alliance', allianceName: 'Synod Compact' },
  'veyra-bot': { mode: 'solo' },
};

function alliancePolicy(profile: BotProfile) {
  return ALLIANCE_POLICY[profile.empireId] ?? { mode: 'solo' as const };
}

function allianceCommand(state: GameState, profile: BotProfile): BotEndgameParticipationPlan | null {
  const perception = createBotEndgamePerception(state, profile.empireId);
  const own = perception.ownParticipation;
  if (own === null) {
    return { command: null, reasonCode: 'participation-unavailable' };
  }
  if (own.allianceId !== null) return null;

  const policy = alliancePolicy(profile);
  if (policy.mode === 'solo') return null;

  const namedAlliance = policy.allianceName === undefined
    ? undefined
    : perception.publicAlliances.find((alliance) => alliance.name === policy.allianceName);
  const target = namedAlliance ?? perception.publicAlliances[0];
  if (target !== undefined) {
    return {
      command: {
        type: 'JOIN_ALLIANCE',
        empireId: profile.empireId,
        allianceId: target.id,
      },
      reasonCode: 'alliance-join',
    };
  }

  if (policy.allianceName === undefined) return null;
  return {
    command: {
      type: 'CREATE_ALLIANCE',
      empireId: profile.empireId,
      name: policy.allianceName,
    },
    reasonCode: 'alliance-create',
  };
}

export function planBotEndgameParticipation(
  state: GameState,
  profile: BotProfile,
): BotEndgameParticipationPlan {
  if (state.campaignResult?.status === 'terminal') {
    return { command: null, reasonCode: 'campaign-terminal' };
  }
  if (state.endgameParticipation === undefined) {
    return { command: null, reasonCode: 'participation-unavailable' };
  }

  const finalObject = planBotEndgameFinalObjects(state, profile);
  if (finalObject.command !== null) {
    return { command: finalObject.command, reasonCode: 'final-object-action' };
  }

  const membership = allianceCommand(state, profile);
  if (membership !== null) return membership;

  const policy = alliancePolicy(profile);
  if (policy.mode === 'solo') {
    const own = createBotEndgamePerception(state, profile.empireId).ownParticipation;
    if (own?.allianceId !== null && own?.allianceId !== undefined) {
      return {
        command: { type: 'LEAVE_ALLIANCE', empireId: profile.empireId },
        reasonCode: 'solo-selected',
      };
    }
  }

  if (getSolarWarEntryForEmpire(state, profile.empireId) !== undefined) {
    return { command: null, reasonCode: 'solar-war-already-entered' };
  }

  const perception = createBotEndgamePerception(state, profile.empireId);
  if (perception.ownSolarWarResults.some(
    (result) => result.cycleId === perception.currentSolarWarCycle.id,
  )) {
    return { command: null, reasonCode: 'solar-war-already-resolved' };
  }

  const fleet = [...getEligibleSolarWarFleets(state, profile.empireId)]
    .sort((left, right) => left.id.localeCompare(right.id))[0];
  if (fleet === undefined) {
    return { command: null, reasonCode: 'solar-war-no-eligible-fleet' };
  }
  return {
    command: {
      type: 'ENTER_SOLAR_WAR',
      empireId: profile.empireId,
      fleetId: fleet.id,
    },
    reasonCode: 'solar-war-enter',
  };
}
