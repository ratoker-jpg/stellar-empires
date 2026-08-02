import { planBotArenaParticipation } from './arenaPlanner';
import {
  isPirateTargetPublic,
  planBotPveOperations as planOrdinaryBotPveOperations,
  requiredRoleForOpportunity,
  PIRATE_EMPIRE_ID,
  type BotPveOperationsPlan as LegacyBotPveOperationsPlan,
  type BotPveReasonCode as LegacyBotPveReasonCode,
} from './pveOperationsPlannerLegacy';
import type { BotProfile } from './profiles';
import type { GameState } from '../types';

export type BotPveReasonCode = LegacyBotPveReasonCode | 'arena-selected';

export interface BotPveOperationsPlan
  extends Omit<LegacyBotPveOperationsPlan, 'reasonCode'> {
  readonly reasonCode: BotPveReasonCode;
}

export function planBotPveOperations(
  state: GameState,
  profile: BotProfile,
): BotPveOperationsPlan {
  const ordinary = planOrdinaryBotPveOperations(state, profile);
  if (ordinary.command !== null) return ordinary;

  const arena = planBotArenaParticipation(state, profile);
  if (arena.command === null) return ordinary;
  return {
    empireId: profile.empireId,
    personality: profile.personality,
    reasonCode: 'arena-selected',
    availabilityCode: null,
    explanation: arena.explanation,
    selectedOpportunityId: arena.selectedChallengeId,
    command: arena.command,
  };
}

export {
  isPirateTargetPublic,
  requiredRoleForOpportunity,
  PIRATE_EMPIRE_ID,
};
