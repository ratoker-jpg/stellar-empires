import { DEFAULT_BOT_PROFILES, type BotProfile } from './profiles';

export interface BotAutomationState {
  readonly nextDecisionAtByEmpire: Readonly<Record<string, number>>;
}

export function createInitialBotAutomationState(
  empireIds: readonly string[],
  elapsedSeconds: number,
  profiles: readonly BotProfile[] = DEFAULT_BOT_PROFILES,
): BotAutomationState {
  const activeEmpires = new Set(empireIds);
  return {
    nextDecisionAtByEmpire: Object.fromEntries(
      profiles
        .filter((profile) => activeEmpires.has(profile.empireId))
        .map((profile) => [profile.empireId, elapsedSeconds]),
    ),
  };
}

export function normalizeBotAutomationState(
  value: unknown,
  empireIds: readonly string[],
  elapsedSeconds: number,
  profiles: readonly BotProfile[] = DEFAULT_BOT_PROFILES,
): BotAutomationState | undefined {
  if (value === undefined) {
    return createInitialBotAutomationState(empireIds, elapsedSeconds, profiles);
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
  const nextDecisionAtByEmpire = (value as Record<string, unknown>).nextDecisionAtByEmpire;
  if (
    typeof nextDecisionAtByEmpire !== 'object' ||
    nextDecisionAtByEmpire === null ||
    Array.isArray(nextDecisionAtByEmpire)
  ) {
    return undefined;
  }

  const source = nextDecisionAtByEmpire as Record<string, unknown>;
  const activeEmpires = new Set(empireIds);
  const normalized: Record<string, number> = {};
  for (const profile of profiles) {
    if (!activeEmpires.has(profile.empireId)) continue;
    const nextDecisionAt = source[profile.empireId];
    if (
      typeof nextDecisionAt !== 'number' ||
      !Number.isInteger(nextDecisionAt) ||
      nextDecisionAt < 0
    ) {
      return undefined;
    }
    normalized[profile.empireId] = nextDecisionAt;
  }
  return { nextDecisionAtByEmpire: normalized };
}
