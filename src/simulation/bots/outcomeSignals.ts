import type { BattleReport } from '../combat/types';
import { PIRATE_EMPIRE_ID } from '../pve/neutralForces';
import type { ExecutedGameEvent, GameState } from '../types';

export const RECENT_BOT_BATTLE_WINDOW = 3;

export interface RecentBotBattleOutcomeSignal {
  readonly consideredBattles: number;
  readonly wins: number;
  readonly losses: number;
  readonly draws: number;
  readonly recoveryBias: 'none' | 'loss-dominant';
}

type RelevantBattle = {
  readonly entry: ExecutedGameEvent;
  readonly report: BattleReport;
};

function relevantOwnPvpBattle(
  entry: ExecutedGameEvent,
  empireId: string,
): RelevantBattle | null {
  if (entry.event.payload.type !== 'BATTLE_REPORT') return null;
  const report = entry.event.payload.report;
  const mode = report.mode ?? (
    report.attackerEmpireId === PIRATE_EMPIRE_ID ||
    report.defenderEmpireId === PIRATE_EMPIRE_ID
      ? 'pve'
      : 'pvp'
  );
  if (mode !== 'pvp') return null;
  if (
    report.attackerEmpireId !== empireId &&
    report.defenderEmpireId !== empireId
  ) {
    return null;
  }
  return { entry, report };
}

function compareRelevantBattles(left: RelevantBattle, right: RelevantBattle): number {
  return (
    left.entry.event.executeAt - right.entry.event.executeAt ||
    left.entry.event.sequence - right.entry.event.sequence ||
    left.report.id.localeCompare(right.report.id)
  );
}

function classifyBattle(
  report: BattleReport,
  empireId: string,
): 'win' | 'loss' | 'draw' {
  if (report.winner === 'draw') return 'draw';
  const ownSide = report.attackerEmpireId === empireId ? 'attacker' : 'defender';
  return report.winner === ownSide ? 'win' : 'loss';
}

export function deriveRecentBotBattleOutcomeSignal(
  state: GameState,
  empireId: string,
): RecentBotBattleOutcomeSignal {
  const recent = state.eventLog
    .map((entry) => relevantOwnPvpBattle(entry, empireId))
    .filter((battle): battle is RelevantBattle => battle !== null)
    .sort(compareRelevantBattles)
    .slice(-RECENT_BOT_BATTLE_WINDOW);

  let wins = 0;
  let losses = 0;
  let draws = 0;
  for (const battle of recent) {
    const outcome = classifyBattle(battle.report, empireId);
    if (outcome === 'win') wins += 1;
    else if (outcome === 'loss') losses += 1;
    else draws += 1;
  }

  return {
    consideredBattles: recent.length,
    wins,
    losses,
    draws,
    recoveryBias: losses > wins ? 'loss-dominant' : 'none',
  };
}
