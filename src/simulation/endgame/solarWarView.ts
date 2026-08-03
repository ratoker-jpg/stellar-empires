import type { FleetState } from '../fleets/types';
import type { GameState } from '../types';
import { getUnitDefinition } from '../units/catalog';
import { getSolarWarCycle } from './solarWar';
import type {
  SolarWarCycle,
  SolarWarEntry,
  SolarWarOutcome,
  SolarWarParticipationKind,
  SolarWarResult,
} from './types';

export interface SolarWarPublicResult {
  readonly id: string;
  readonly cycleId: string;
  readonly cycleIndex: number;
  readonly empireId: string;
  readonly participationKind: SolarWarParticipationKind;
  readonly participationId: string;
  readonly allianceId: string | null;
  readonly resolvedAt: number;
  readonly outcome: SolarWarOutcome;
  readonly score: number;
}

export interface SolarWarScoreboardRow {
  readonly participationKind: SolarWarParticipationKind;
  readonly participationId: string;
  readonly allianceId: string | null;
  readonly score: number;
  readonly entries: number;
  readonly victories: number;
  readonly draws: number;
  readonly defeats: number;
}

function participation(state: GameState) {
  return state.endgameParticipation;
}

function isCombatFleet(fleet: FleetState): boolean {
  return Object.entries(fleet.ships).some(([unitId, count]) => {
    const definition = getUnitDefinition(unitId);
    return count > 0 && definition?.kind === 'ship' && definition.stats.attack > 0;
  });
}

export function getCurrentSolarWarCycle(
  state: Pick<GameState, 'seed' | 'clock'>,
): SolarWarCycle {
  return getSolarWarCycle(state);
}

export function getSolarWarEntryForEmpire(
  state: GameState,
  empireId: string,
): SolarWarEntry | undefined {
  return participation(state)?.solarWar.activeEntries.find(
    (entry) => entry.empireId === empireId,
  );
}

export function getEligibleSolarWarFleets(
  state: GameState,
  empireId: string,
): readonly FleetState[] {
  return state.fleets.filter((fleet) => {
    if (fleet.empireId !== empireId ||
      fleet.status !== 'stationed' ||
      fleet.location.type !== 'planet' ||
      fleet.mission !== null ||
      !isCombatFleet(fleet)) {
      return false;
    }
    return state.planets.some(
      (planet) => planet.id === fleet.location.planetId && planet.ownerEmpireId === empireId,
    );
  });
}

function toPublicResult(result: SolarWarResult): SolarWarPublicResult {
  return {
    id: result.id,
    cycleId: result.cycleId,
    cycleIndex: result.cycleIndex,
    empireId: result.empireId,
    participationKind: result.participationKind,
    participationId: result.participationId,
    allianceId: result.allianceId,
    resolvedAt: result.resolvedAt,
    outcome: result.outcome,
    score: result.score,
  };
}

export function getSolarWarPublicResults(
  state: GameState,
  cycleIndex?: number,
): readonly SolarWarPublicResult[] {
  return (participation(state)?.solarWar.history ?? [])
    .filter((result) => cycleIndex === undefined || result.cycleIndex === cycleIndex)
    .map(toPublicResult);
}

export function getSolarWarResultsForEmpire(
  state: GameState,
  empireId: string,
): readonly SolarWarResult[] {
  return (participation(state)?.solarWar.history ?? []).filter(
    (result) => result.empireId === empireId,
  );
}

export function getSolarWarScoreboard(
  state: GameState,
  cycleIndex: number,
): readonly SolarWarScoreboardRow[] {
  const rows = new Map<string, SolarWarScoreboardRow>();
  for (const result of participation(state)?.solarWar.history ?? []) {
    if (result.cycleIndex !== cycleIndex) continue;
    const current = rows.get(result.participationId) ?? {
      participationKind: result.participationKind,
      participationId: result.participationId,
      allianceId: result.allianceId,
      score: 0,
      entries: 0,
      victories: 0,
      draws: 0,
      defeats: 0,
    };
    rows.set(result.participationId, {
      ...current,
      score: current.score + result.score,
      entries: current.entries + 1,
      victories: current.victories + (result.outcome === 'victory' ? 1 : 0),
      draws: current.draws + (result.outcome === 'draw' ? 1 : 0),
      defeats: current.defeats + (result.outcome === 'defeat' ? 1 : 0),
    });
  }
  return [...rows.values()].sort(
    (left, right) => right.score - left.score ||
      left.participationId.localeCompare(right.participationId),
  );
}
