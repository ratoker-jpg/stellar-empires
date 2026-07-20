import type { ResourceCost } from '../economy/types';
import type { GameState } from '../types';
import { PIRATE_EMPIRE_ID } from '../pve/neutralForces';

export type MissionReportKind = 'battle' | 'expedition' | 'space-object' | 'world-event';
export type MissionReportMode = 'pve' | 'pvp' | 'system';
export type MissionReportOutcome = 'success' | 'failure' | 'draw' | 'completed' | 'recovered';

export interface MissionReportReward extends ResourceCost {
  readonly exoticMatter: number;
}

export interface UnifiedMissionReport {
  readonly id: string;
  readonly resolvedAt: number;
  readonly kind: MissionReportKind;
  readonly mode: MissionReportMode;
  readonly title: string;
  readonly summary: string;
  readonly targetId: string;
  readonly primaryEmpireId: string | null;
  readonly secondaryEmpireId: string | null;
  readonly outcome: MissionReportOutcome;
  readonly reward: MissionReportReward;
  readonly primaryLosses: Readonly<Record<string, number>>;
  readonly secondaryLosses: Readonly<Record<string, number>>;
  readonly threatMultiplierPermille: number;
  readonly rewardMultiplierPermille: number;
}

export interface MissionReportQuery {
  readonly kind?: MissionReportKind | 'all';
  readonly mode?: MissionReportMode | 'all';
  readonly empireId?: string | 'all';
  readonly search?: string;
}

export interface MissionReportSummary {
  readonly total: number;
  readonly pve: number;
  readonly pvp: number;
  readonly system: number;
  readonly successes: number;
  readonly rewards: MissionReportReward;
  readonly losses: number;
}

export interface EmpirePvePvpComparison {
  readonly empireId: string;
  readonly pveOperations: number;
  readonly pveSuccesses: number;
  readonly pvpBattles: number;
  readonly pvpWins: number;
  readonly reward: MissionReportReward;
  readonly losses: number;
}

const ZERO_REWARD: MissionReportReward = {
  metal: 0,
  crystal: 0,
  gas: 0,
  exoticMatter: 0,
};

function unitLosses(
  initial: Readonly<Record<string, number>>,
  remaining: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> {
  return Object.fromEntries(
    Object.entries(initial)
      .map(([unitId, count]) => [unitId, Math.max(0, count - (remaining[unitId] ?? 0))] as const)
      .filter(([, count]) => count > 0),
  );
}

function totalUnits(units: Readonly<Record<string, number>>): number {
  return Object.values(units).reduce((total, count) => total + count, 0);
}

function addReward(
  left: MissionReportReward,
  right: MissionReportReward,
): MissionReportReward {
  return {
    metal: left.metal + right.metal,
    crystal: left.crystal + right.crystal,
    gas: left.gas + right.gas,
    exoticMatter: left.exoticMatter + right.exoticMatter,
  };
}

function battleOutcome(
  winner: 'attacker' | 'defender' | 'draw',
): MissionReportOutcome {
  if (winner === 'attacker') return 'success';
  if (winner === 'defender') return 'failure';
  return 'draw';
}

function createEventReports(state: GameState): UnifiedMissionReport[] {
  const reports: UnifiedMissionReport[] = [];
  for (const entry of state.eventLog) {
    const payload = entry.event.payload;
    if (payload.type === 'BATTLE_REPORT') {
      const report = payload.report;
      const mode = report.mode ?? (
        report.attackerEmpireId === PIRATE_EMPIRE_ID || report.defenderEmpireId === PIRATE_EMPIRE_ID
          ? 'pve'
          : 'pvp'
      );
      reports.push({
        id: report.id,
        resolvedAt: entry.executedAt,
        kind: 'battle',
        mode,
        title: mode === 'pve' ? 'Бой с нейтральными силами' : 'Бой империй',
        summary: `${report.attackerEmpireId} → ${report.defenderEmpireId} · ${report.winner}`,
        targetId: report.targetPlanetId,
        primaryEmpireId: report.attackerEmpireId,
        secondaryEmpireId: report.defenderEmpireId,
        outcome: battleOutcome(report.winner),
        reward: {
          metal: report.plunderedCargo?.metal ?? 0,
          crystal: report.plunderedCargo?.crystal ?? 0,
          gas: report.plunderedCargo?.gas ?? 0,
          exoticMatter: 0,
        },
        primaryLosses: unitLosses(report.attackerInitial, report.attackerRemaining),
        secondaryLosses: unitLosses(report.defenderInitial, report.defenderRemaining),
        threatMultiplierPermille: report.threatMultiplierPermille ?? 1_000,
        rewardMultiplierPermille: report.rewardMultiplierPermille ?? 1_000,
      });
      continue;
    }
    if (payload.type === 'EXPEDITION_RESOLVE') {
      const report = payload.report;
      reports.push({
        id: report.id,
        resolvedAt: entry.executedAt,
        kind: 'expedition',
        mode: 'pve',
        title: 'Дальняя экспедиция',
        summary: `${report.outcome} · ${report.narrative}`,
        targetId: report.targetGalaxyPlanetId,
        primaryEmpireId: report.empireId,
        secondaryEmpireId: null,
        outcome: report.outcome === 'empty' ? 'failure' : 'success',
        reward: { ...report.reward, exoticMatter: 0 },
        primaryLosses: report.losses,
        secondaryLosses: {},
        threatMultiplierPermille: 1_000,
        rewardMultiplierPermille: report.rewardMultiplierPermille ?? 1_000,
      });
      continue;
    }
    if (payload.type === 'SPACE_OBJECT_MISSION_RESOLVE') {
      const report = payload.report;
      reports.push({
        id: report.id,
        resolvedAt: entry.executedAt,
        kind: 'space-object',
        mode: 'pve',
        title: 'Операция на космическом объекте',
        summary: report.narrative,
        targetId: report.objectId,
        primaryEmpireId: report.empireId,
        secondaryEmpireId: null,
        outcome: report.depletion > 0 ? 'success' : 'failure',
        reward: { ...report.reward },
        primaryLosses: report.losses,
        secondaryLosses: {},
        threatMultiplierPermille: 1_000,
        rewardMultiplierPermille: report.rewardMultiplierPermille ?? 1_000,
      });
    }
  }
  return reports;
}

function createWorldEventReports(state: GameState): UnifiedMissionReport[] {
  return state.worldEvents.history.map((event): UnifiedMissionReport => ({
    id: event.id,
    resolvedAt: event.completedAt,
    kind: 'world-event',
    mode: 'system',
    title: 'Мировое событие',
    summary: `${event.definitionId} · ${event.completion}`,
    targetId: event.targetId,
    primaryEmpireId: null,
    secondaryEmpireId: null,
    outcome: event.completion,
    reward: ZERO_REWARD,
    primaryLosses: {},
    secondaryLosses: {},
    threatMultiplierPermille: 1_000,
    rewardMultiplierPermille: 1_000,
  }));
}

export function createUnifiedMissionReports(
  state: GameState,
): readonly UnifiedMissionReport[] {
  return [...createEventReports(state), ...createWorldEventReports(state)]
    .sort((left, right) => right.resolvedAt - left.resolvedAt || left.id.localeCompare(right.id));
}

export function filterMissionReports(
  reports: readonly UnifiedMissionReport[],
  query: MissionReportQuery,
): readonly UnifiedMissionReport[] {
  const kind = query.kind ?? 'all';
  const mode = query.mode ?? 'all';
  const empireId = query.empireId ?? 'all';
  const search = query.search?.trim().toLocaleLowerCase('ru-RU') ?? '';
  return reports.filter((report) => {
    if (kind !== 'all' && report.kind !== kind) return false;
    if (mode !== 'all' && report.mode !== mode) return false;
    if (
      empireId !== 'all' &&
      report.primaryEmpireId !== empireId &&
      report.secondaryEmpireId !== empireId
    ) {
      return false;
    }
    if (search.length > 0) {
      const haystack = `${report.title} ${report.summary} ${report.targetId} ${report.primaryEmpireId ?? ''} ${report.secondaryEmpireId ?? ''}`
        .toLocaleLowerCase('ru-RU');
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export function summarizeMissionReports(
  reports: readonly UnifiedMissionReport[],
): MissionReportSummary {
  return reports.reduce<MissionReportSummary>(
    (summary, report) => ({
      total: summary.total + 1,
      pve: summary.pve + (report.mode === 'pve' ? 1 : 0),
      pvp: summary.pvp + (report.mode === 'pvp' ? 1 : 0),
      system: summary.system + (report.mode === 'system' ? 1 : 0),
      successes: summary.successes + (report.outcome === 'success' ? 1 : 0),
      rewards: addReward(summary.rewards, report.reward),
      losses: summary.losses + totalUnits(report.primaryLosses),
    }),
    {
      total: 0,
      pve: 0,
      pvp: 0,
      system: 0,
      successes: 0,
      rewards: ZERO_REWARD,
      losses: 0,
    },
  );
}

export function compareEmpirePvePvp(
  state: GameState,
): readonly EmpirePvePvpComparison[] {
  const reports = createUnifiedMissionReports(state);
  return state.empires.map((empireId): EmpirePvePvpComparison => {
    const related = reports.filter(
      (report) => report.primaryEmpireId === empireId || report.secondaryEmpireId === empireId,
    );
    const reward = related
      .filter((report) => report.primaryEmpireId === empireId)
      .reduce((total, report) => addReward(total, report.reward), ZERO_REWARD);
    const losses = related.reduce((total, report) => {
      if (report.primaryEmpireId === empireId) return total + totalUnits(report.primaryLosses);
      if (report.secondaryEmpireId === empireId) return total + totalUnits(report.secondaryLosses);
      return total;
    }, 0);
    return {
      empireId,
      pveOperations: related.filter((report) => report.mode === 'pve').length,
      pveSuccesses: related.filter(
        (report) =>
          report.mode === 'pve' &&
          report.primaryEmpireId === empireId &&
          report.outcome === 'success',
      ).length,
      pvpBattles: related.filter((report) => report.mode === 'pvp').length,
      pvpWins: related.filter(
        (report) =>
          report.mode === 'pvp' &&
          report.primaryEmpireId === empireId &&
          report.outcome === 'success',
      ).length,
      reward,
      losses,
    };
  });
}
