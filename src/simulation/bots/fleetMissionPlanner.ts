import { createFleet } from '../fleets/fleetCommands';
import { sendFleet } from '../fleets/flightCommands';
import type { FleetMissionKind } from '../fleets/types';
import type { GameCommand, GameState } from '../types';
import { getUnitDefinition } from '../units/catalog';
import { createBotPerception, type BotPerception } from './perception';

export type BotFleetReasonCode =
  | 'fleet-created'
  | 'mission-transport-selected'
  | 'mission-recycle-selected'
  | 'mission-colonize-selected'
  | 'mission-scout-selected'
  | 'mission-attack-selected'
  | 'mission-deploy-selected'
  | 'fleet-busy'
  | 'fleet-unavailable'
  | 'mission-unavailable';

export interface BotFleetMissionPlan {
  readonly empireId: string;
  readonly reasonCode: BotFleetReasonCode;
  readonly explanation: string;
  readonly command: GameCommand | null;
}

type PerceivedFleet = BotPerception['ownFleets'][number];
type ResourceId = 'metal' | 'crystal' | 'gas';

const RESOURCE_IDS: readonly ResourceId[] = ['metal', 'crystal', 'gas'];
const ZERO_CARGO = { metal: 0, crystal: 0, gas: 0 } as const;

function sumCargo(cargo: Readonly<Record<ResourceId, number>>): number {
  return RESOURCE_IDS.reduce((total, resourceId) => total + cargo[resourceId], 0);
}

function hasShip(fleet: PerceivedFleet, unitId: string): boolean {
  return (fleet.ships[unitId] ?? 0) > 0;
}

function shipPower(ships: Readonly<Record<string, number>>): number {
  return Object.entries(ships).reduce((total, [unitId, quantity]) => {
    const stats = getUnitDefinition(unitId)?.stats;
    return stats === undefined
      ? total
      : total + quantity * (stats.attack * 2 + stats.armor + stats.shield);
  }, 0);
}

function isArmed(fleet: PerceivedFleet): boolean {
  return Object.entries(fleet.ships).some(
    ([unitId, quantity]) => quantity > 0 && (getUnitDefinition(unitId)?.stats.attack ?? 0) > 0,
  );
}

function perceivedTargetPower(
  snapshot: BotPerception['foreignPlanets'][number]['snapshot'],
): number | null {
  if (snapshot.level < 3) return null;
  const defenses = Object.entries(snapshot.defenses ?? {}).reduce((total, [unitId, quantity]) => {
    const stats = getUnitDefinition(unitId)?.stats;
    return stats === undefined
      ? total
      : total + quantity * (stats.attack * 2 + stats.armor + stats.shield);
  }, 0);
  return (snapshot.stationedFleets ?? []).reduce(
    (total, fleet) => total + shipPower(fleet.ships),
    defenses,
  );
}

function sendCommand(
  empireId: string,
  fleetId: string,
  targetPlanetId: string,
  mission: FleetMissionKind,
): Extract<GameCommand, { readonly type: 'SEND_FLEET' }> {
  return { type: 'SEND_FLEET', empireId, fleetId, targetPlanetId, mission };
}

function validSend(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'SEND_FLEET' }>,
): boolean {
  return sendFleet(state, command).ok;
}

function missionPlan(
  state: GameState,
  perception: BotPerception,
): BotFleetMissionPlan | null {
  const fleets = perception.ownFleets
    .filter((fleet) => fleet.status === 'stationed' && fleet.location.type === 'planet')
    .sort((left, right) => left.id.localeCompare(right.id));
  const ownIds = new Set(perception.ownPlanets.map((planet) => planet.id));

  for (const fleet of fleets) {
    if (fleet.location.type !== 'planet') continue;
    const originPlanetId = fleet.location.planetId;

    if (sumCargo(fleet.cargo) > 0) {
      const resourceId = [...RESOURCE_IDS].sort(
        (left, right) => fleet.cargo[right] - fleet.cargo[left] || left.localeCompare(right),
      )[0];
      if (resourceId !== undefined && fleet.cargo[resourceId] > 0) {
        const targets = perception.ownPlanets
          .filter((planet) => planet.id !== originPlanetId)
          .sort(
            (left, right) =>
              left.resources[resourceId] - right.resources[resourceId] ||
              left.id.localeCompare(right.id),
          );
        for (const target of targets) {
          const command = sendCommand(
            perception.empireId,
            fleet.id,
            target.id,
            'transport',
          );
          if (validSend(state, command)) {
            return {
              empireId: perception.empireId,
              reasonCode: 'mission-transport-selected',
              explanation: `Транспорт ${fleet.id} направлен на ${target.name} с ресурсом ${resourceId}.`,
              command,
            };
          }
        }
      }
    }

    if (hasShip(fleet, 'ship.aegis.recycler')) {
      const debris = [...perception.ownDebrisFields].sort(
        (left, right) =>
          right.metal + right.crystal - (left.metal + left.crystal) ||
          left.planetId.localeCompare(right.planetId),
      );
      for (const target of debris) {
        if (target.planetId === originPlanetId) continue;
        const command = sendCommand(
          perception.empireId,
          fleet.id,
          target.planetId,
          'recycle',
        );
        if (validSend(state, command)) {
          return {
            empireId: perception.empireId,
            reasonCode: 'mission-recycle-selected',
            explanation: `Переработчик ${fleet.id} направлен к обломкам ${target.planetId}.`,
            command,
          };
        }
      }
    }

    if (hasShip(fleet, 'ship.aegis.colony')) {
      const targets = state.galaxy.systems
        .flatMap((system) => system.planets)
        .filter((planet) => planet.biome !== 'gas')
        .sort((left, right) => left.id.localeCompare(right.id));
      for (const target of targets) {
        const command = sendCommand(
          perception.empireId,
          fleet.id,
          target.id,
          'colonize',
        );
        if (validSend(state, command)) {
          return {
            empireId: perception.empireId,
            reasonCode: 'mission-colonize-selected',
            explanation: `Колонизатор ${fleet.id} направлен к позиции ${target.id}.`,
            command,
          };
        }
      }
    }

    if (hasShip(fleet, 'ship.aegis.scout')) {
      const observed = [...perception.foreignPlanets]
        .sort(
          (left, right) =>
            Number(left.freshness === 'current') - Number(right.freshness === 'current') ||
            right.ageSeconds - left.ageSeconds ||
            left.planetId.localeCompare(right.planetId),
        )
        .map((planet) => planet.planetId);
      const publicTargets = perception.publicColonyIds.filter((planetId) => !ownIds.has(planetId));
      for (const targetPlanetId of [...new Set([...observed, ...publicTargets])]) {
        const command = sendCommand(
          perception.empireId,
          fleet.id,
          targetPlanetId,
          'scout',
        );
        if (validSend(state, command)) {
          return {
            empireId: perception.empireId,
            reasonCode: 'mission-scout-selected',
            explanation: `Разведчик ${fleet.id} проверяет ${targetPlanetId}.`,
            command,
          };
        }
      }
    }

    if (isArmed(fleet)) {
      const ownPower = shipPower(fleet.ships);
      const targets = perception.foreignPlanets
        .filter((planet) => planet.freshness === 'current')
        .map((planet) => ({ planet, power: perceivedTargetPower(planet.snapshot) }))
        .filter(
          (candidate): candidate is {
            readonly planet: BotPerception['foreignPlanets'][number];
            readonly power: number;
          } => candidate.power !== null,
        )
        .sort(
          (left, right) =>
            left.power - right.power || left.planet.planetId.localeCompare(right.planet.planetId),
        );
      for (const target of targets) {
        if (ownPower * 10 < Math.max(1, target.power) * 12) continue;
        const command = sendCommand(
          perception.empireId,
          fleet.id,
          target.planet.planetId,
          'attack',
        );
        if (validSend(state, command)) {
          return {
            empireId: perception.empireId,
            reasonCode: 'mission-attack-selected',
            explanation: `Флот ${fleet.id} атакует ${target.planet.planetId}: ${ownPower} против ${target.power}.`,
            command,
          };
        }
      }

      const reinforcements = perception.ownPlanets
        .filter((planet) => planet.id !== originPlanetId)
        .map((planet) => ({
          planet,
          defense: Object.values(planet.defenses).reduce(
            (total, quantity) => total + quantity,
            0,
          ),
        }))
        .sort(
          (left, right) =>
            left.defense - right.defense || left.planet.id.localeCompare(right.planet.id),
        );
      for (const target of reinforcements) {
        const command = sendCommand(
          perception.empireId,
          fleet.id,
          target.planet.id,
          'deploy',
        );
        if (validSend(state, command)) {
          return {
            empireId: perception.empireId,
            reasonCode: 'mission-deploy-selected',
            explanation: `Флот ${fleet.id} усиливает колонию ${target.planet.name}.`,
            command,
          };
        }
      }
    }
  }

  return null;
}

interface FleetCandidate {
  readonly ships: Readonly<Record<string, number>>;
  readonly cargo: Readonly<Record<ResourceId, number>>;
  readonly explanation: string;
}

function creationCandidates(
  perception: BotPerception,
  planet: BotPerception['ownPlanets'][number],
): readonly FleetCandidate[] {
  const candidates: FleetCandidate[] = [];

  if (
    (perception.researchLevels['technology.aegis.colonization'] ?? 0) > 0 &&
    (planet.ships['ship.aegis.colony'] ?? 0) > 0
  ) {
    candidates.push({
      ships: { 'ship.aegis.colony': 1 },
      cargo: ZERO_CARGO,
      explanation: `На ${planet.name} подготовлен колонизационный флот.`,
    });
  }

  if (perception.ownDebrisFields.length > 0 && (planet.ships['ship.aegis.recycler'] ?? 0) > 0) {
    candidates.push({
      ships: { 'ship.aegis.recycler': 1 },
      cargo: ZERO_CARGO,
      explanation: `На ${planet.name} сформирован флот переработки.`,
    });
  }

  if (perception.ownPlanets.length > 1 && (planet.ships['ship.aegis.cargo'] ?? 0) > 0) {
    const resourceId = [...RESOURCE_IDS].sort(
      (left, right) => planet.resources[right] - planet.resources[left] || left.localeCompare(right),
    )[0];
    if (resourceId !== undefined) {
      const amount = Math.min(400, Math.max(0, planet.resources[resourceId] - 500));
      if (amount > 0) {
        candidates.push({
          ships: { 'ship.aegis.cargo': 1 },
          cargo: { ...ZERO_CARGO, [resourceId]: amount },
          explanation: `На ${planet.name} сформирован транспорт с грузом ${resourceId}.`,
        });
      }
    }
  }

  if ((planet.ships['ship.aegis.scout'] ?? 0) > 0) {
    candidates.push({
      ships: { 'ship.aegis.scout': 1 },
      cargo: ZERO_CARGO,
      explanation: `На ${planet.name} сформирован разведывательный флот.`,
    });
  }

  const combat: Record<string, number> = {};
  const fighters = Math.min(3, planet.ships['ship.aegis.fighter'] ?? 0);
  const frigates = Math.min(1, planet.ships['ship.aegis.frigate'] ?? 0);
  if (fighters > 0) combat['ship.aegis.fighter'] = fighters;
  if (frigates > 0) combat['ship.aegis.frigate'] = frigates;
  if (Object.keys(combat).length > 0) {
    candidates.push({
      ships: combat,
      cargo: ZERO_CARGO,
      explanation: `На ${planet.name} сформирована боевая группа.`,
    });
  }

  const fallback = Object.entries(planet.ships)
    .filter(([, quantity]) => quantity > 0)
    .sort(([left], [right]) => left.localeCompare(right))[0];
  if (fallback !== undefined) {
    candidates.push({
      ships: { [fallback[0]]: 1 },
      cargo: ZERO_CARGO,
      explanation: `На ${planet.name} сформирован доступный сервисный флот.`,
    });
  }

  return candidates;
}

function fleetCreationPlan(
  state: GameState,
  perception: BotPerception,
): BotFleetMissionPlan | null {
  const planets = [...perception.ownPlanets].sort((left, right) => left.id.localeCompare(right.id));
  for (const planet of planets) {
    for (const candidate of creationCandidates(perception, planet)) {
      const command: Extract<GameCommand, { readonly type: 'CREATE_FLEET' }> = {
        type: 'CREATE_FLEET',
        empireId: perception.empireId,
        planetId: planet.id,
        ships: candidate.ships,
        cargo: candidate.cargo,
      };
      if (createFleet(state, command).ok) {
        return {
          empireId: perception.empireId,
          reasonCode: 'fleet-created',
          explanation: candidate.explanation,
          command,
        };
      }
    }
  }
  return null;
}

export function planBotFleetMission(
  state: GameState,
  empireId: string,
): BotFleetMissionPlan {
  const perception = createBotPerception(state, empireId);
  const mission = missionPlan(state, perception);
  if (mission !== null) return mission;

  const creation = fleetCreationPlan(state, perception);
  if (creation !== null) return creation;

  if (perception.ownFleets.some((fleet) => fleet.status !== 'stationed')) {
    return {
      empireId,
      reasonCode: 'fleet-busy',
      explanation: 'Флоты уже выполняют миссии, свободных кораблей для новой группы нет.',
      command: null,
    };
  }
  if (perception.ownFleets.length > 0) {
    return {
      empireId,
      reasonCode: 'mission-unavailable',
      explanation: 'Станционированные флоты не имеют честно подтверждённой допустимой цели.',
      command: null,
    };
  }
  return {
    empireId,
    reasonCode: 'fleet-unavailable',
    explanation: 'Нет свободных кораблей для формирования флота.',
    command: null,
  };
}

export function planAllBotFleetMissions(
  state: GameState,
): readonly BotFleetMissionPlan[] {
  return state.empires
    .filter((empireId) => empireId !== 'player')
    .map((empireId) => planBotFleetMission(state, empireId));
}
