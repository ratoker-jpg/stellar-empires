import { hashText } from '../seed';

export type BotDifficulty = 'easy' | 'normal' | 'hard';
export type BotPersonality = 'industrial' | 'explorer' | 'aggressive';

export interface BotProfile {
  readonly id: string;
  readonly empireId: string;
  readonly personality: BotPersonality;
  readonly difficulty: BotDifficulty;
  readonly decisionIntervalSeconds: number;
  readonly earlyDecisionIntervalSeconds?: number;
  readonly maxCommandsPerDecision: number;
}

export const PLAYER_EMPIRE_ID = 'player' as const;
/** Historical bot empire ids; they only exist in legacy (botEmpireCount = 3) worlds. */
export const LEGACY_BOT_EMPIRE_IDS: readonly string[] = [
  'aegis-bot',
  'synod-bot',
  'veyra-bot',
] as const;

export const DEFAULT_BOT_PROFILES: readonly BotProfile[] = [
  {
    id: 'profile.aegis-industrial',
    empireId: 'aegis-bot',
    personality: 'industrial',
    difficulty: 'normal',
    decisionIntervalSeconds: 600,
    earlyDecisionIntervalSeconds: 240,
    maxCommandsPerDecision: 2,
  },
  {
    id: 'profile.synod-explorer',
    empireId: 'synod-bot',
    personality: 'explorer',
    difficulty: 'hard',
    decisionIntervalSeconds: 300,
    earlyDecisionIntervalSeconds: 240,
    maxCommandsPerDecision: 3,
  },
  {
    id: 'profile.veyra-aggressive',
    empireId: 'veyra-bot',
    personality: 'aggressive',
    difficulty: 'normal',
    decisionIntervalSeconds: 450,
    earlyDecisionIntervalSeconds: 240,
    maxCommandsPerDecision: 2,
  },
] as const;

/**
 * Deterministic bot empire ids for generated worlds: `bot-01` .. `bot-<N>`
 * (docs/30 D-1 uses two-digit padding; three-digit values such as `bot-100`
 * appear verbatim once N reaches 100).
 */
export function generatedBotEmpireId(index: number, botEmpireCount: number): string {
  if (!Number.isInteger(index) || index < 0 || index >= botEmpireCount) {
    throw new Error(`Bot empire index is out of range: ${index} of ${botEmpireCount}.`);
  }
  return `bot-${String(index + 1).padStart(2, '0')}`;
}

export function buildBotEmpireIds(botEmpireCount: number): readonly string[] {
  if (botEmpireCount === 3) return LEGACY_BOT_EMPIRE_IDS;
  return Array.from(
    { length: botEmpireCount },
    (_, index) => generatedBotEmpireId(index, botEmpireCount),
  );
}

const GENERATED_PERSONALITIES: readonly BotPersonality[] = [
  'industrial',
  'explorer',
  'aggressive',
];
const GENERATED_DIFFICULTIES: readonly BotDifficulty[] = ['normal', 'hard', 'easy'];
const GENERATED_DECISION_INTERVALS: readonly number[] = [300, 360, 420, 450, 480, 540, 600];
const GENERATED_MAX_COMMANDS: readonly number[] = [2, 3];

function profileForGeneratedEmpire(seed: number, empireId: string): BotProfile {
  const roll = hashText(`${seed}:bot-profile:${empireId}`);
  const personality = GENERATED_PERSONALITIES[roll % GENERATED_PERSONALITIES.length] ?? 'industrial';
  const difficulty =
    GENERATED_DIFFICULTIES[Math.floor(roll / 3) % GENERATED_DIFFICULTIES.length] ?? 'normal';
  const decisionIntervalSeconds =
    GENERATED_DECISION_INTERVALS[Math.floor(roll / 9) % GENERATED_DECISION_INTERVALS.length] ?? 450;
  const maxCommandsPerDecision =
    GENERATED_MAX_COMMANDS[Math.floor(roll / 27) % GENERATED_MAX_COMMANDS.length] ?? 2;
  return {
    id: `profile.${empireId}`,
    empireId,
    personality,
    difficulty,
    decisionIntervalSeconds,
    earlyDecisionIntervalSeconds: 240,
    maxCommandsPerDecision,
  };
}

/**
 * Resolves the bot profile set for an empire list.
 * Legacy empires keep their historical hard-coded profiles; generated
 * `bot-<NN>` empires derive theirs deterministically from the campaign seed.
 */
export function createBotProfilesForEmpires(
  seed: number,
  empireIds: readonly string[],
): readonly BotProfile[] {
  const profiles: BotProfile[] = [];
  for (const empireId of empireIds) {
    if (empireId === PLAYER_EMPIRE_ID) continue;
    const legacy = DEFAULT_BOT_PROFILES.find((profile) => profile.empireId === empireId);
    profiles.push(legacy ?? profileForGeneratedEmpire(seed, empireId));
  }
  return profiles;
}

export function getBotProfile(empireId: string): BotProfile | undefined {
  return DEFAULT_BOT_PROFILES.find((profile) => profile.empireId === empireId);
}
