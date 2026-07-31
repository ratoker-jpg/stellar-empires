import type { MissionAvailabilityCode } from '../fleets/missionRules';
import { executeCommand } from '../reducer';
import type { GameCommand, GameState } from '../types';
import { planBotEconomy } from './economyPlanner';
import {
  planBotFleetMission,
  type BotFleetReasonCode,
  type BotFleetMissionPlan,
} from './fleetMissionPlanner';
import {
  DEFAULT_BOT_PROFILES,
  type BotPersonality,
  type BotProfile,
} from './profiles';
import { getBotProgressionPhase } from './progressionPhase';
import { planBotResearchAndProduction } from './researchProductionPlanner';
import { planBotThreatAndRecovery } from './threatRecoveryPlanner';

export type BotPlannerSource = 'economy' | 'research' | 'production' | 'fleet' | 'threat';
export const MAX_BOT_DECISIONS_PER_RUN = 32;
export const POST_ENDGAME_BOT_DECISION_INTERVAL_SECONDS = 3_600;

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

export interface BotSchedulerDiagnosticEntry {
  readonly empireId: string;
  readonly profileId: string;
  readonly personality: BotPersonality;
  readonly decidedAt: number;
  readonly source: 'fleet';
  readonly reasonCode: BotFleetReasonCode;
  readonly availabilityCode: MissionAvailabilityCode;
  readonly explanation: string;
}

export interface BotSchedulerResult {
  readonly state: GameState;
  readonly audit: readonly BotSchedulerAuditEntry[];
  readonly diagnostics: readonly BotSchedulerDiagnosticEntry[];
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

interface PlannerCandidates {
  readonly candidates: readonly CommandCandidate[];
  readonly fleet: BotFleetMissionPlan | null;
}

function isSameCommand(left: GameCommand, right: GameCommand): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function hasBeenAttempted(
  command: GameCommand | null,
  attempted: readonly GameCommand[],
): boolean {
  return command !== null && attempted.some((candidate) => isSameCommand(candidate, command));
}

function selectCandidate(
  source: BotPlannerSource,
  command: GameCommand | null,
  attempted: readonly GameCommand[],
): CommandCandidate | null {
  return command === null || hasBeenAttempted(command, attempted)
    ? null
    : { source, command };
}

function compressedCandidate(
  state: GameState,
  profile: BotProfile,
  attempted: readonly GameCommand[],
  precomputedFleet?: BotFleetMissionPlan,
): PlannerCandidates {
  const science = planBotResearchAndProduction(state, profile.empireId);
  const production = selectCandidate(
    'production',
    science.production.command,
    attempted,
  );
  if (production !== null) return { candidates: [production], fleet: precomputedFleet ?? null };

  const research = selectCandidate('research', science.research.command, attempted);
  if (research !== null) return { candidates: [research], fleet: precomputedFleet ?? null };

  const economy = planBotEconomy(state, profile.empireId);
  const economyCandidate = selectCandidate('economy', economy.command, attempted);
  if (economyCandidate !== null) {
    return { candidates: [economyCandidate], fleet: precomputedFleet ?? null };
  }

  const threat = planBotThreatAndRecovery(state, profile.empireId, {
    economy,
    researchProduction: science,
    ...(precomputedFleet === undefined ? {} : { fleet: precomputedFleet }),
  });
  const threatCandidate = selectCandidate('threat', threat.command, attempted);
  if (threatCandidate !== null) {
    return { candidates: [threatCandidate], fleet: precomputedFleet ?? null };
  }

  const fleet = precomputedFleet ?? planBotFleetMission(state, profile.empireId);
  const fleetCandidate = selectCandidate('fleet', fleet.command, attempted);
  return {
    candidates: fleetCandidate === null ? [] : [fleetCandidate],
    fleet,
  };
}

function legacyCandidatesForPersonality(
  state: GameState,
  profile: BotProfile,
): PlannerCandidates {
  const economy = planBotEconomy(state, profile.empireId);
  const science = planBotResearchAndProduction(state, profile.empireId);
  const fleet = planBotFleetMission(state, profile.empireId);
  const threat = planBotThreatAndRecovery(state, profile.empireId, {
    economy,
    researchProduction: science,
    fleet,
  });
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
  return { candidates: candidates[profile.personality], fleet };
}

function diagnosticForBlockedFleet(
  profile: BotProfile,
  decidedAt: number,
  fleet: BotFleetMissionPlan,
): BotSchedulerDiagnosticEntry | null {
  if (
    !fleet.reasonCode.startsWith('mission-blocked-') ||
    fleet.availabilityCode === null
  ) {
    return null;
  }
  return {
    empireId: profile.empireId,
    profileId: profile.id,
    personality: profile.personality,
    decidedAt,
    source: 'fleet',
    reasonCode: fleet.reasonCode,
    availabilityCode: fleet.availabilityCode,
    explanation: fleet.explanation,
  };
}

function runProfileDecision(
  state: GameState,
  profile: BotProfile,
  decidedAt: number,
): {
  readonly state: GameState;
  readonly audit: readonly BotSchedulerAuditEntry[];
  readonly diagnostics: readonly BotSchedulerDiagnosticEntry[];
} {
  let working = state;
  const audit: BotSchedulerAuditEntry[] = [];
  const diagnostics: BotSchedulerDiagnosticEntry[] = [];
  const attempted: GameCommand[] = [];
  const compressed = state.campaignSettings.progressionProfile === 'compressed-v1';
  const diagnosticFleet = planBotFleetMission(working, profile.empireId);
  const diagnostic = diagnosticForBlockedFleet(profile, decidedAt, diagnosticFleet);
  if (diagnostic !== null) diagnostics.push(diagnostic);

  for (let index = 0; index < profile.maxCommandsPerDecision; index += 1) {
    const planning = compressed
      ? compressedCandidate(
          working,
          profile,
          attempted,
          index === 0 ? diagnosticFleet : undefined,
        )
      : legacyCandidatesForPersonality(working, profile);
    const candidate = planning.candidates.find(
      (item) =>
        item.command !== null &&
        !hasBeenAttempted(item.command, attempted),
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

  return { state: working, audit, diagnostics };
}

function getScheduledProfiles(
  state: GameState,
  profiles: readonly BotProfile[],
): readonly DueProfile[] {
  const activeEmpires = new Set(state.empires);
  return profiles
    .filter((profile) => activeEmpires.has(profile.empireId))
    .map((profile) => ({
      profile,
      nextDecisionAt:
        state.botAutomation.nextDecisionAtByEmpire[profile.empireId] ??
        state.clock.elapsedSeconds,
    }))
    .sort(
      (left, right) =>
        left.nextDecisionAt - right.nextDecisionAt ||
        left.profile.empireId.localeCompare(right.profile.empireId),
    );
}

export function getNextBotDecisionAt(
  state: GameState,
  profiles: readonly BotProfile[] = DEFAULT_BOT_PROFILES,
): number | undefined {
  return getScheduledProfiles(state, profiles)[0]?.nextDecisionAt;
}

function getNextDueProfile(
  state: GameState,
  profiles: readonly BotProfile[],
): DueProfile | undefined {
  return getScheduledProfiles(state, profiles)
    .find((entry) => entry.nextDecisionAt <= state.clock.elapsedSeconds);
}

function getDecisionIntervalSeconds(state: GameState, profile: BotProfile): number {
  if (state.campaignSettings.progressionProfile === 'compressed-v1') {
    const phase = getBotProgressionPhase(state, profile.empireId);
    if (phase === 'endgame-preparation') {
      return Math.max(
        profile.decisionIntervalSeconds,
        POST_ENDGAME_BOT_DECISION_INTERVAL_SECONDS,
      );
    }
    if (
      profile.earlyDecisionIntervalSeconds !== undefined &&
      (phase === 'foundation' || phase === 'reconnaissance')
    ) {
      return Math.min(
        profile.decisionIntervalSeconds,
        profile.earlyDecisionIntervalSeconds,
      );
    }
  }
  return profile.decisionIntervalSeconds;
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
        [due.profile.empireId]:
          due.nextDecisionAt + getDecisionIntervalSeconds(state, due.profile),
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
  const diagnostics: BotSchedulerDiagnosticEntry[] = [];
  let processedDecisions = 0;

  while (processedDecisions < maxDecisions) {
    const due = getNextDueProfile(working, profiles);
    if (due === undefined) break;
    working = advanceProfileCursor(working, due);
    const decision = runProfileDecision(working, due.profile, due.nextDecisionAt);
    working = decision.state;
    audit.push(...decision.audit);
    diagnostics.push(...decision.diagnostics);
    processedDecisions += 1;
  }

  return {
    state: working,
    audit,
    diagnostics,
    processedDecisions,
    hasMoreDueDecisions: getNextDueProfile(working, profiles) !== undefined,
  };
}
