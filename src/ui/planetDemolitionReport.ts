import type { PlanetDemolitionReport } from '../simulation/combat/types';
import type { GameState } from '../simulation/types';

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

export function createPlanetDemolitionDetails(
  report: PlanetDemolitionReport,
): HTMLDetailsElement {
  const details = document.createElement('details');
  details.className = 'mission-demolition-details';
  const summary = document.createElement('summary');
  const demolished = report.rolls.filter((roll) => roll.demolished).length;
  summary.textContent = `Демонтаж планеты · снято уровней ${demolished}`;

  const overview = document.createElement('p');
  overview.textContent = [
    `результат ${report.outcome}`,
    `очки ${report.rawPoints} − ${report.defenseReduction} = ${report.finalPoints}`,
    `шанс ${percent(report.baseChanceBasisPoints)} + командир ${percent(report.commanderBonusBasisPoints)} = ${percent(report.finalChanceBasisPoints)}`,
  ].join(' · ');
  details.append(summary, overview);

  if (report.contributions.length > 0) {
    const contributions = document.createElement('ul');
    for (const contribution of report.contributions) {
      const item = document.createElement('li');
      item.textContent = `${contribution.unitId} × ${contribution.count} · оружие ${contribution.weaponLevel} · ${contribution.pointsPerShip}/корабль · всего ${contribution.totalPoints}`;
      contributions.append(item);
    }
    details.append(contributions);
  }

  if (report.rolls.length > 0) {
    const table = document.createElement('table');
    table.innerHTML = '<thead><tr><th>Здание</th><th>Уровень</th><th>Шанс</th><th>Бросок</th><th>Результат</th></tr></thead>';
    const body = document.createElement('tbody');
    for (const roll of report.rolls) {
      const row = document.createElement('tr');
      const values = [
        roll.buildingId,
        `${roll.levelBefore} → ${roll.levelAfter}`,
        percent(roll.chanceBasisPoints),
        String(roll.rollBasisPoints),
        roll.demolished ? 'уровень снят' : 'без изменений',
      ];
      for (const value of values) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      }
      body.append(row);
    }
    table.append(body);
    details.append(table);
  }

  if (report.cancelledQueueItemIds.length > 0) {
    const cancelled = document.createElement('small');
    cancelled.textContent = `Очереди отменены без возврата: ${report.cancelledQueueItemIds.join(', ')}`;
    details.append(cancelled);
  }
  return details;
}
