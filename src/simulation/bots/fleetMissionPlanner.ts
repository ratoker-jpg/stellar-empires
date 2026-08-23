import { getFactionIdForEmpire } from '../factions/factionMechanicalCatalogRegistry';
import { getFactionMechanicalRoles } from '../factions/factionMechanicalRoles';
import { createFleet } from '../fleets/fleetCommands';
import {
  getMissionAvailability,
  listMissionTargets,
  type MissionAvailability,
  type MissionAvailabilityCode,
  type OrdinaryMissionKind,
} from '../fleets/missionRules';
import type { FleetMissionKind, FleetState } from '../fleets/types';
import type { GameCommand, GameState } from '../types';
import { getUnitDefinition } from '../units/catalog';
import type { ShipRole } from '../units/types';
import { createBotPerception, type BotPerception } from './perception';
import {
  calculateBotAttackRiskPermille,
  resolveBotStrategyPolicy,
  type BotTacticalProfile,
} from './strategyPolicy';

export type BotFleetReasonCode =
  | 'fleet-created'
  | 'mission-transport-selected'
  | 'mission-recycle-selected'
  | 'mission-colonize-selected'
  | 'mission-scout-selected'
  | 'mission-attack-selected'
  | 'mission-deploy-selected'
  | 'mission-blocked-flight-slots'
  | 'mission-blocked-scout-cooldown'
  | 'mission-blocked-fuel'
  | 'mission-blocked-intelligence'
  | 'fleet-busy'
  | 'fleet-unavailable'
  | 'mission-unavailable';

export interface BotFleetMissionPlan {
  readonly empireId: string;
  readonly reasonCode: BotFleetReasonCode;
  readonly availabilityCode: MissionAvailabilityCode | null;
  readonly explanation: string;
  readonly command: GameCommand | null;
}

type PerceivedFleet = BotPerception['ownFleets'][number];
type ResourceId = 'metal' | 'crystal' | 'gas';
type SendCommand = Extract<GameCommand, { readonly type: 'SEND_FLEET' }>;

interface MissionBlocker {
  readonly code: MissionAvailabilityCode;
  readonly message: string;
}

const RESOURCE_IDS: readonly ResourceId[] = ['metal', 'crystal', 'gas'];
const ZERO_CARGO = { metal: 0, crystal: 0, gas: 0 } as const;
const BLOCKER_PRIORITY: readonly MissionAvailabilityCode[] = [
  'FLIGHT_SLOT_LIMIT_REACHED',
  'SCOUT_COOLDOWN_ACTIVE',
  'INSUFFICIENT_FLIGHT_FUEL',
  'ATTACK_INTELLIGENCE_REQUIRED',
];

function sumCargo(cargo: Readonly<Record<ResourceId, number>>): number {
  return RESOURCE_IDS.reduce((total, resourceId) => total + cargo[resourceId], 0);
}

function hasRole(fleet: PerceivedFleet, role: ShipRole): boolean {
  return Object.entries(fleet.ships).some(
    ([unitId, quantity]) =>
      quantity > 0 &&
      getUnitDefinition(unitId)?.kind === 'ship' &&
      getUnitDefinition(unitId)?.role === role,
  );
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

function realFleet(state: GameState, fleet: PerceivedFleet): FleetState | undefined {
  return state.fleets.find(
    (candidate) => candidate.id === fleet.id && candidate.empireId === fleet.empireId,
  );
}

function sendCommand(
  empireId: string,
  fleetId: string,
  targetPlanetId: string,
  mission: FleetMissionKind,
): SendCommand {
  return { type: 'SEND_FLEET', empireId, fleetId, targetPlanetId, mission };
}

function selectedPlan(
  perception: BotPerception,
  command: SendCommand,
  mission: OrdinaryMissionKind,
  explanation: string,
): BotFleetMissionPlan {
  return {
    empireId: perception.empireId,
    reasonCode: `mission-${mission}-selected` as BotFleetReasonCode,
    availabilityCode: null,
    explanation,
    command,
  };
}

function noteBlocker(
  blockers: Map<MissionAvailabilityCode, MissionBlocker>,
  availability: MissionAvailability,
): void {
  if (!BLOCKER_PRIORITY.includes(availability.code) || blockers.has(availability.code)) return;
  blockers.set(availability.code, {
    code: availability.code,
    message: availability.message,
  });
}

function tryMission(
  state: GameState,
  perception: BotPerception,
  blockers: Map<MissionAvailabilityCode, MissionBlocker>,
  fleet: PerceivedFleet,
  mission: OrdinaryMissionKind,
  targetPlanetId: string,
  explanation: string,
): BotFleetMissionPlan | null {
  const command = sendCommand(perception.empireId, fleet.id, targetPlanetId, mission);
  const availability = getMissionAvailability(state, command);
  if (availability.allowed) return selectedPlan(perception, command, mission, explanation);
  noteBlocker(blockers, availability);
  return null;
}

function missionPlan(
  state: GameState,
  perception: BotPerception,
  maxAttackRiskPermille: number | null,
): { readonly plan: BotFleetMissionPlan | null; readonly blocker: MissionBlocker | null } {
  const fleets = perception.ownFleets
    .filter((fleet) => fleet.status === 'stationed' && fleet.location.type === 'planet')
    .sort((left, right) => left.id.localeCompare(right.id));
  const blockers = new Map<MissionAvailabilityCode, MissionBlocker>();

  for (const fleet of fleets) {
    if (fleet.location.type !== 'planet' || sumCargo(fleet.cargo) <= 0) continue;
    const resourceId = [...RESOURCE_IDS].sort(
      (left, right) => fleet.cargo[right] - fleet.cargo[left] || left.localeCompare(right),
    )[0];
    if (resourceId === undefined || fleet.cargo[resourceId] <= 0) continue;
    const originPlanetId = fleet.location.planetId;
    const targets = perception.ownPlanets
      .filter((planet) => planet.id !== originPlanetId)
      .sort(
        (left, right) =>
          left.resources[resourceId] - right.resources[resourceId] ||
          left.id.localeCompare(right.id),
      );
    for (const target of targets) {
      const plan = tryMission(
        state,
        perception,
        blockers,
        fleet,
        'transport',
        target.id,
        `Транспорт ${fleet.id} направлен на ${target.name} с ресурсом ${resourceId}.`,
      );
      if (plan !== null) return { plan, blocker: null };
    }
  }

  for (const fleet of fleets.filter((candidate) => hasRole(candidate, 'recycler'))) {
    for (const target of [...perception.ownDebrisFields].sort(
      (left, right) =>
        right.metal + right.crystal - (left.metal + left.crystal) ||
        left.planetId.localeCompare(right.planetId),
    )) {
      if (fleet.location.type !== 'planet' || target.planetId === fleet.location.planetId) continue;
      const plan = tryMission(
        state,
        perception,
        blockers,
        fleet,
        'recycle',
        target.planetId,
        `Переработчик ${fleet.id} направлен к обломкам ${target.planetId}.`,
      );
      if (plan !== null) return { plan, blocker: null };
    }
  }

  for (const fleet of fleets.filter((candidate) => hasRole(candidate, 'colonizer'))) {
    const actual = realFleet(state, fleet);
    if (actual === undefined) continue;
    for (const target of listMissionTargets(state, perception.empireId, actual, 'colonize')) {
      const plan = tryMission(
        state,
        perception,
        blockers,
        fleet,
        'colonize',
        target.id,
        `Колонизатор ${fleet.id} направлен к позиции ${target.label}.`,
      );
      if (plan !== null) return { plan, blocker: null };
    }
  }

  const fullCurrentTargetIds = new Set(
    perception.foreignPlanets
      .filter((planet) => planet.freshness === 'current' && planet.snapshot.level === 3)
      .map((planet) => planet.planetId),
  );
  const scoutPriority = (targetId: string): number => {
    const intelligence = perception.foreignPlanets.find((planet) => planet.planetId === targetId);
    if (intelligence?.freshness === 'stale') return 0;
    if (intelligence !== undefined && intelligence.snapshot.level < 3) return 1;
    return 2;
  };

  for (const fleet of fleets.filter((candidate) => hasRole(candidate, 'scout'))) {
    const actual = realFleet(state, fleet);
    if (actual === undefined) continue;
    const target = [...listMissionTargets(state, perception.empireId, actual, 'scout')]
      .filter((candidate) => !fullCurrentTargetIds.has(candidate.id))
      .sort(
        (left, right) =>
          scoutPriority(left.id) - scoutPriority(right.id) || left.id.localeCompare(right.id),
      )[0];
    if (target === undefined) continue;
    const plan = tryMission(
      state,
      perception,
      blockers,
      fleet,
      'scout',
      target.id,
      `Разведчик ${fleet.id} проверяет ${target.label}.`,
    );
    if (plan !== null) return { plan, blocker: null };
  }

  for (const fleet of fleets.filter(isArmed)) {
    const ownPower = shipPower(fleet.ships);
    const targets = perception.foreignPlanets
      .filter(
        (planet) => planet.freshness === 'current' && planet.snapshot.level === 3,
      )
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
      if (maxAttackRiskPermille === null) continue;
      const riskPermille = calculateBotAttackRiskPermille(target.power, ownPower);
      if (riskPermille > maxAttackRiskPermille) continue;
      const plan = tryMission(
        state,
        perception,
        blockers,
        fleet,
        'attack',
        target.planet.planetId,
        `Флот ${fleet.id} атакует ${target.planet.planetId}: ${ownPower} против ${target.power}, риск ${riskPermille}‰.`,
      );
      if (plan !== null) return { plan, blocker: null };
    }

    const knownFullIds = new Set(targets.map((target) => target.planet.planetId));
    for (const contact of perception.publicContacts.filter(
      (candidate) => !knownFullIds.has(candidate.planetId),
    )) {
      tryMission(
        state,
        perception,
        blockers,
        fleet,
        'attack',
        contact.planetId,
        '',
      );
    }
  }

  for (const fleet of fleets.filter(isArmed)) {
    const reinforcements = perception.ownPlanets
      .filter(
        (planet) => fleet.location.type === 'planet' && planet.id !== fleet.location.planetId,
      )
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
      const plan = tryMission(
        state,
        perception,
        blockers,
        fleet,
        'deploy',
        target.planet.id,
        `Флот ${fleet.id} усиливает колонию ${target.planet.name}.`,
      );
      if (plan !== null) return { plan, blocker: null };
    }
  }

  const blocker = BLOCKER_PRIORITY
    .map((code) => blockers.get(code))
    .find((candidate) => candidate !== undefined) ?? null;
  return { plan: null, blocker };
}

interface FleetCandidate {
  readonly ships: Readonly<Record<string, number>>;
  readonly cargo: Readonly<Record<ResourceId, number>>;
  readonly explanation: string;
}

function creationCandidates(
  perception: BotPerception,
  planet: BotPerception['ownPlanets'][number],
  state: GameState,
): readonly FleetCandidate[] {
  const factionId = getFactionIdForEmpire(state, perception.empireId);
  const roles = getFactionMechanicalRoles(factionId);
  const candidates: FleetCandidate[] = [];

  if (perception.publicContacts.length > 0 && (planet.ships[roles.ships.scout] ?? 0) > 0) {
    candidates.push({
      ships: { [roles.ships.scout]: 1 },
      cargo: ZERO_CARGO,
      explanation: `На ${planet.name} сформирован разведывательный флот.`,
    });
  }

  if (
    (perception.researchLevels[roles.research.colonization] ?? 0) > 0 &&
    (planet.ships[roles.ships.colonizer] ?? 0) > 0
  ) {
    candidates.push({
      ships: { [roles.ships.colonizer]: 1 },
      cargo: ZERO_CARGO,
      explanation: `На ${planet.name} подготовлен колонизационный флот.`,
    });
  }

  if (
    perception.ownDebrisFields.length > 0 &&
    (planet.ships[roles.ships.recycler] ?? 0) > 0
  ) {
    candidates.push({
      ships: { [roles.ships.recycler]: 1 },
      cargo: ZERO_CARGO,
      explanation: `На ${planet.name} сформирован флот переработки.`,
    });
  }

  if (perception.ownPlanets.length > 1 && (planet.ships[roles.ships.transport] ?? 0) > 0) {
    const resourceId = [...RESOURCE_IDS].sort(
      (left, right) => planet.resources[right] - planet.resources[left] || left.localeCompare(right),
    )[0];
    if (resourceId !== undefined) {
      const amount = Math.min(400, Math.max(0, planet.resources[resourceId] - 500));
      if (amount > 0) {
        candidates.push({
          ships: { [roles.ships.transport]: 1 },
          cargo: { ...ZERO_CARGO, [resourceId]: amount },
          explanation: `На ${planet.name} сформирован транспорт с грузом ${resourceId}.`,
        });
      }
    }
  }

  if (perception.publicContacts.length === 0 && (planet.ships[roles.ships.scout] ?? 0) > 0) {
    candidates.push({
      ships: { [roles.ships.scout]: 1 },
      cargo: ZERO_CARGO,
      explanation: `На ${planet.name} сформирован разведывательный флот.`,
    });
  }

  const combat: Record<string, number> = {};
  const fighters = Math.min(3, planet.ships[roles.ships.fighter] ?? 0);
  const frigates = Math.min(1, planet.ships[roles.ships.frigate] ?? 0);
  if (fighters > 0) combat[roles.ships.fighter] = fighters;
  if (frigates > 0) combat[roles.ships.frigate] = frigates;
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
    for (const candidate of creationCandidates(perception, planet, state)) {
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
          availabilityCode: null,
          explanation: candidate.explanation,
          command,
        };
      }
    }
  }
  return null;
}

function blockedPlan(empireId: string, blocker: MissionBlocker): BotFleetMissionPlan {
  const reasonCode: BotFleetReasonCode = blocker.code === 'FLIGHT_SLOT_LIMIT_REACHED'
    ? 'mission-blocked-flight-slots'
    : blocker.code === 'SCOUT_COOLDOWN_ACTIVE'
      ? 'mission-blocked-scout-cooldown'
      : blocker.code === 'INSUFFICIENT_FLIGHT_FUEL'
        ? 'mission-blocked-fuel'
        : 'mission-blocked-intelligence';
  return {
    empireId,
    reasonCode,
    availabilityCode: blocker.code,
    explanation: blocker.message,
    command: null,
  };
}

export function planBotFleetMission(
  state: GameState,
  empireId: string,
  profile?: BotTacticalProfile,
): BotFleetMissionPlan {
  const perception = createBotPerception(state, empireId);
  const policy = resolveBotStrategyPolicy(empireId, profile);
  const mission = missionPlan(state, perception, policy?.maxAttackRiskPermille ?? null);
  if (mission.plan !== null) return mission.plan;

  if (
    mission.blocker !== null &&
    mission.blocker.code !== 'ATTACK_INTELLIGENCE_REQUIRED'
  ) {
    return blockedPlan(empireId, mission.blocker);
  }

  const creation = fleetCreationPlan(state, perception);
  if (creation !== null) return creation;
  if (mission.blocker !== null) return blockedPlan(empireId, mission.blocker);

  if (perception.ownFleets.some((fleet) => fleet.status !== 'stationed')) {
    return {
      empireId,
      reasonCode: 'fleet-busy',
      availabilityCode: null,
      explanation: 'Флоты уже выполняют миссии, свободных кораблей для новой группы нет.',
      command: null,
    };
  }
  if (perception.ownFleets.length > 0) {
    return {
      empireId,
      reasonCode: 'mission-unavailable',
      availabilityCode: null,
      explanation: 'Станционированные флоты не имеют честно подтверждённой допустимой цели.',
      command: null,
    };
  }
  return {
    empireId,
    reasonCode: 'fleet-unavailable',
    availabilityCode: null,
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
