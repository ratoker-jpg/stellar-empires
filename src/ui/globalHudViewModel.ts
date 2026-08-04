import type { ResourceId } from '../simulation/economy/types';
import {
  getCurrentSolarWarCycle,
  getSolarWarEntryForEmpire,
  getSolarWarResultsForEmpire,
} from '../simulation/endgame/solarWarView';
import { createIncomingFlightContacts } from '../simulation/intelligence/incomingFlights';
import { createUnifiedMissionReports } from '../simulation/reports/missionReports';
import type { GameState } from '../simulation/types';
import {
  getHangarCapacity,
  getHangarUsed,
  getReservedHangar,
  getReservedPopulation,
  getUnitPopulationUsed,
} from '../simulation/units/inventory';

export type HudWarningLevel = 'normal' | 'warning' | 'danger' | 'critical';

export interface HudCapacityViewModel {
  readonly used: number;
  readonly capacity: number;
  readonly percent: number;
  readonly level: HudWarningLevel;
  readonly label: string;
}

export interface HudResourceViewModel extends HudCapacityViewModel {
  readonly id: ResourceId;
  readonly productionPerHour: number;
}

export interface HudEnergyViewModel {
  readonly produced: number;
  readonly consumed: number;
  readonly free: number;
  readonly level: HudWarningLevel;
  readonly label: string;
}

export interface HudSolarWarViewModel {
  readonly cycleIndex: number;
  readonly remainingSeconds: number;
  readonly activeEntry: boolean;
  readonly fleetId: string | null;
  readonly resultCount: number;
}

export interface GlobalHudViewModel {
  readonly planetId: string;
  readonly planetName: string;
  readonly coordinate: string;
  readonly elapsedSeconds: number;
  readonly resources: Readonly<Record<ResourceId, HudResourceViewModel>>;
  readonly energy: HudEnergyViewModel;
  readonly population: HudCapacityViewModel;
  readonly hangar: HudCapacityViewModel;
  readonly queueCount: number;
  readonly activeMissionCount: number;
  readonly incomingContactCount: number;
  readonly reportCount: number;
  readonly solarWar: HudSolarWarViewModel;
}

export function getCapacityWarningLevel(used: number, capacity: number): HudWarningLevel {
  if (capacity <= 0) return used > 0 ? 'critical' : 'normal';
  const percent = (used * 100) / capacity;
  if (percent >= 95) return 'critical';
  if (percent >= 85) return 'danger';
  if (percent >= 70) return 'warning';
  return 'normal';
}

export function warningLevelLabel(level: HudWarningLevel): string {
  switch (level) {
    case 'critical': return 'Критично';
    case 'danger': return 'Опасно';
    case 'warning': return 'Внимание';
    case 'normal': return 'Норма';
  }
}

export function getEnergyWarningLevel(produced: number, consumed: number): HudWarningLevel {
  if (consumed > produced) return 'danger';
  if (produced > 0 && produced - consumed < produced * 0.1) return 'warning';
  return 'normal';
}

function createCapacity(used: number, capacity: number): HudCapacityViewModel {
  const level = getCapacityWarningLevel(used, capacity);
  return {
    used,
    capacity,
    percent: capacity <= 0 ? (used > 0 ? 100 : 0) : Math.min(100, Math.round((used * 100) / capacity)),
    level,
    label: warningLevelLabel(level),
  };
}

function isReportVisibleToPlayer(
  report: ReturnType<typeof createUnifiedMissionReports>[number],
): boolean {
  if (report.kind === 'intelligence' || report.kind === 'solar-war') {
    return report.primaryEmpireId === 'player';
  }
  return report.primaryEmpireId === 'player' || report.secondaryEmpireId === 'player';
}

export function createGlobalHudViewModel(
  state: GameState,
  activePlanetId: string,
): GlobalHudViewModel {
  const playerPlanets = state.planets.filter((planet) => planet.ownerEmpireId === 'player');
  const planet = playerPlanets.find((candidate) => candidate.id === activePlanetId) ?? playerPlanets[0];
  if (planet === undefined) throw new Error('Player planet is missing from the current game state.');

  const resources = Object.fromEntries(
    (['metal', 'crystal', 'gas'] as const).map((id) => {
      const stock = planet.economy.resources[id];
      const capacity = createCapacity(stock.amount, stock.capacity);
      return [id, { id, ...capacity, productionPerHour: stock.productionPerHour }];
    }),
  ) as Readonly<Record<ResourceId, HudResourceViewModel>>;

  const populationUsed = planet.economy.population.used +
    getUnitPopulationUsed(planet) +
    getReservedPopulation(planet);
  const hangarUsed = getHangarUsed(planet) + getReservedHangar(planet);
  const produced = planet.economy.energy.produced;
  const consumed = planet.economy.energy.consumed;
  const energyLevel = getEnergyWarningLevel(produced, consumed);
  const playerResearch = state.research.find((item) => item.empireId === 'player');
  const playerUpgrades = state.shipUpgrades.find((item) => item.empireId === 'player');
  const queueCount = playerPlanets.reduce(
    (total, candidate) => total +
      candidate.buildQueue.length +
      candidate.productionQueues.shipyard.length +
      candidate.productionQueues.defense.length +
      candidate.defense.repairQueue.length,
    0,
  ) + (playerResearch?.queue.length ?? 0) + (playerUpgrades?.queue.length ?? 0);
  const cycle = getCurrentSolarWarCycle(state);
  const activeSolarWarEntry = getSolarWarEntryForEmpire(state, 'player');

  return {
    planetId: planet.id,
    planetName: planet.name,
    coordinate: `${planet.systemId}:${planet.position}`,
    elapsedSeconds: state.clock.elapsedSeconds,
    resources,
    energy: {
      produced,
      consumed,
      free: produced - consumed,
      level: energyLevel,
      label: energyLevel === 'danger'
        ? 'Дефицит'
        : energyLevel === 'warning'
          ? 'Низкий резерв'
          : 'Стабильно',
    },
    population: createCapacity(populationUsed, planet.economy.population.capacity),
    hangar: createCapacity(hangarUsed, getHangarCapacity(planet)),
    queueCount,
    activeMissionCount: state.fleets.filter(
      (fleet) => fleet.empireId === 'player' && fleet.status !== 'stationed',
    ).length,
    incomingContactCount: createIncomingFlightContacts(state, 'player').length,
    reportCount: createUnifiedMissionReports(state).filter(isReportVisibleToPlayer).length,
    solarWar: {
      cycleIndex: cycle.cycleIndex,
      remainingSeconds: Math.max(0, cycle.resolvesAt - state.clock.elapsedSeconds),
      activeEntry: activeSolarWarEntry !== undefined,
      fleetId: activeSolarWarEntry?.fleetId ?? null,
      resultCount: getSolarWarResultsForEmpire(state, 'player').length,
    },
  };
}
