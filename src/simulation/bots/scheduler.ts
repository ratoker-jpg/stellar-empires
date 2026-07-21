import { executeCommand } from '../reducer';
import type { GameCommand, GameState } from '../types';
import { planBotEconomy } from './economyPlanner';
import { planBotFleetMission } from './fleetMissionPlanner';
import {
  DEFAULT_BOT_PROFILES,
  type BotPersonality,
  type BotProfile,
} from './profiles';
import { planBotResearchAndProduction } from './researchProductionPlanner';
import { planBotThreatAndRecovery } from './threatRecoveryPlanner';

export type BotPlannerSource = 'economy' | 'research' | 'production' | 'fleet' | 'threat';
export const MAX_BOT_DECISIONS_PER_RUN = 32;

export interface BotSchedulerAuditEntry {
  readonly empireId: string;
  readonly profileId: string;
  readonly personality: BotPersonality;
  readonly decidedAt: number;
  readonly source: BotPlannerSource;
  readonly command: GameCommand;
  readonly accepted: boolean;
  readonly rejectionCode: string | null;
}

export interface BotSchedulerResult {
  readonly state: GameState;
  readonly audit: readonly BotSchedulerAuditEntry[];
  readonly processedDecisions: number;
  readonly hasMoreDueDecisions: boolean;
}

interface CommandCandidate {
  readonly source: BotPlannerSource;
  readonly command: GameCommand | null;
}

interface DueProfile {
  readonly profile: BotProfile;
  readonly nextDecisionAt: number;
}

function candidatesForPersonality(
  state: GameState,
  profile: BotProfile,
): readonly CommandCandidate[] {
  const economy = planBotEconomy(state, profile.empireId);
  const science = planBotResearchAndProduction(state, profile.empireId);
  const fleet = planBotFleetMission(state, profile.empireId);
  const threat = planBotThreatAndRecovery(state, profile.empireId);
  const candidates: Readonly<Record<BotPersonality, readonly CommandCandidate[]>> = {
    industrial: [
      { source: 'economy', command: economy.command },
      { source: 'research', command: science.research.command },
      { source: 'production', command: science.production.command },
      { source: 'threat', command: threat.command },
      { source: 'fleet', command: fleet.command },
    ],
    explorer: [
      { source: 'fleet', command: fleet.command },
      { source: 'economy', command: economy.command },
      { source: 'research', command: science.research.command },
      { source: 'production', command: science.production.command },
      { source: 'threat', command: threat.command },
    ],
    aggressive: [
      { source: 'threat', command: threat.command },
      { source: 'production', command: science.production.command },
      { source: 'research', command: science.research.command },
      { source: 'fleet', command: fleet.command },
      { source: 'economy', command: economy.command },
    ],
  };
  return candidates[profile.personality];
}

function isSameCommand(left: GameCommand, right: GameCommand): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function runProfileDecision(
  state: GameState,
  profile: BotProfile,
  decidedAt: number,
): { readonly state: GameState; readonly audit: readonly BotSchedulerAuditEntry[] } {
  let working = state;
  const audit: BotSchedulerAuditEntry[] = [];
  const attempted: GameCommand[] = [];

  for (let index = 0; index < profile.maxCommandsPerDecision; index += 1) {
    const candidate = candidatesForPersonality(working, profile).find(
      (item) =>
        item.command !== null &&
        !attempted.some((command) =>
          item.command === null ? false : isSameCommand(command, item.command),
        ),
    );
    if (candidate?.command === null || candidate === undefined) break;
    attempted.push(candidate.command);
    const result = executeCommand(working, candidate.command);
    audit.push({
      empireId: profile.empireId,
      profileId: profile.id,
      personality: profile.personality,
      decidedAt,
      source: candidate.source,
      command: candidate.command,
      accepted: result.ok,
      rejectionCode: result.ok ? null : result.code,
    });
    if (result.ok) working = result.value;
  }

  return { state: working, audit };
}

function getNextDueProfile(
  state: GameState,
  profiles: readonly BotProfile[],
): DueProfile | undefined {
  const activeEmpires = new Set(state.empires);
  return profiles
    .filter((profile) => activeEmpires.has(profile.empireId))
    .map((profile) => ({
      profile,
      nextDecisionAt:
        state.botAutomation.nextDecisionAtByEmpire[profile.empireId] ??
        state.clock.elapsedSeconds,
    }))
    .filter((entry) => entry.nextDecisionAt <= state.clock.elapsedSeconds)
    .sort(
      (left, right) =>
        left.nextDecisionAt - right.nextDecisionAt ||
        left.profile.empireId.localeCompare(right.profile.empireId),
    )[0];
}

function advanceProfileCursor(
  state: GameState,
  due: DueProfile,
): GameState {
  return {
    ...state,
    botAutomation: {
      nextDecisionAtByEmpire: {
        ...state.botAutomation.nextDecisionAtByEmpire,
        [due.profile.empireId]: due.nextDecisionAt + due.profile.decisionIntervalSeconds,
      },
    },
  };
}

export function runBotScheduler(
  state: GameState,
  profiles: readonly BotProfile[] = DEFAULT_BOT_PROFILES,
  maxDecisions = MAX_BOT_DECISIONS_PER_RUN,
): BotSchedulerResult {
  if (!Number.isInteger(maxDecisions) || maxDecisions < 1) {
    throw new Error('Bot scheduler decision budget must be a positive integer.');
  }

  let working = state;
  const audit: BotSchedulerAuditEntry[] = [];
  let processedDecisions = 0;

  while (processedDecisions < maxDecisions) {
    const due = getNextDueProfile(working, profiles);
    if (due === undefined) break;
    working = advanceProfileCursor(working, due);
    const decision = runProfileDecision(working, due.profile, due.nextDecisionAt);
    working = decision.state;
    audit.push(...decision.audit);
    processedDecisions += 1;
  }

  return {
    state: working,
    audit,
    processedDecisions,
    hasMoreDueDecisions: getNextDueProfile(working, profiles) !== undefined,
  };
}
