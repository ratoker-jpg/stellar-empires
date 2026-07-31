import { getEmpireCommandState } from '../command/commandDoctrine';
import {
  getCommanderShipCatalog,
  getFactionIdForEmpire,
  getUnitCatalogForFaction,
} from '../factions/factionMechanicalCatalogRegistry';
import { getFactionMechanicalRoles } from '../factions/factionMechanicalRoles';
import { queueResearch } from '../research/researchCommands';
import { getEmpireResearch, getResearchLevel } from '../research/researchState';
import type { GameCommand, GameState } from '../types';
import { getUnitDefinition } from '../units/catalog';
import { getLegacyUnitIdsForCanonical } from '../units/unitAliases';
import { queueUnitBatch } from '../units/productionCommands';
import { createBotPerception } from './perception';
import {
  getBotPhaseProductionTargets,
  getBotPhaseResearchTargets,
} from './progressionPriorities';
import {
  getBotProgressionPhase,
  type BotProgressionPhase,
} from './progressionPhase';

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
  phase: BotProgressionPhase,
): BotPlannerDecision {
  const research = getEmpireResearch(state.research, empireId);
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

  const targets = getBotPhaseResearchTargets(state, empireId, phase, threatened);
  for (const target of targets) {
    if (research !== undefined && getResearchLevel(research, target.technologyId) >= target.level) {
      continue;
    }
    for (const planet of planets) {
      const command: Extract<GameCommand, { readonly type: 'QUEUE_RESEARCH' }> = {
        type: 'QUEUE_RESEARCH',
        empireId,
        planetId: planet.id,
        technologyId: target.technologyId,
      };
      if (queueResearch(state, command).ok) {
        return {
          reasonCode: 'research-selected',
          explanation: threatened
            ? `Угроза подтверждена: phase ${phase}, исследование ${target.technologyId} до уровня ${target.level}.`
            : `Phase ${phase}: исследование ${target.technologyId} до уровня ${target.level}.`,
          command,
        };
      }
    }
  }

  return {
    reasonCode: 'research-unavailable',
    explanation: `Phase ${phase}: нет доступного и оплачиваемого исследования.`,
    command: null,
  };
}

function countUnit(state: GameState, empireId: string, unitId: string): number {
  const definition = getUnitDefinition(unitId);
  const ids = [unitId, ...getLegacyUnitIdsForCanonical(unitId)];
  const onPlanets = state.planets
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
  return state.fleets
    .filter((fleet) => fleet.empireId === empireId)
    .reduce((total, fleet) => total + ids.reduce(
      (subtotal, id) => subtotal + (fleet.ships[id] ?? 0),
      0,
    ), onPlanets);
}

function commanderCandidates(
  state: GameState,
  empireId: string,
): readonly { readonly id: string; readonly quantity: number }[] {
  const level = getEmpireCommandState(state.commanders, empireId)?.level ?? 0;
  return getCommanderShipCatalog()
    .filter((definition) =>
      (definition.requiredAdmiralLevel ?? 1) <= level &&
      countUnit(state, empireId, definition.id) === 0,
    )
    .sort((left, right) =>
      (left.commanderAbility?.battlePriority ?? 999) -
        (right.commanderAbility?.battlePriority ?? 999) ||
      left.id.localeCompare(right.id),
    )
    .map((definition) => ({ id: definition.id, quantity: 1 }));
}

function chooseProduction(
  state: GameState,
  empireId: string,
  threatened: boolean,
  phase: BotProgressionPhase,
): BotPlannerDecision {
  const planets = state.planets
    .filter((planet) => planet.ownerEmpireId === empireId)
    .sort((left, right) => left.id.localeCompare(right.id));
  const factionId = getFactionIdForEmpire(state, empireId);
  const roles = getFactionMechanicalRoles(factionId);
  const ships = roles.ships.complete;
  const defenses = roles.defenses.complete;
  const compressed = state.campaignSettings.progressionProfile === 'compressed-v1';
  const commanderIds = getCommanderShipCatalog().map((definition) => definition.id);
  const unitIds = new Set([
    ...getUnitCatalogForFaction(factionId).map((definition) => definition.id),
    ...commanderIds,
  ]);
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

  const phasePriority = getBotPhaseProductionTargets(state, empireId, phase, threatened)
    .filter((target) => countUnit(state, empireId, target.unitId) < target.desiredTotal)
    .map((target) => ({ id: target.unitId, quantity: target.quantity }));
  const expeditionSupport =
    compressed &&
    phase === 'first-combat' &&
    countUnit(state, empireId, roles.ships.scout) < 2
      ? [{ id: roles.ships.scout, quantity: 1 }]
      : [];
  const availableCommanders = compressed ? [] : commanderCandidates(state, empireId);
  const fallback: readonly { readonly id: string; readonly quantity: number }[] = compressed
    ? []
    : threatened
      ? [
          { id: defenses.basicTurret, quantity: 2 },
          { id: defenses.laserTurret, quantity: 1 },
          { id: ships.supportShip, quantity: 1 },
          { id: defenses.secondaryShield, quantity: 1 },
          { id: defenses.plasmaTurret, quantity: 1 },
          { id: defenses.laserIonBattery, quantity: 1 },
          { id: defenses.planetaryShield, quantity: 1 },
        ]
      : [
          ...(countUnit(state, empireId, ships.smallTransport) === 0
            ? [{ id: ships.smallTransport, quantity: 1 }]
            : []),
          ...(countUnit(state, empireId, ships.recycler) === 0
            ? [{ id: ships.recycler, quantity: 1 }]
            : []),
          ...(countUnit(state, empireId, ships.largeTransport) === 0
            ? [{ id: ships.largeTransport, quantity: 1 }]
            : []),
          { id: defenses.basicTurret, quantity: 1 },
          { id: defenses.secondaryShield, quantity: 1 },
        ];
  const priority = [
    ...phasePriority,
    ...expeditionSupport,
    ...availableCommanders.slice(0, 1),
    ...fallback,
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
            ? `Угроза подтверждена: phase ${phase}, заказан ${candidate.id}.`
            : `Phase ${phase}: заказан ${candidate.id}.`,
          command,
        };
      }
    }
  }

  return {
    reasonCode: 'production-unavailable',
    explanation: `Phase ${phase}: нет доступного и оплачиваемого производственного заказа.`,
    command: null,
  };
}

export function planBotResearchAndProduction(
  state: GameState,
  empireId: string,
): BotResearchProductionPlan {
  const perception = createBotPerception(state, empireId);
  const threatened = perception.alerts.length > 0;
  const phase = getBotProgressionPhase(state, empireId);
  return {
    empireId,
    research: chooseResearch(state, empireId, threatened, phase),
    production: chooseProduction(state, empireId, threatened, phase),
  };
}

export function planAllBotResearchAndProduction(
  state: GameState,
): readonly BotResearchProductionPlan[] {
  return state.empires
    .filter((empireId) => empireId !== 'player')
    .map((empireId) => planBotResearchAndProduction(state, empireId));
}
