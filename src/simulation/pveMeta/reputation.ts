import type { ResourceCost } from '../economy/types';
import type { FactionId } from '../planet/types';

export type PveReputationTier = 'recruit' | 'ranger' | 'vanguard' | 'warden';
export type ArenaDifficulty = 'patrol' | 'assault' | 'elite';
export type ArenaResultOutcome = 'victory' | 'defeat' | 'draw' | 'withdrawn';

export interface EmpirePveReputationState {
  readonly empireId: string;
  readonly reputation: number;
}

export interface ArenaChallenge {
  readonly id: string;
  readonly cycleIndex: number;
  readonly slot: 0 | 1 | 2;
  readonly difficulty: ArenaDifficulty;
  readonly factionId: FactionId;
  readonly enemyUnits: Readonly<Record<string, number>>;
  readonly entryCost: ResourceCost;
  readonly reward: ResourceCost;
  readonly durationSeconds: number;
  readonly combatSeed: number;
}

export interface ArenaEntry {
  readonly id: string;
  readonly empireId: string;
  readonly fleetId: string;
  readonly originPlanetId: string;
  readonly challenge: ArenaChallenge;
  readonly enteredAt: number;
  readonly resolvesAt: number;
  readonly resolutionSeed?: number;
}

export interface ArenaResult {
  readonly id: string;
  readonly entryId: string;
  readonly challengeId: string;
  readonly empireId: string;
  readonly fleetId: string;
  readonly difficulty: ArenaDifficulty;
  readonly resolvedAt: number;
  readonly outcome: ArenaResultOutcome;
  readonly attackerInitial: Readonly<Record<string, number>>;
  readonly enemyInitial: Readonly<Record<string, number>>;
  readonly attackerRemaining: Readonly<Record<string, number>>;
  readonly enemyRemaining: Readonly<Record<string, number>>;
  readonly rewardGranted: ResourceCost;
  readonly reputationAward: number;
}

export interface PveMetaState {
  readonly reputations: readonly EmpirePveReputationState[];
  readonly activeArenaEntries: readonly ArenaEntry[];
  readonly arenaHistory: readonly ArenaResult[];
}

export const ARENA_HISTORY_LIMIT = 64;

export const PVE_REPUTATION_THRESHOLDS: Readonly<Record<PveReputationTier, number>> = {
  recruit: 0,
  ranger: 100,
  vanguard: 300,
  warden: 700,
};

export const PVE_REPUTATION_AWARDS = {
  expeditionSuccess: 10,
  spaceObjectYield: 15,
  pirateBaseDestroyed: 30,
  pirateHuntTargetDestroyed: 20,
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isReputation(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return isReputation(value) && value > 0;
}

function isResourceCost(value: unknown): value is ResourceCost {
  return isRecord(value) &&
    isReputation(value.metal) &&
    isReputation(value.crystal) &&
    isReputation(value.gas);
}

function isUnitMap(value: unknown): value is Readonly<Record<string, number>> {
  return isRecord(value) && Object.entries(value).every(
    ([unitId, quantity]) => unitId.length > 0 && isPositiveInteger(quantity),
  );
}

function isFactionId(value: unknown): value is FactionId {
  return value === 'aegis' || value === 'synod' || value === 'veyra';
}

function isArenaDifficulty(value: unknown): value is ArenaDifficulty {
  return value === 'patrol' || value === 'assault' || value === 'elite';
}

function isArenaOutcome(value: unknown): value is ArenaResultOutcome {
  return value === 'victory' || value === 'defeat' || value === 'draw' || value === 'withdrawn';
}

function normalizeArenaChallenge(value: unknown): ArenaChallenge | undefined {
  if (!isRecord(value) || typeof value.id !== 'string' || value.id.length === 0 ||
    !isReputation(value.cycleIndex) ||
    (value.slot !== 0 && value.slot !== 1 && value.slot !== 2) ||
    !isArenaDifficulty(value.difficulty) || !isFactionId(value.factionId) ||
    !isUnitMap(value.enemyUnits) || !isResourceCost(value.entryCost) ||
    !isResourceCost(value.reward) || !isPositiveInteger(value.durationSeconds) ||
    !isReputation(value.combatSeed)) {
    return undefined;
  }
  return {
    id: value.id,
    cycleIndex: value.cycleIndex,
    slot: value.slot,
    difficulty: value.difficulty,
    factionId: value.factionId,
    enemyUnits: value.enemyUnits,
    entryCost: value.entryCost,
    reward: value.reward,
    durationSeconds: value.durationSeconds,
    combatSeed: value.combatSeed,
  };
}

function normalizeArenaEntry(value: unknown): ArenaEntry | undefined {
  if (!isRecord(value) || typeof value.id !== 'string' || value.id.length === 0 ||
    typeof value.empireId !== 'string' || typeof value.fleetId !== 'string' ||
    typeof value.originPlanetId !== 'string' || !isReputation(value.enteredAt) ||
    !isReputation(value.resolvesAt) || value.resolvesAt < value.enteredAt ||
    (value.resolutionSeed !== undefined && !isReputation(value.resolutionSeed))) {
    return undefined;
  }
  const challenge = normalizeArenaChallenge(value.challenge);
  if (challenge === undefined) return undefined;
  return {
    id: value.id,
    empireId: value.empireId,
    fleetId: value.fleetId,
    originPlanetId: value.originPlanetId,
    challenge,
    enteredAt: value.enteredAt,
    resolvesAt: value.resolvesAt,
    ...(value.resolutionSeed === undefined ? {} : { resolutionSeed: value.resolutionSeed }),
  };
}

function normalizeArenaResult(value: unknown): ArenaResult | undefined {
  if (!isRecord(value) || typeof value.id !== 'string' || value.id.length === 0 ||
    typeof value.entryId !== 'string' || typeof value.challengeId !== 'string' ||
    typeof value.empireId !== 'string' || typeof value.fleetId !== 'string' ||
    !isArenaDifficulty(value.difficulty) || !isReputation(value.resolvedAt) ||
    !isArenaOutcome(value.outcome) || !isUnitMap(value.attackerInitial) ||
    !isUnitMap(value.enemyInitial) || !isUnitMap(value.attackerRemaining) ||
    !isUnitMap(value.enemyRemaining) || !isResourceCost(value.rewardGranted) ||
    !isReputation(value.reputationAward)) {
    return undefined;
  }
  return {
    id: value.id,
    entryId: value.entryId,
    challengeId: value.challengeId,
    empireId: value.empireId,
    fleetId: value.fleetId,
    difficulty: value.difficulty,
    resolvedAt: value.resolvedAt,
    outcome: value.outcome,
    attackerInitial: value.attackerInitial,
    enemyInitial: value.enemyInitial,
    attackerRemaining: value.attackerRemaining,
    enemyRemaining: value.enemyRemaining,
    rewardGranted: value.rewardGranted,
    reputationAward: value.reputationAward,
  };
}

function assertReputation(value: number, label: string): void {
  if (!isReputation(value)) {
    throw new Error(`${label} must be a non-negative safe integer.`);
  }
}

export function createInitialPveMetaState(
  empireIds: readonly string[],
): PveMetaState {
  return {
    reputations: empireIds.map((empireId) => ({ empireId, reputation: 0 })),
    activeArenaEntries: [],
    arenaHistory: [],
  };
}

export function normalizePveMetaState(
  value: unknown,
  empireIds: readonly string[],
): PveMetaState | undefined {
  if (!isRecord(value) || !Array.isArray(value.reputations)) return undefined;
  const rawEntries = value.activeArenaEntries ?? [];
  const rawHistory = value.arenaHistory ?? [];
  if (!Array.isArray(rawEntries) || !Array.isArray(rawHistory) ||
    rawHistory.length > ARENA_HISTORY_LIMIT) {
    return undefined;
  }

  const expected = [...empireIds].sort();
  const reputations = value.reputations.map((entry) => {
    if (!isRecord(entry) || typeof entry.empireId !== 'string' || !isReputation(entry.reputation)) {
      return undefined;
    }
    return { empireId: entry.empireId, reputation: entry.reputation } as const;
  });
  if (reputations.some((entry) => entry === undefined)) return undefined;
  const normalizedReputations = reputations.filter(
    (entry): entry is EmpirePveReputationState => entry !== undefined,
  );
  const actual = normalizedReputations.map((entry) => entry.empireId).sort();
  if (actual.length !== expected.length || actual.some((empireId, index) => empireId !== expected[index])) {
    return undefined;
  }

  const activeArenaEntries = rawEntries.map(normalizeArenaEntry);
  const arenaHistory = rawHistory.map(normalizeArenaResult);
  if (activeArenaEntries.some((entry) => entry === undefined) ||
    arenaHistory.some((entry) => entry === undefined)) {
    return undefined;
  }
  const normalizedEntries = activeArenaEntries.filter(
    (entry): entry is ArenaEntry => entry !== undefined,
  );
  const normalizedHistory = arenaHistory.filter(
    (entry): entry is ArenaResult => entry !== undefined,
  );
  const validEmpires = new Set(empireIds);
  if (normalizedEntries.some((entry) => !validEmpires.has(entry.empireId)) ||
    normalizedHistory.some((entry) => !validEmpires.has(entry.empireId)) ||
    new Set(normalizedEntries.map((entry) => entry.empireId)).size !== normalizedEntries.length ||
    new Set(normalizedEntries.map((entry) => entry.fleetId)).size !== normalizedEntries.length) {
    return undefined;
  }

  return {
    reputations: normalizedReputations,
    activeArenaEntries: normalizedEntries,
    arenaHistory: normalizedHistory,
  };
}

export function getPveReputationTier(reputation: number): PveReputationTier {
  assertReputation(reputation, 'PvE reputation');
  if (reputation >= PVE_REPUTATION_THRESHOLDS.warden) return 'warden';
  if (reputation >= PVE_REPUTATION_THRESHOLDS.vanguard) return 'vanguard';
  if (reputation >= PVE_REPUTATION_THRESHOLDS.ranger) return 'ranger';
  return 'recruit';
}

export function getEmpirePveReputation(
  state: PveMetaState,
  empireId: string,
): EmpirePveReputationState | undefined {
  return state.reputations.find((entry) => entry.empireId === empireId);
}

export function awardPveReputation(
  state: PveMetaState,
  empireId: string,
  amount: number,
): PveMetaState {
  assertReputation(amount, 'PvE reputation award');
  if (amount === 0) return state;
  const current = getEmpirePveReputation(state, empireId);
  if (current === undefined) return state;
  const reputation = current.reputation + amount;
  assertReputation(reputation, 'Updated PvE reputation');
  return {
    ...state,
    reputations: state.reputations.map((entry) =>
      entry.empireId === empireId ? { ...entry, reputation } : entry,
    ),
  };
}

export function calculateExpeditionReputationAward(
  outcome: 'salvage' | 'research-cache' | 'hazard' | 'empty',
  reward: { readonly metal: number; readonly crystal: number; readonly gas: number },
): number {
  const recovered = reward.metal + reward.crystal + reward.gas;
  return outcome !== 'empty' && recovered > 0
    ? PVE_REPUTATION_AWARDS.expeditionSuccess
    : 0;
}

export function calculateSpaceObjectReputationAward(
  depletion: number,
  reward: {
    readonly metal: number;
    readonly crystal: number;
    readonly gas: number;
    readonly exoticMatter: number;
  },
): number {
  const recovered = reward.metal + reward.crystal + reward.gas + reward.exoticMatter;
  return depletion > 0 && recovered > 0
    ? PVE_REPUTATION_AWARDS.spaceObjectYield
    : 0;
}

export function calculatePirateReputationAward(
  pirateBaseDestroyed: boolean,
  activePirateHuntTarget: boolean,
): number {
  if (!pirateBaseDestroyed) return 0;
  return PVE_REPUTATION_AWARDS.pirateBaseDestroyed +
    (activePirateHuntTarget ? PVE_REPUTATION_AWARDS.pirateHuntTargetDestroyed : 0);
}
