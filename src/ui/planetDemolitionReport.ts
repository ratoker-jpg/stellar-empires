import type { PlanetDemolitionReport } from '../simulation/combat/types';
import type { GameState } from '../simulation/types';

export interface PlanetDemolitionRollViewModel {
  readonly buildingId: string;
  readonly level: string;
  readonly chance: string;
  readonly roll: string;
  readonly result: string;
}

export interface PlanetDemolitionViewModel {
  readonly summary: string;
  readonly overview: string;
  readonly contributions: readonly string[];
  readonly rolls: readonly PlanetDemolitionRollViewModel[];
  readonly cancelledQueues: string | null;
}

export function findPlanetDemolitionReport(
  state: GameState,
  reportId: string,
): PlanetDemolitionReport | undefined {
  for (const entry of state.eventLog) {
    const payload = entry.event.payload;
    if (payload.type === 'BATTLE_REPORT' && payload.report.id === reportId) {
      return payload.report.demolition;
    }
  }
  return undefined;
}

function percent(basisPoints: number): string {
  return `${(basisPoints / 100).toFixed(0)}%`;
}

export function createPlanetDemolitionViewModel(
  report: PlanetDemolitionReport,
): PlanetDemolitionViewModel {
  const demolished = report.rolls.filter((roll) => roll.demolished).length;
  return {
    summary: `Демонтаж планеты · снято уровней ${demolished}`,
    overview: [
      `результат ${report.outcome}`,
      `очки ${report.rawPoints} − ${report.defenseReduction} = ${report.finalPoints}`,
      `шанс ${percent(report.baseChanceBasisPoints)} + командир ${percent(report.commanderBonusBasisPoints)} = ${percent(report.finalChanceBasisPoints)}`,
    ].join(' · '),
    contributions: report.contributions.map(
      (contribution) =>
        `${contribution.unitId} × ${contribution.count} · оружие ${contribution.weaponLevel} · ${contribution.pointsPerShip}/корабль · всего ${contribution.totalPoints}`,
    ),
    rolls: report.rolls.map((roll) => ({
      buildingId: roll.buildingId,
      level: `${roll.levelBefore} → ${roll.levelAfter}`,
      chance: percent(roll.chanceBasisPoints),
      roll: String(roll.rollBasisPoints),
      result: roll.demolished ? 'уровень снят' : 'без изменений',
    })),
    cancelledQueues: report.cancelledQueueItemIds.length > 0
      ? `Очереди отменены без возврата: ${report.cancelledQueueItemIds.join(', ')}`
      : null,
  };
}

export function createPlanetDemolitionDetails(
  report: PlanetDemolitionReport,
): HTMLDetailsElement {
  const model = createPlanetDemolitionViewModel(report);
  const details = document.createElement('details');
  details.className = 'mission-demolition-details';
  const summary = document.createElement('summary');
  summary.textContent = model.summary;
  const overview = document.createElement('p');
  overview.textContent = model.overview;
  details.append(summary, overview);

  if (model.contributions.length > 0) {
    const contributions = document.createElement('ul');
    for (const contribution of model.contributions) {
      const item = document.createElement('li');
      item.textContent = contribution;
      contributions.append(item);
    }
    details.append(contributions);
  }

  if (model.rolls.length > 0) {
    const table = document.createElement('table');
    table.innerHTML = '<thead><tr><th>Здание</th><th>Уровень</th><th>Шанс</th><th>Бросок</th><th>Результат</th></tr></thead>';
    const body = document.createElement('tbody');
    for (const roll of model.rolls) {
      const row = document.createElement('tr');
      for (const value of [
        roll.buildingId,
        roll.level,
        roll.chance,
        roll.roll,
        roll.result,
      ]) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      }
      body.append(row);
    }
    table.append(body);
    details.append(table);
  }

  if (model.cancelledQueues !== null) {
    const cancelled = document.createElement('small');
    cancelled.textContent = model.cancelledQueues;
    details.append(cancelled);
  }
  return details;
}
