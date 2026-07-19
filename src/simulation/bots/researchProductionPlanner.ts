import { createBotPerception } from './perception';
import { AEGIS_RESEARCH_CATALOG } from '../research/catalog';
import { queueResearch } from '../research/researchCommands';
import { AEGIS_UNIT_CATALOG } from '../units/catalog';
import { queueUnitBatch } from '../units/productionCommands';
import type { GameCommand, GameState } from '../types';

export type BotResearchReasonCode =
  | 'research-queue-busy'
  | 'research-infrastructure-missing'
  | 'research-selected'
  | 'research-unavailable';

export type BotProductionReasonCode =
  | 'production-queues-busy'
  | 'production-infrastructure-missing'
  | 'production-selected'
  | 'production-unavailable';

export interface BotPlannerDecision {
  readonly reasonCode: BotResearchReasonCode | BotProductionReasonCode;
  readonly explanation: string;
  readonly command: GameCommand | null;
}

export interface BotResearchProductionPlan {
  readonly empireId: string;
  readonly research: BotPlannerDecision;
  readonly production: BotPlannerDecision;
}

function chooseResearch(
  state: GameState,
  empireId: string,
  threatened: boolean,
): BotPlannerDecision {
  const research = state.research.find((candidate) => candidate.empireId === empireId);
  if (research?.queue.length) {
    return {
      reasonCode: 'research-queue-busy',
      explanation: 'Глобальная исследовательская очередь уже занята.',
      command: null,
    };
  }

  const planets = state.planets
    .filter((planet) => planet.ownerEmpireId === empireId)
    .sort((left, right) => left.id.localeCompare(right.id));
  const laboratoryExists = planets.some((planet) =>
    planet.buildings.some(
      (building) =>
        building.buildingId === 'building.aegis.research-lab' && building.level > 0,
    ),
  );
  if (!laboratoryExists) {
    return {
      reasonCode: 'research-infrastructure-missing',
      explanation: 'Нет действующей исследовательской лаборатории.',
      command: null,
    };
  }

  const priority = threatened
    ? [
        'technology.aegis.weapons',
        'technology.aegis.armor',
        'technology.aegis.sensors',
        'technology.aegis.construction',
        'technology.aegis.energy',
        'technology.aegis.propulsion',
        'technology.aegis.colonization',
      ]
    : [
        'technology.aegis.construction',
        'technology.aegis.energy',
        'technology.aegis.sensors',
        'technology.aegis.propulsion',
        'technology.aegis.armor',
        'technology.aegis.weapons',
        'technology.aegis.colonization',
      ];

  for (const technologyId of priority) {
    if (!AEGIS_RESEARCH_CATALOG.some((definition) => definition.id === technologyId)) {
      continue;
    }
    for (const planet of planets) {
      const command: Extract<GameCommand, { readonly type: 'QUEUE_RESEARCH' }> = {
        type: 'QUEUE_RESEARCH',
        empireId,
        planetId: planet.id,
        technologyId,
      };
      if (queueResearch(state, command).ok) {
        return {
          reasonCode: 'research-selected',
          explanation: threatened
            ? `Обнаружена угроза: приоритет исследованию ${technologyId}.`
            : `Выбрано доступное исследование экономического цикла: ${technologyId}.`,
          command,
        };
      }
    }
  }

  return {
    reasonCode: 'research-unavailable',
    explanation: 'Нет доступного и оплачиваемого исследования.',
    command: null,
  };
}

function countUnit(state: GameState, empireId: string, unitId: string): number {
  return state.planets
    .filter((planet) => planet.ownerEmpireId === empireId)
    .reduce((total, planet) => {
      const definition = AEGIS_UNIT_CATALOG.find((candidate) => candidate.id === unitId);
      if (definition?.kind === 'defense') {
        return total + (planet.inventory.defenses[unitId] ?? 0);
      }
      return total + (planet.inventory.ships[unitId] ?? 0);
    }, 0);
}

function chooseProduction(
  state: GameState,
  empireId: string,
  threatened: boolean,
): BotPlannerDecision {
  const planets = state.planets
    .filter((planet) => planet.ownerEmpireId === empireId)
    .sort((left, right) => left.id.localeCompare(right.id));
  const productionExists = planets.some((planet) =>
    planet.buildings.some(
      (building) => building.buildingId === 'building.aegis.shipyard' && building.level > 0,
    ),
  );
  if (!productionExists) {
    return {
      reasonCode: 'production-infrastructure-missing',
      explanation: 'Нет действующей верфи.',
      command: null,
    };
  }
  if (
    planets.every(
      (planet) =>
        planet.productionQueues.shipyard.length > 0 &&
        planet.productionQueues.defense.length > 0,
    )
  ) {
    return {
      reasonCode: 'production-queues-busy',
      explanation: 'Все производственные очереди империи заняты.',
      command: null,
    };
  }

  const priority: readonly { readonly id: string; readonly quantity: number }[] = threatened
    ? [
        { id: 'ship.aegis.fighter', quantity: 3 },
        { id: 'defense.aegis.gun-battery', quantity: 2 },
        { id: 'ship.aegis.frigate', quantity: 1 },
        { id: 'defense.aegis.shield-grid', quantity: 1 },
        { id: 'ship.aegis.scout', quantity: 1 },
      ]
    : [
        ...(countUnit(state, empireId, 'ship.aegis.scout') === 0
          ? [{ id: 'ship.aegis.scout', quantity: 1 }]
          : []),
        ...(countUnit(state, empireId, 'ship.aegis.cargo') === 0
          ? [{ id: 'ship.aegis.cargo', quantity: 1 }]
          : []),
        ...(countUnit(state, empireId, 'ship.aegis.recycler') === 0
          ? [{ id: 'ship.aegis.recycler', quantity: 1 }]
          : []),
        { id: 'ship.aegis.fighter', quantity: 2 },
        { id: 'defense.aegis.gun-battery', quantity: 1 },
      ];

  for (const candidate of priority) {
    for (const planet of planets) {
      const command: Extract<GameCommand, { readonly type: 'QUEUE_UNIT_BATCH' }> = {
        type: 'QUEUE_UNIT_BATCH',
        empireId,
        planetId: planet.id,
        unitId: candidate.id,
        quantity: candidate.quantity,
      };
      if (queueUnitBatch(state, command).ok) {
        return {
          reasonCode: 'production-selected',
          explanation: threatened
            ? `Разведка показывает угрозу: заказан ${candidate.id}.`
            : `Закрывается дефицит сервисного или базового флота: ${candidate.id}.`,
          command,
        };
      }
    }
  }

  return {
    reasonCode: 'production-unavailable',
    explanation: 'Нет доступного и оплачиваемого производственного заказа.',
    command: null,
  };
}

export function planBotResearchAndProduction(
  state: GameState,
  empireId: string,
): BotResearchProductionPlan {
  const perception = createBotPerception(state, empireId);
  const threatened =
    perception.alerts.length > 0 ||
    perception.foreignPlanets.some(
      (planet) => planet.freshness === 'current' && planet.snapshot.ownerEmpireId !== null,
    );
  return {
    empireId,
    research: chooseResearch(state, empireId, threatened),
    production: chooseProduction(state, empireId, threatened),
  };
}

export function planAllBotResearchAndProduction(
  state: GameState,
): readonly BotResearchProductionPlan[] {
  return state.empires
    .filter((empireId) => empireId !== 'player')
    .map((empireId) => planBotResearchAndProduction(state, empireId));
}
