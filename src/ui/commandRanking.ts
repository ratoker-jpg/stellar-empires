import { FACTION_SHOWCASES } from '../assets/factionShowcase';
import type { FactionId } from '../simulation/planet/types';
import { createUnifiedMissionReports } from '../simulation/reports/missionReports';
import type { GameState } from '../simulation/types';

export interface EmpireRankingEntry {
  readonly rank: number;
  readonly empireId: string;
  readonly factionId: FactionId;
  readonly factionName: string;
  readonly doctrine: string;
  readonly score: number;
  readonly colonies: number;
  readonly resourceStock: number;
  readonly productionPerHour: number;
  readonly buildingLevels: number;
  readonly researchLevels: number;
  readonly units: number;
  readonly fleets: number;
  readonly victories: number;
}

const FACTION_COPY = new Map(
  FACTION_SHOWCASES.map((faction) => [faction.id, faction] as const),
);

function sumRecord(record: Readonly<Record<string, number>>): number {
  return Object.values(record).reduce((total, value) => total + value, 0);
}

function getFactionId(state: GameState, empireId: string): FactionId {
  return state.planets.find((planet) => planet.ownerEmpireId === empireId)?.factionId ?? 'aegis';
}

function countVictories(state: GameState, empireId: string): number {
  return createUnifiedMissionReports(state).filter((report) => {
    if (report.primaryEmpireId === empireId && report.outcome === 'success') return true;
    return (
      report.kind === 'battle' &&
      report.secondaryEmpireId === empireId &&
      report.outcome === 'failure'
    );
  }).length;
}

function createRawEntry(state: GameState, empireId: string): Omit<EmpireRankingEntry, 'rank'> {
  const planets = state.planets.filter((planet) => planet.ownerEmpireId === empireId);
  const factionId = getFactionId(state, empireId);
  const faction = FACTION_COPY.get(factionId);
  const resourceStock = planets.reduce(
    (total, planet) =>
      total +
      Object.values(planet.economy.resources).reduce(
        (resourceTotal, stock) => resourceTotal + stock.amount,
        0,
      ),
    0,
  );
  const productionPerHour = planets.reduce(
    (total, planet) =>
      total +
      Object.values(planet.economy.resources).reduce(
        (resourceTotal, stock) => resourceTotal + stock.productionPerHour,
        0,
      ),
    0,
  );
  const buildingLevels = planets.reduce(
    (total, planet) =>
      total + planet.buildings.reduce((levelTotal, building) => levelTotal + building.level, 0),
    0,
  );
  const researchLevels = sumRecord(
    state.research.find((research) => research.empireId === empireId)?.levels ?? {},
  );
  const units = planets.reduce(
    (total, planet) =>
      total + sumRecord(planet.inventory.ships) + sumRecord(planet.inventory.defenses),
    0,
  );
  const fleets = state.fleets.filter((fleet) => fleet.empireId === empireId).length;
  const victories = countVictories(state, empireId);
  const score =
    planets.length * 1_000 +
    Math.floor(resourceStock / 100) +
    productionPerHour * 2 +
    buildingLevels * 250 +
    researchLevels * 300 +
    units * 40 +
    fleets * 120 +
    victories * 500;

  return {
    empireId,
    factionId,
    factionName: faction?.name ?? factionId.toUpperCase(),
    doctrine: faction?.doctrine ?? 'Неизвестная доктрина',
    score,
    colonies: planets.length,
    resourceStock,
    productionPerHour,
    buildingLevels,
    researchLevels,
    units,
    fleets,
    victories,
  };
}

export function createEmpireRanking(state: GameState): readonly EmpireRankingEntry[] {
  return state.empires
    .map((empireId) => createRawEntry(state, empireId))
    .sort((left, right) => right.score - left.score || left.empireId.localeCompare(right.empireId))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function createPlayerCommandProfile(state: GameState): EmpireRankingEntry {
  const player = createEmpireRanking(state).find((entry) => entry.empireId === 'player');
  if (player === undefined) throw new Error('Player ranking entry is missing.');
  return player;
}
