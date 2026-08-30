import {
  DEFAULT_BOT_PROFILES,
  PLAYER_EMPIRE_ID,
  type BotProfile,
} from './profiles';

export interface BotAutomationState {
  /**
   * Per-bot profile set stored with the state (schema v20, docs/30 D-7).
   * Optional at the type level so pre-v20 legacy states compile unchanged;
   * the v20 save boundary (normalize) still requires a profile for every bot.
   */
  readonly profiles?: readonly BotProfile[];
  readonly nextDecisionAtByEmpire: Readonly<Record<string, number>>;
}

export function createInitialBotAutomationState(
  empireIds: readonly string[],
  elapsedSeconds: number,
  profiles: readonly BotProfile[] = DEFAULT_BOT_PROFILES,
): BotAutomationState {
  const activeEmpires = new Set(empireIds);
  const activeProfiles = profiles.filter((profile) => activeEmpires.has(profile.empireId));
  return {
    profiles: activeProfiles,
    nextDecisionAtByEmpire: Object.fromEntries(
      activeProfiles.map((profile) => [profile.empireId, elapsedSeconds]),
    ),
  };
}

function isBotProfile(value: unknown): value is BotProfile {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== 'string' || candidate.id.length === 0 ||
    typeof candidate.empireId !== 'string' || candidate.empireId.length === 0 ||
    candidate.empireId === PLAYER_EMPIRE_ID ||
    (candidate.personality !== 'industrial' && candidate.personality !== 'explorer' &&
      candidate.personality !== 'aggressive') ||
    (candidate.difficulty !== 'easy' && candidate.difficulty !== 'normal' &&
      candidate.difficulty !== 'hard') ||
    !Number.isSafeInteger(candidate.decisionIntervalSeconds) ||
    (candidate.decisionIntervalSeconds as number) <= 0 ||
    !Number.isSafeInteger(candidate.maxCommandsPerDecision) ||
    (candidate.maxCommandsPerDecision as number) <= 0) {
    return false;
  }
  if (candidate.earlyDecisionIntervalSeconds !== undefined &&
    (!Number.isSafeInteger(candidate.earlyDecisionIntervalSeconds) ||
      (candidate.earlyDecisionIntervalSeconds as number) <= 0)) {
    return false;
  }
  return true;
}

export function normalizeBotAutomationState(
  value: unknown,
  empireIds: readonly string[],
  elapsedSeconds: number,
  fallbackProfiles: readonly BotProfile[] = DEFAULT_BOT_PROFILES,
): BotAutomationState | undefined {
  if (value === undefined) {
    return createInitialBotAutomationState(empireIds, elapsedSeconds, fallbackProfiles);
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;

  const source = value as Record<string, unknown>;
  const rawProfiles = source.profiles;
  let profiles: readonly BotProfile[];
  if (rawProfiles === undefined) {
    profiles = fallbackProfiles.filter((profile) => empireIds.includes(profile.empireId));
  } else {
    if (!Array.isArray(rawProfiles) || rawProfiles.length === 0) return undefined;
    const parsed: BotProfile[] = [];
    for (const item of rawProfiles) {
      if (!isBotProfile(item)) return undefined;
      parsed.push(item);
    }
    profiles = parsed;
  }

  const botEmpireIds = empireIds.filter((empireId) => empireId !== PLAYER_EMPIRE_ID);
  const profileEmpireIds = new Set(profiles.map((profile) => profile.empireId));
  if (botEmpireIds.some((empireId) => !profileEmpireIds.has(empireId))) return undefined;
  if (profiles.some((profile) => !botEmpireIds.includes(profile.empireId))) return undefined;

  const nextDecisionAtByEmpire = source.nextDecisionAtByEmpire;
  if (
    typeof nextDecisionAtByEmpire !== 'object' ||
    nextDecisionAtByEmpire === null ||
    Array.isArray(nextDecisionAtByEmpire)
  ) {
    return undefined;
  }

  const decisions = nextDecisionAtByEmpire as Record<string, unknown>;
  const normalized: Record<string, number> = {};
  for (const profile of profiles) {
    const nextDecisionAt = decisions[profile.empireId];
    if (
      typeof nextDecisionAt !== 'number' ||
      !Number.isInteger(nextDecisionAt) ||
      nextDecisionAt < 0
    ) {
      return undefined;
    }
    normalized[profile.empireId] = nextDecisionAt;
  }
  if (Object.keys(decisions).length !== profiles.length) return undefined;
  return { profiles, nextDecisionAtByEmpire: normalized };
}
