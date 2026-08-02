export type PveReputationTier = 'recruit' | 'ranger' | 'vanguard' | 'warden';

export interface EmpirePveReputationState {
  readonly empireId: string;
  readonly reputation: number;
}

export interface PveMetaState {
  readonly reputations: readonly EmpirePveReputationState[];
  readonly activeArenaEntries: readonly [];
}

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

function assertReputation(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative safe integer.`);
  }
}

export function createInitialPveMetaState(
  empireIds: readonly string[],
): PveMetaState {
  return {
    reputations: empireIds.map((empireId) => ({ empireId, reputation: 0 })),
    activeArenaEntries: [],
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
