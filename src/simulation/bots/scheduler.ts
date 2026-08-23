import type { MissionAvailabilityCode } from '../fleets/missionRules';
import { executeCommand } from '../reducer';
import type { GameCommand, GameState } from '../types';
import { getUnitDefinition } from '../units/catalog';
import { planBotColonyLogistics } from './colonyLogisticsPlanner';
import { planBotEconomy } from './economyPlanner';
import { planBotEndgameParticipation } from './endgameParticipationPlanner';
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
import {
  planBotPveOperations,
  type BotPveOperationsPlan,
  type BotPveReasonCode,
} from './pveOperationsPlanner';
import { planBotResearchAndProduction } from './researchProductionPlanner';
import {
  deriveBotStrategyPolicy,
  deriveCompressedDevelopmentPreference,
  type BotCompressedDevelopmentSource,
  type BotCompressedOpportunitySource,
} from './strategyPolicy';
import {
  planBotThreatAndRecovery,
  type BotThreatRecoveryPlan,
} from './threatRecoveryPlanner';

export type BotPlannerSource =
  | 'logistics'
  | 'economy'
  | 'research'
  | 'production'
  | 'fleet'
  | 'threat'
  | 'pve'
  | 'endgame';
export const MAX_BOT_DECISIONS_PER_RUN = 32;
export const POST_ENDGAME_BOT_DECISION_INTERVAL_SECONDS = 3_600;
export const BOT_PVE_PLANNING_INTERVAL_SECONDS = 21_600;
export const BOT_PVE_EVENT_PLANNING_INTERVAL_SECONDS = 3_600;
export const BOT_PORTFOLIO_MAINTENANCE_INTERVAL_SECONDS = 3_600;

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

export type BotSchedulerDiagnosticEntry =
  | {
      readonly empireId: string;
      readonly profileId: string;
      readonly personality: BotPersonality;
      readonly decidedAt: number;
      readonly source: 'fleet';
      readonly reasonCode: BotFleetReasonCode;
      readonly availabilityCode: MissionAvailabilityCode;
      readonly explanation: string;
    }
  | {
      readonly empireId: string;
      readonly profileId: string;
      readonly personality: BotPersonality;
      readonly decidedAt: number;
      readonly source: 'pve';
      readonly reasonCode: BotPveReasonCode;
      readonly availabilityCode: string | null;
      readonly explanation: string;
    };

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
  readonly pve: BotPveOperationsPlan | null;
}

const PRIORITY_THREAT_REASONS = new Set<BotThreatRecoveryPlan['reasonCode']>([
  'critical-economy-recovery',
  'economic-recovery',
  'military-recovery',
  'high-threat-response',
]);

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

function priorityThreatCommand(plan: BotThreatRecoveryPlan): GameCommand | null {
  return PRIORITY_THREAT_REASONS.has(plan.reasonCode) ? plan.command : null;
}

function endgameCommand(state: GameState, profile: BotProfile): GameCommand | null {
  return getBotProgressionPhase(state, profile.empireId) === 'endgame-preparation'
    ? planBotEndgameParticipation(state, profile).command
    : null;
}

function compressedCandidate(
  state: GameState,
  profile: BotProfile,
  attempted: readonly GameCommand[],
  allowLogistics: boolean,
  prioritizePortfolioMaintenance: boolean,
  allowPve: boolean,
  precomputedFleet?: BotFleetMissionPlan,
): PlannerCandidates {
  const logistics = allowLogistics
    ? planBotColonyLogistics(state, profile.empireId)
    : null;
  if (
    logistics !== null &&
    (logistics.roleChange || prioritizePortfolioMaintenance)
  ) {
    const invariantCandidate = selectCandidate('logistics', logistics.command, attempted);
    if (invariantCandidate !== null) {
      return {
        candidates: [invariantCandidate],
        fleet: precomputedFleet ?? null,
        pve: null,
      };
    }
  }

  const endgame = selectCandidate('endgame', endgameCommand(state, profile), attempted);
  if (endgame !== null) {
    return { candidates: [endgame], fleet: precomputedFleet ?? null, pve: null };
  }

  const policy = deriveBotStrategyPolicy(profile);
  const phase = getBotProgressionPhase(state, profile.empireId);
  const developmentPreference = deriveCompressedDevelopmentPreference(profile, phase);
  let science: ReturnType<typeof planBotResearchAndProduction> | undefined;
  let economy: ReturnType<typeof planBotEconomy> | undefined;
  let fleet: BotFleetMissionPlan | undefined = precomputedFleet;
  let pve: BotPveOperationsPlan | null = null;
  let pvePlanned = false;

  const getScience = (): ReturnType<typeof planBotResearchAndProduction> => {
    science ??= planBotResearchAndProduction(state, profile.empireId);
    return science;
  };
  const getEconomy = (): ReturnType<typeof planBotEconomy> => {
    economy ??= planBotEconomy(state, profile.empireId);
    return economy;
  };
  const getFleet = (): BotFleetMissionPlan => {
    fleet ??= planBotFleetMission(state, profile.empireId);
    return fleet;
  };
  const getPve = (): BotPveOperationsPlan | null => {
    if (!pvePlanned) {
      pve = allowPve ? planBotPveOperations(state, profile) : null;
      pvePlanned = true;
    }
    return pve;
  };

  const developmentCommand = (source: BotCompressedDevelopmentSource): GameCommand | null => {
    if (source === 'economy') return getEconomy().command;
    if (source === 'research') return getScience().research.command;
    if (source === 'production') return getScience().production.command;
    return logistics?.command ?? null;
  };

  for (const source of developmentPreference) {
    const candidate = selectCandidate(source, developmentCommand(source), attempted);
    if (candidate !== null) {
      return {
        candidates: [candidate],
        fleet: fleet ?? null,
        pve: pvePlanned ? pve : null,
      };
    }
  }

  const threat = planBotThreatAndRecovery(state, profile.empireId, {
    economy: getEconomy(),
    researchProduction: getScience(),
    ...(precomputedFleet === undefined ? {} : { fleet: precomputedFleet }),
  });
  const threatCandidate = selectCandidate(
    'threat',
    priorityThreatCommand(threat),
    attempted,
  );
  if (threatCandidate !== null) {
    return {
      candidates: [threatCandidate],
      fleet: fleet ?? null,
      pve: pvePlanned ? pve : null,
    };
  }

  const opportunityCommand = (source: BotCompressedOpportunitySource): GameCommand | null => {
    return source === 'pve' ? getPve()?.command ?? null : getFleet().command;
  };

  for (const source of policy.compressedOpportunityPreference) {
    const candidate = selectCandidate(source, opportunityCommand(source), attempted);
    if (candidate !== null) {
      return {
        candidates: [candidate],
        fleet: fleet ?? null,
        pve: pvePlanned ? pve : null,
      };
    }
  }

  return {
    candidates: [],
    fleet: fleet ?? null,
    pve: pvePlanned ? pve : null,
  };
}

function legacyCandidatesForPersonality(
  state: GameState,
  profile: BotProfile,
  allowLogistics: boolean,
  allowPve: boolean,
): PlannerCandidates {
  const economy = planBotEconomy(state, profile.empireId);
  const science = planBotResearchAndProduction(state, profile.empireId);
  const fleet = planBotFleetMission(state, profile.empireId);
  const threat = planBotThreatAndRecovery(state, profile.empireId, {
    economy,
    researchProduction: science,
    fleet,
  });
  const logistics = allowLogistics
    ? planBotColonyLogistics(state, profile.empireId).command
    : null;
  const pve = allowPve ? planBotPveOperations(state, profile) : null;
  const priorityThreat = priorityThreatCommand(threat);
  const endgame = endgameCommand(state, profile);
  const candidates: Readonly<Record<BotPersonality, readonly CommandCandidate[]>> = {
    industrial: [
      { source: 'endgame', command: endgame },
      { source: 'logistics', command: logistics },
      { source: 'economy', command: economy.command },
      { source: 'research', command: science.research.command },
      { source: 'production', command: science.production.command },
      { source: 'threat', command: priorityThreat },
      { source: 'pve', command: pve?.command ?? null },
      { source: 'fleet', command: fleet.command },
    ],
    explorer: [
      { source: 'endgame', command: endgame },
      { source: 'logistics', command: logistics },
      { source: 'threat', command: priorityThreat },
      { source: 'pve', command: pve?.command ?? null },
      { source: 'fleet', command: fleet.command },
      { source: 'economy', command: economy.command },
      { source: 'research', command: science.research.command },
      { source: 'production', command: science.production.command },
    ],
    aggressive: [
      { source: 'endgame', command: endgame },
      { source: 'logistics', command: logistics },
      { source: 'threat', command: priorityThreat },
      { source: 'pve', command: pve?.command ?? null },
      { source: 'production', command: science.production.command },
      { source: 'research', command: science.research.command },
      { source: 'fleet', command: fleet.command },
      { source: 'economy', command: economy.command },
    ],
  };
  return { candidates: candidates[profile.personality], fleet, pve };
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

function diagnosticForBlockedPve(
  profile: BotProfile,
  decidedAt: number,
  pve: BotPveOperationsPlan,
): BotSchedulerDiagnosticEntry | null {
  if (pve.command !== null) return null;
  return {
    empireId: profile.empireId,
    profileId: profile.id,
    personality: profile.personality,
    decidedAt,
    source: 'pve',
    reasonCode: pve.reasonCode,
    availabilityCode: pve.availabilityCode,
    explanation: pve.explanation,
  };
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

function isCadenceDue(
  state: GameState,
  profile: BotProfile,
  decidedAt: number,
  cadenceSeconds: number,
): boolean {
  if (decidedAt === 0) return true;
  const decisionInterval = Math.min(
    cadenceSeconds,
    getDecisionIntervalSeconds(state, profile),
  );
  return decidedAt % cadenceSeconds < decisionInterval;
}

function hasRelevantPveAsset(state: GameState, empireId: string): boolean {
  const pirateHuntActive = state.worldEvents.active.some(
    (event) => event.definitionId === 'pirate-hunt',
  );
  const relevantUnit = (unitId: string, quantity: number): boolean => {
    if (quantity <= 0) return false;
    const definition = getUnitDefinition(unitId);
    if (definition?.kind !== 'ship') return false;
    if (
      definition.role === 'scout' ||
      definition.role === 'recycler' ||
      definition.role === 'transport'
    ) {
      return true;
    }
    return pirateHuntActive && definition.stats.attack > 0;
  };
  if (
    state.fleets.some(
      (fleet) =>
        fleet.empireId === empireId &&
        (fleet.mission?.kind === 'expedition' ||
          fleet.mission?.kind === 'space-object' ||
          Object.entries(fleet.ships).some(([unitId, quantity]) =>
            relevantUnit(unitId, quantity))),
    )
  ) {
    return true;
  }
  return state.planets
    .filter((planet) => planet.ownerEmpireId === empireId)
    .some((planet) =>
      Object.entries(planet.inventory.ships).some(([unitId, quantity]) =>
        relevantUnit(unitId, quantity)),
    );
}

function hasActionablePveEvent(state: GameState): boolean {
  return state.worldEvents.active.some(
    (event) =>
      event.definitionId === 'pirate-hunt' ||
      event.definitionId === 'mineral-bloom',
  );
}

function hasActiveSpecialOperation(state: GameState, empireId: string): boolean {
  return state.fleets.some(
    (fleet) =>
      fleet.empireId === empireId &&
      (fleet.mission?.kind === 'expedition' || fleet.mission?.kind === 'space-object'),
  );
}

function isRoutinePveUnlocked(
  state: GameState,
  profile: BotProfile,
  decidedAt: number,
): boolean {
  if (decidedAt === 0) return true;
  const phase = getBotProgressionPhase(state, profile.empireId);
  return phase === 'planet-destruction' || phase === 'endgame-preparation';
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
  let logisticsCommandAttempted = false;
  let pveCommandAttempted = false;
  let pveDiagnosticRecorded = false;
  const compressed = state.campaignSettings.progressionProfile === 'compressed-v1';
  const portfolioMaintenanceDue = isCadenceDue(
    state,
    profile,
    decidedAt,
    BOT_PORTFOLIO_MAINTENANCE_INTERVAL_SECONDS,
  );
  const activeSpecialOperation = hasActiveSpecialOperation(state, profile.empireId);
  const pveCadence = hasActionablePveEvent(state) || activeSpecialOperation
    ? BOT_PVE_EVENT_PLANNING_INTERVAL_SECONDS
    : BOT_PVE_PLANNING_INTERVAL_SECONDS;
  const pveUnlocked = isRoutinePveUnlocked(state, profile, decidedAt) || activeSpecialOperation;
  const pveDue = pveUnlocked && isCadenceDue(
    state,
    profile,
    decidedAt,
    pveCadence,
  ) && hasRelevantPveAsset(state, profile.empireId);
  const diagnosticFleet = planBotFleetMission(working, profile.empireId);
  const diagnostic = diagnosticForBlockedFleet(profile, decidedAt, diagnosticFleet);
  if (diagnostic !== null) diagnostics.push(diagnostic);

  for (let index = 0; index < profile.maxCommandsPerDecision; index += 1) {
    const planning = compressed
      ? compressedCandidate(
          working,
          profile,
          attempted,
          !logisticsCommandAttempted,
          portfolioMaintenanceDue,
          pveDue && !pveCommandAttempted,
          index === 0 ? diagnosticFleet : undefined,
        )
      : legacyCandidatesForPersonality(
          working,
          profile,
          !logisticsCommandAttempted,
          pveDue && !pveCommandAttempted,
        );
    if (!pveDiagnosticRecorded && planning.pve !== null) {
      const pveDiagnostic = diagnosticForBlockedPve(profile, decidedAt, planning.pve);
      if (pveDiagnostic !== null) diagnostics.push(pveDiagnostic);
      pveDiagnosticRecorded = true;
    }
    const candidate = planning.candidates.find(
      (item) =>
        item.command !== null &&
        !hasBeenAttempted(item.command, attempted),
    );
    if (candidate?.command === null || candidate === undefined) break;
    attempted.push(candidate.command);
    if (candidate.source === 'logistics') logisticsCommandAttempted = true;
    if (candidate.source === 'pve') pveCommandAttempted = true;
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
