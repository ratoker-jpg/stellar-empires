import {
  getFactionIdForEmpire,
  getResearchCatalogForFaction,
  getUnitCatalogForFaction,
} from '../factions/factionMechanicalCatalogRegistry';
import { getFactionMechanicalRoles } from '../factions/factionMechanicalRoles';
import { queueResearch } from '../research/researchCommands';
import type { GameCommand, GameState } from '../types';
import { getUnitDefinition } from '../units/catalog';
import { getLegacyUnitIdsForCanonical } from '../units/unitAliases';
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
        roles.research.propulsion,
        roles.research.battleNetwork,
        roles.research.construction,
        roles.research.energy,
        roles.research.colonization,
      ]
    : [
        roles.research.construction,
        roles.research.energy,
        roles.research.sensors,
        roles.research.propulsion,
        roles.research.logistics,
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
  const ids = [unitId, ...getLegacyUnitIdsForCanonical(unitId)];
  return state.planets
    .filter((planet) => planet.ownerEmpireId === empireId)
    .reduce(
      (total, planet) =>
        total + ids.reduce(
          (subtotal, id) => subtotal + (
            definition?.kind === 'defense'
              ? planet.inventory.defenses[id] ?? 0
              : planet.inventory.ships[id] ?? 0
          ),
          0,
        ),
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
  const ships = roles.ships.complete;
  const defenses = roles.defenses.complete;
  const unitIds = new Set(getUnitCatalogForFaction(factionId).map((definition) => definition.id));
  const productionExists = planets.some((planet) =>
    planet.buildings.some(
      (building) =>
        (building.buildingId === roles.buildings.shipyard ||
          building.buildingId === roles.buildings.defenseIndustry) &&
        building.level > 0,
    ),
  );
  if (!productionExists) {
    return {
      reasonCode: 'production-infrastructure-missing',
      explanation: 'Нет действующей верфи или оборонного производства.',
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
        { id: ships.lightFighter, quantity: 3 },
        { id: ships.interceptor, quantity: 2 },
        { id: defenses.basicTurret, quantity: 2 },
        { id: defenses.laserTurret, quantity: 1 },
        { id: ships.supportShip, quantity: 1 },
        { id: defenses.secondaryShield, quantity: 1 },
        { id: ships.lineBattleship, quantity: 1 },
        { id: defenses.plasmaTurret, quantity: 1 },
        { id: ships.heavyAssault, quantity: 1 },
        { id: ships.bomber, quantity: 1 },
        { id: defenses.laserIonBattery, quantity: 1 },
        { id: defenses.planetaryShield, quantity: 1 },
      ]
    : [
        ...(countUnit(state, empireId, ships.spyProbe) === 0
          ? [{ id: ships.spyProbe, quantity: 1 }]
          : []),
        ...(countUnit(state, empireId, ships.smallTransport) === 0
          ? [{ id: ships.smallTransport, quantity: 1 }]
          : []),
        ...(countUnit(state, empireId, ships.recycler) === 0
          ? [{ id: ships.recycler, quantity: 1 }]
          : []),
        ...(countUnit(state, empireId, ships.largeTransport) === 0
          ? [{ id: ships.largeTransport, quantity: 1 }]
          : []),
        { id: ships.lightFighter, quantity: 2 },
        { id: ships.interceptor, quantity: 1 },
        { id: ships.lineBattleship, quantity: 1 },
        { id: defenses.basicTurret, quantity: 1 },
        { id: defenses.secondaryShield, quantity: 1 },
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
            : `Закрывается дефицит сервисного, боевого или оборонного контура: ${candidate.id}.`,
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
