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
export type BotSchedulerCursor = Readonly<Record<string, number>>;

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
  readonly cursor: BotSchedulerCursor;
  readonly audit: readonly BotSchedulerAuditEntry[];
}

interface CommandCandidate {
  readonly source: BotPlannerSource;
  readonly command: GameCommand | null;
}

export function createBotSchedulerCursor(
  state: GameState,
  profiles: readonly BotProfile[] = DEFAULT_BOT_PROFILES,
  immediate = true,
): BotSchedulerCursor {
  return Object.fromEntries(
    profiles.map((profile) => [
      profile.empireId,
      immediate
        ? state.clock.elapsedSeconds - profile.decisionIntervalSeconds
        : state.clock.elapsedSeconds,
    ]),
  );
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
      decidedAt: state.clock.elapsedSeconds,
      source: candidate.source,
      command: candidate.command,
      accepted: result.ok,
      rejectionCode: result.ok ? null : result.code,
    });
    if (result.ok) working = result.value;
  }

  return { state: working, audit };
}

export function runBotScheduler(
  state: GameState,
  cursor: BotSchedulerCursor,
  profiles: readonly BotProfile[] = DEFAULT_BOT_PROFILES,
): BotSchedulerResult {
  let working = state;
  const nextCursor: Record<string, number> = { ...cursor };
  const audit: BotSchedulerAuditEntry[] = [];

  for (const profile of [...profiles].sort((left, right) => left.empireId.localeCompare(right.empireId))) {
    if (!working.empires.includes(profile.empireId)) continue;
    const lastDecisionAt = cursor[profile.empireId] ?? working.clock.elapsedSeconds;
    if (working.clock.elapsedSeconds - lastDecisionAt < profile.decisionIntervalSeconds) continue;
    const decision = runProfileDecision(working, profile);
    working = decision.state;
    audit.push(...decision.audit);
    nextCursor[profile.empireId] = working.clock.elapsedSeconds;
  }

  return { state: working, cursor: nextCursor, audit };
}
