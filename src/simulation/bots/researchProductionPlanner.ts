import {
  getFactionIdForEmpire,
  getResearchCatalogForFaction,
  getUnitCatalogForFaction,
} from '../factions/factionMechanicalCatalogRegistry';
import { getFactionMechanicalRoles } from '../factions/factionMechanicalRoles';
import { queueResearch } from '../research/researchCommands';
import type { GameCommand, GameState } from '../types';
import { getUnitDefinition } from '../units/catalog';
import { queueUnitBatch } from '../units/productionCommands';
import { createBotPerception } from './perception';

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
  const factionId = getFactionIdForEmpire(state, empireId);
  const roles = getFactionMechanicalRoles(factionId);
  const catalog = getResearchCatalogForFaction(factionId);
  const laboratoryExists = planets.some((planet) =>
    planet.buildings.some(
      (building) =>
        building.buildingId === roles.buildings.laboratory && building.level > 0,
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
        roles.research.weapons,
        roles.research.protection,
        roles.research.sensors,
        roles.research.construction,
        roles.research.energy,
        roles.research.propulsion,
        roles.research.colonization,
      ]
    : [
        roles.research.construction,
        roles.research.energy,
        roles.research.sensors,
        roles.research.propulsion,
        roles.research.protection,
        roles.research.weapons,
        roles.research.colonization,
      ];

  for (const technologyId of priority) {
    if (!catalog.some((definition) => definition.id === technologyId)) continue;
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
  const definition = getUnitDefinition(unitId);
  return state.planets
    .filter((planet) => planet.ownerEmpireId === empireId)
    .reduce(
      (total, planet) =>
        total +
        (definition?.kind === 'defense'
          ? planet.inventory.defenses[unitId] ?? 0
          : planet.inventory.ships[unitId] ?? 0),
      0,
    );
}

function chooseProduction(
  state: GameState,
  empireId: string,
  threatened: boolean,
): BotPlannerDecision {
  const planets = state.planets
    .filter((planet) => planet.ownerEmpireId === empireId)
    .sort((left, right) => left.id.localeCompare(right.id));
  const factionId = getFactionIdForEmpire(state, empireId);
  const roles = getFactionMechanicalRoles(factionId);
  const unitIds = new Set(getUnitCatalogForFaction(factionId).map((definition) => definition.id));
  const productionExists = planets.some((planet) =>
    planet.buildings.some(
      (building) => building.buildingId === roles.buildings.shipyard && building.level > 0,
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
        { id: roles.ships.fighter, quantity: 3 },
        { id: roles.defenses.light, quantity: 2 },
        { id: roles.ships.frigate, quantity: 1 },
        { id: roles.defenses.shield, quantity: 1 },
        { id: roles.ships.scout, quantity: 1 },
      ]
    : [
        ...(countUnit(state, empireId, roles.ships.scout) === 0
          ? [{ id: roles.ships.scout, quantity: 1 }]
          : []),
        ...(countUnit(state, empireId, roles.ships.transport) === 0
          ? [{ id: roles.ships.transport, quantity: 1 }]
          : []),
        ...(countUnit(state, empireId, roles.ships.recycler) === 0
          ? [{ id: roles.ships.recycler, quantity: 1 }]
          : []),
        { id: roles.ships.fighter, quantity: 2 },
        { id: roles.defenses.light, quantity: 1 },
      ];

  for (const candidate of priority) {
    if (!unitIds.has(candidate.id)) continue;
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
