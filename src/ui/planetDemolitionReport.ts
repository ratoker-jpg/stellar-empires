import type {
  PlanetDemolitionReport,
  PlanetDestructionReport,
} from '../simulation/combat/types';
import type { GameState } from '../simulation/types';

export interface PlanetSiegeEvidence {
  readonly demolition?: PlanetDemolitionReport;
  readonly destruction?: PlanetDestructionReport;
}

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
): PlanetSiegeEvidence | undefined {
  for (const entry of state.eventLog) {
    const payload = entry.event.payload;
    if (payload.type === 'BATTLE_REPORT' && payload.report.id === reportId) {
      const demolition = payload.report.demolition;
      const destruction = payload.report.destruction;
      if (demolition === undefined && destruction === undefined) return undefined;
      return {
        ...(demolition === undefined ? {} : { demolition }),
        ...(destruction === undefined ? {} : { destruction }),
      };
    }
  }
  return undefined;
}

function percent(basisPoints: number): string {
  const value = basisPoints / 100;
  const precision = Number.isInteger(value) ? 0 : basisPoints % 10 === 0 ? 1 : 2;
  return `${value.toFixed(precision)}%`;
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

function appendDestructionEvidence(
  details: HTMLDetailsElement,
  report: PlanetDestructionReport,
): void {
  const heading = document.createElement('h4');
  heading.textContent = report.planetDestroyed
    ? 'Планета уничтожена'
    : report.blockedReason === null
      ? 'Планета выдержала бросок'
      : `Уничтожение заблокировано: ${report.blockedReason}`;
  const chance = document.createElement('p');
  chance.textContent = [
    `сырой шанс ${percent(report.rawChanceBasisPoints)}`,
    `оборона −${percent(report.defenseReductionBasisPoints)}`,
    `разрушители защиты −${percent(report.defenderPlanetDestroyerReductionBasisPoints)}`,
    `Polias −${percent(report.poliasReductionBasisPoints)}`,
    `итог ${percent(report.finalChanceBasisPoints)}`,
    `бросок ${report.rollBasisPoints}`,
  ].join(' · ');
  details.append(heading, chance);

  if (report.attackerContributions.length > 0) {
    const list = document.createElement('ul');
    for (const contribution of report.attackerContributions) {
      const item = document.createElement('li');
      item.textContent = `${contribution.unitId} × ${contribution.count} · оружие ${contribution.weaponLevel} · ${percent(contribution.chanceBasisPointsPerShip)}/корабль · всего ${percent(contribution.totalChanceBasisPoints)}`;
      list.append(item);
    }
    details.append(list);
  }
}

export function createPlanetDemolitionDetails(
  evidence: PlanetSiegeEvidence,
): HTMLDetailsElement {
  const details = document.createElement('details');
  details.className = 'mission-demolition-details';
  const summary = document.createElement('summary');
  const demolished = evidence.demolition?.rolls.filter((roll) => roll.demolished).length ?? 0;
  summary.textContent = evidence.destruction?.planetDestroyed === true
    ? `Осада планеты · уничтожена · снято уровней ${demolished}`
    : `Осада планеты · снято уровней ${demolished}`;
  details.append(summary);

  if (evidence.demolition !== undefined) {
    const model = createPlanetDemolitionViewModel(evidence.demolition);
    const overview = document.createElement('p');
    overview.textContent = model.overview;
    details.append(overview);

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
  }

  if (evidence.destruction !== undefined) {
    appendDestructionEvidence(details, evidence.destruction);
  }
  return details;
}
