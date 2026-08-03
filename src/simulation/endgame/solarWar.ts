import {
  getCommanderFleetEffects,
  recoverFleetShipsWithCommander,
} from '../command/commanderShips';
import { getCommandCombatEffects } from '../command/commandDoctrine';
import { resolveBattle } from '../combat/resolveBattle';
import type { BattleReport, BattleWinner } from '../combat/types';
import { enqueueEvent } from '../eventQueue';
import { getResearchEffectsForEmpire } from '../factions/factionResearchEffects';
import { getFactionMechanicalRoles } from '../factions/factionMechanicalRoles';
import type { FleetState } from '../fleets/types';
import { appendCommandHistory, retainNewest } from '../history/stateHistory';
import type { FactionId } from '../planet/types';
import type {
  CommandResult,
  GameCommand,
  GameState,
  ScheduledGameEvent,
} from '../types';
import { getUnitDefinition } from '../units/catalog';
import { getShipUpgradeBonusMap } from '../upgrades/shipUpgrades';
import {
  SOLAR_WAR_CYCLE_SECONDS,
  SOLAR_WAR_HISTORY_LIMIT,
  type EndgameParticipationState,
  type SolarWarCycle,
  type SolarWarEntry,
  type SolarWarOutcome,
  type SolarWarResult,
  type SolarWarState,
} from './types';

const FACTIONS: readonly FactionId[] = ['aegis', 'synod', 'veyra'];
const ALLIANCE_ID_PATTERN = /^alliance-[1-9]\d*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return isNonNegativeInteger(value) && value > 0;
}

function isFactionId(value: unknown): value is FactionId {
  return value === 'aegis' || value === 'synod' || value === 'veyra';
}

function isBattleWinner(value: unknown): value is BattleWinner {
  return value === 'attacker' || value === 'defender' || value === 'draw';
}

function isUnitRecord(value: unknown, allowEmpty = true): value is Readonly<Record<string, number>> {
  return isRecord(value) &&
    (allowEmpty || Object.keys(value).length > 0) &&
    Object.entries(value).every(([unitId, count]) => unitId.length > 0 && isPositiveInteger(count));
}

function mixSeed(value: number): number {
  let mixed = value >>> 0;
  mixed ^= mixed >>> 16;
  mixed = Math.imul(mixed, 0x7feb352d);
  mixed ^= mixed >>> 15;
  mixed = Math.imul(mixed, 0x846ca68b);
  mixed ^= mixed >>> 16;
  return mixed >>> 0;
}

function nextRandom(value: number): number {
  let random = value | 0;
  random ^= random << 13;
  random ^= random >>> 17;
  random ^= random << 5;
  return random >>> 0;
}

function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function createEnemyUnits(
  factionId: FactionId,
  seed: number,
): Readonly<Record<string, number>> {
  const ships = getFactionMechanicalRoles(factionId).ships.complete;
  let random = nextRandom(seed);
  const take = (base: number, spread: number): number => {
    random = nextRandom(random);
    return base + (random % (spread + 1));
  };
  return {
    [ships.lightFighter]: take(24, 12),
    [ships.interceptor]: take(10, 6),
    [ships.supportShip]: take(4, 3),
    [ships.lineBattleship]: take(5, 3),
    [ships.heavyAssault]: take(2, 2),
    [ships.bomber]: take(2, 2),
  };
}

export function getSolarWarCycleIndex(elapsedSeconds: number): number {
  if (!isNonNegativeInteger(elapsedSeconds)) {
    throw new Error('Solar War time must be a non-negative safe integer.');
  }
  return Math.floor(elapsedSeconds / SOLAR_WAR_CYCLE_SECONDS);
}

export function getSolarWarCycle(
  state: Pick<GameState, 'seed' | 'clock'>,
): SolarWarCycle {
  const cycleIndex = getSolarWarCycleIndex(state.clock.elapsedSeconds);
  const startsAt = cycleIndex * SOLAR_WAR_CYCLE_SECONDS;
  const combatSeed = mixSeed(
    state.seed ^ Math.imul(cycleIndex + 1, 0x9e3779b1) ^ 0x53a9f17d,
  );
  const factionId = FACTIONS[combatSeed % FACTIONS.length]!;
  return {
    id: `solar-war-${cycleIndex}`,
    cycleIndex,
    startsAt,
    resolvesAt: startsAt + SOLAR_WAR_CYCLE_SECONDS,
    factionId,
    enemyUnits: createEnemyUnits(factionId, combatSeed),
    combatSeed,
  };
}

export function createInitialSolarWarState(): SolarWarState {
  return { activeEntries: [], history: [] };
}

function isSolarWarCycle(value: unknown): value is SolarWarCycle {
  if (!isRecord(value) ||
    typeof value.id !== 'string' ||
    !isNonNegativeInteger(value.cycleIndex) ||
    !isNonNegativeInteger(value.startsAt) ||
    !isNonNegativeInteger(value.resolvesAt) ||
    !isFactionId(value.factionId) ||
    !isUnitRecord(value.enemyUnits, false) ||
    !isNonNegativeInteger(value.combatSeed)) {
    return false;
  }
  return value.id === `solar-war-${value.cycleIndex}` &&
    value.startsAt === value.cycleIndex * SOLAR_WAR_CYCLE_SECONDS &&
    value.resolvesAt === value.startsAt + SOLAR_WAR_CYCLE_SECONDS;
}

function hasValidParticipationSnapshot(value: Record<string, unknown>): boolean {
  if (value.participationKind === 'solo') {
    return value.allianceId === null && value.participationId === value.empireId;
  }
  return value.participationKind === 'alliance' &&
    typeof value.allianceId === 'string' &&
    ALLIANCE_ID_PATTERN.test(value.allianceId) &&
    value.participationId === value.allianceId;
}

function isSolarWarEntry(value: unknown, empireIds: ReadonlySet<string>): value is SolarWarEntry {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.empireId === 'string' && empireIds.has(value.empireId) &&
    typeof value.fleetId === 'string' && value.fleetId.length > 0 &&
    typeof value.originPlanetId === 'string' && value.originPlanetId.length > 0 &&
    typeof value.participationId === 'string' && value.participationId.length > 0 &&
    isNonNegativeInteger(value.enteredAt) &&
    isNonNegativeInteger(value.resolvesAt) &&
    isSolarWarCycle(value.cycle) &&
    value.id === `solar-war-entry-${value.cycle.cycleIndex}-${value.empireId}` &&
    value.enteredAt >= value.cycle.startsAt &&
    value.enteredAt < value.cycle.resolvesAt &&
    value.resolvesAt === value.cycle.resolvesAt &&
    hasValidParticipationSnapshot(value);
}

function isBattleReport(value: unknown, result: Record<string, unknown>): value is BattleReport {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    isNonNegativeInteger(value.seed) &&
    isNonNegativeInteger(value.resolvedAt) &&
    value.resolvedAt === result.resolvedAt &&
    value.targetPlanetId === result.cycleId &&
    value.attackerEmpireId === result.empireId &&
    typeof value.defenderEmpireId === 'string' &&
    isBattleWinner(value.winner) &&
    Array.isArray(value.rounds) &&
    isUnitRecord(value.attackerInitial) &&
    isUnitRecord(value.defenderInitial, false) &&
    isUnitRecord(value.attackerRemaining) &&
    isUnitRecord(value.defenderRemaining) &&
    value.mode === 'pve';
}

function isSolarWarResult(value: unknown, empireIds: ReadonlySet<string>): value is SolarWarResult {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.entryId === 'string' &&
    typeof value.cycleId === 'string' &&
    !Number.isNaN(Number(value.cycleId.replace('solar-war-', ''))) &&
    isNonNegativeInteger(value.cycleIndex) &&
    value.cycleId === `solar-war-${value.cycleIndex}` &&
    typeof value.empireId === 'string' && empireIds.has(value.empireId) &&
    typeof value.fleetId === 'string' && value.fleetId.length > 0 &&
    typeof value.originPlanetId === 'string' && value.originPlanetId.length > 0 &&
    typeof value.participationId === 'string' && value.participationId.length > 0 &&
    isNonNegativeInteger(value.resolvedAt) &&
    (value.outcome === 'victory' || value.outcome === 'defeat' || value.outcome === 'draw') &&
    isNonNegativeInteger(value.score) &&
    isUnitRecord(value.attackerInitial) &&
    isUnitRecord(value.enemyInitial, false) &&
    isUnitRecord(value.attackerRemaining) &&
    isUnitRecord(value.enemyRemaining) &&
    hasValidParticipationSnapshot(value) &&
    isBattleReport(value.battleReport, value);
}

export function isSolarWarState(
  value: unknown,
  empireIds: readonly string[],
): value is SolarWarState {
  if (!isRecord(value) ||
    !Array.isArray(value.activeEntries) ||
    !Array.isArray(value.history) ||
    value.history.length > SOLAR_WAR_HISTORY_LIMIT) {
    return false;
  }
  const empireSet = new Set(empireIds);
  if (empireSet.size !== empireIds.length) return false;
  const activeEmpireIds = new Set<string>();
  const activeFleetIds = new Set<string>();
  for (const entry of value.activeEntries as readonly unknown[]) {
    if (!isSolarWarEntry(entry, empireSet) ||
      activeEmpireIds.has(entry.empireId) ||
      activeFleetIds.has(entry.fleetId)) {
      return false;
    }
    activeEmpireIds.add(entry.empireId);
    activeFleetIds.add(entry.fleetId);
  }
  const resultIds = new Set<string>();
  const resultEntryIds = new Set<string>();
  let previousResolvedAt = -1;
  for (const result of value.history as readonly unknown[]) {
    if (!isSolarWarResult(result, empireSet) ||
      resultIds.has(result.id) ||
      resultEntryIds.has(result.entryId) ||
      result.resolvedAt < previousResolvedAt) {
      return false;
    }
    resultIds.add(result.id);
    resultEntryIds.add(result.entryId);
    previousResolvedAt = result.resolvedAt;
  }
  return true;
}

function replaceFleet(
  fleets: readonly FleetState[],
  replacement: FleetState,
): readonly FleetState[] {
  return fleets.map((fleet) => fleet.id === replacement.id ? replacement : fleet);
}

function isCombatFleet(fleet: FleetState): boolean {
  return Object.entries(fleet.ships).some(([unitId, count]) => {
    const definition = getUnitDefinition(unitId);
    return count > 0 && definition?.kind === 'ship' && definition.stats.attack > 0;
  });
}

function unavailableParticipation(): CommandResult<never> {
  return {
    ok: false,
    code: 'ENDGAME_PARTICIPATION_UNAVAILABLE',
    message: 'The campaign state has not been migrated to endgame participation.',
  };
}

function hasCycleResolutionEvent(
  events: readonly ScheduledGameEvent[],
  cycleId: string,
): boolean {
  return events.some(
    (event) => event.payload.type === 'SOLAR_WAR_RESOLVE' && event.payload.cycleId === cycleId,
  );
}

export function enterSolarWar(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'ENTER_SOLAR_WAR' }>,
): CommandResult<GameState> {
  const participation = state.endgameParticipation;
  if (participation === undefined) return unavailableParticipation();
  const participant = participation.participants.find(
    (candidate) => candidate.empireId === command.empireId,
  );
  if (participant === undefined || !state.empires.includes(command.empireId)) {
    return { ok: false, code: 'EMPIRE_NOT_FOUND', message: 'The requested empire does not exist.' };
  }
  if (participation.solarWar.activeEntries.some(
    (entry) => entry.empireId === command.empireId,
  )) {
    return {
      ok: false,
      code: 'SOLAR_WAR_ENTRY_ACTIVE',
      message: 'Empire already has an active Solar War entry.',
    };
  }
  const fleet = state.fleets.find((candidate) => candidate.id === command.fleetId);
  if (fleet === undefined || fleet.empireId !== command.empireId) {
    return {
      ok: false,
      code: 'SOLAR_WAR_FLEET_NOT_FOUND',
      message: 'Solar War fleet is unavailable.',
    };
  }
  if (fleet.status !== 'stationed' || fleet.location.type !== 'planet' || fleet.mission !== null) {
    return {
      ok: false,
      code: 'SOLAR_WAR_FLEET_NOT_IDLE',
      message: 'Solar War entry requires an owned idle stationed fleet.',
    };
  }
  if (!isCombatFleet(fleet)) {
    return {
      ok: false,
      code: 'SOLAR_WAR_FLEET_NOT_COMBAT_CAPABLE',
      message: 'Solar War entry requires at least one combat-capable ship.',
    };
  }
  const originPlanetId = fleet.location.planetId;
  const origin = state.planets.find((planet) => planet.id === originPlanetId);
  if (origin === undefined || origin.ownerEmpireId !== command.empireId) {
    return {
      ok: false,
      code: 'SOLAR_WAR_ORIGIN_UNAVAILABLE',
      message: 'Solar War entry requires an owned origin planet.',
    };
  }

  const cycle = getSolarWarCycle(state);
  const allianceId = participant.allianceId;
  const entry: SolarWarEntry = {
    id: `solar-war-entry-${cycle.cycleIndex}-${command.empireId}`,
    cycle,
    empireId: command.empireId,
    fleetId: fleet.id,
    originPlanetId: origin.id,
    participationKind: allianceId === null ? 'solo' : 'alliance',
    participationId: allianceId ?? command.empireId,
    allianceId,
    enteredAt: state.clock.elapsedSeconds,
    resolvesAt: cycle.resolvesAt,
  };
  const needsEvent = !hasCycleResolutionEvent(state.pendingEvents, cycle.id);
  const sequence = state.nextEventSequence;
  const event: ScheduledGameEvent = {
    id: `event-${sequence}`,
    executeAt: cycle.resolvesAt,
    sequence,
    payload: { type: 'SOLAR_WAR_RESOLVE', cycleId: cycle.id },
  };

  return {
    ok: true,
    value: {
      ...state,
      fleets: replaceFleet(state.fleets, { ...fleet, status: 'holding' }),
      endgameParticipation: {
        ...participation,
        solarWar: {
          ...participation.solarWar,
          activeEntries: [...participation.solarWar.activeEntries, entry],
        },
      },
      nextEventSequence: needsEvent ? sequence + 1 : sequence,
      pendingEvents: needsEvent ? enqueueEvent(state.pendingEvents, event) : state.pendingEvents,
      commandLog: appendCommandHistory(state.commandLog, command),
    },
  };
}

function outcomeFromWinner(winner: BattleWinner): SolarWarOutcome {
  if (winner === 'attacker') return 'victory';
  if (winner === 'defender') return 'defeat';
  return 'draw';
}

function calculateScore(
  enemyInitial: Readonly<Record<string, number>>,
  enemyRemaining: Readonly<Record<string, number>>,
): number {
  return Object.entries(enemyInitial).reduce((score, [unitId, initialCount]) => {
    const destroyed = Math.max(0, initialCount - (enemyRemaining[unitId] ?? 0));
    const definition = getUnitDefinition(unitId);
    if (definition === undefined) return score;
    const unitValue = definition.baseCost.metal +
      definition.baseCost.crystal +
      definition.baseCost.gas * 2;
    return score + destroyed * unitValue;
  }, 0);
}

function resolveEntry(
  state: GameState,
  entry: SolarWarEntry,
): { readonly state: GameState; readonly result: SolarWarResult } {
  const fleet = state.fleets.find(
    (candidate) => candidate.id === entry.fleetId && candidate.empireId === entry.empireId,
  );
  const attackerInitial = fleet?.ships ?? {};
  const seed = mixSeed(entry.cycle.combatSeed ^ hashString(entry.empireId));

  if (fleet === undefined) {
    const battleReport: BattleReport = {
      id: `solar-war-battle-${entry.cycle.cycleIndex}-${entry.empireId}`,
      seed,
      resolvedAt: state.clock.elapsedSeconds,
      targetPlanetId: entry.cycle.id,
      attackerEmpireId: entry.empireId,
      defenderEmpireId: `solar-war-${entry.cycle.factionId}`,
      winner: 'defender',
      rounds: [],
      attackerInitial: {},
      defenderInitial: { ...entry.cycle.enemyUnits },
      attackerRemaining: {},
      defenderRemaining: { ...entry.cycle.enemyUnits },
      mode: 'pve',
      attackerFormation: 'line',
      attackerTargetPriority: 'balanced',
      defenderFormation: 'wedge',
      defenderTargetPriority: 'balanced',
    };
    return {
      state,
      result: {
        id: `solar-war-result-${entry.cycle.cycleIndex}-${entry.empireId}`,
        entryId: entry.id,
        cycleId: entry.cycle.id,
        cycleIndex: entry.cycle.cycleIndex,
        empireId: entry.empireId,
        fleetId: entry.fleetId,
        originPlanetId: entry.originPlanetId,
        participationKind: entry.participationKind,
        participationId: entry.participationId,
        allianceId: entry.allianceId,
        resolvedAt: state.clock.elapsedSeconds,
        outcome: 'defeat',
        score: 0,
        attackerInitial: {},
        enemyInitial: { ...entry.cycle.enemyUnits },
        attackerRemaining: {},
        enemyRemaining: { ...entry.cycle.enemyUnits },
        battleReport,
      },
    };
  }

  const research = getResearchEffectsForEmpire(state, entry.empireId);
  const command = getCommandCombatEffects(state.commanders, entry.empireId, fleet.id);
  const commander = getCommanderFleetEffects(state, fleet);
  const resolution = resolveBattle(
    seed,
    {
      empireId: entry.empireId,
      units: fleet.ships,
      weaponBonusPercent:
        research.weaponStrengthPercent + command.weaponBonusPercent + commander.weaponBonusPercent,
      armorBonusPercent:
        research.armorStrengthPercent + command.armorBonusPercent + commander.armorBonusPercent,
      unitWeaponBonusPercent: getShipUpgradeBonusMap(
        state.shipUpgrades,
        entry.empireId,
        fleet.ships,
        'weapons',
      ),
      unitArmorBonusPercent: getShipUpgradeBonusMap(
        state.shipUpgrades,
        entry.empireId,
        fleet.ships,
        'armor',
      ),
      formation: fleet.formation ?? 'line',
      targetPriority: fleet.targetPriority ?? 'balanced',
    },
    {
      empireId: `solar-war-${entry.cycle.factionId}`,
      units: entry.cycle.enemyUnits,
      weaponBonusPercent: 0,
      armorBonusPercent: 0,
      unitWeaponBonusPercent: {},
      unitArmorBonusPercent: {},
      formation: 'wedge',
      targetPriority: 'balanced',
    },
  );
  const attackerRemaining = recoverFleetShipsWithCommander(
    fleet.ships,
    resolution.attackerRemaining,
    commander.recoveryPermille,
    seed ^ 0xa5a5a5a5,
  );
  const survived = Object.keys(attackerRemaining).length > 0;
  const fleets = survived
    ? replaceFleet(state.fleets, {
        ...fleet,
        ships: attackerRemaining,
        status: 'stationed',
        mission: null,
        location: { type: 'planet', planetId: entry.originPlanetId },
      })
    : state.fleets.filter((candidate) => candidate.id !== fleet.id);
  const battleReport: BattleReport = {
    id: `solar-war-battle-${entry.cycle.cycleIndex}-${entry.empireId}`,
    seed,
    resolvedAt: state.clock.elapsedSeconds,
    targetPlanetId: entry.cycle.id,
    attackerEmpireId: entry.empireId,
    defenderEmpireId: `solar-war-${entry.cycle.factionId}`,
    winner: resolution.winner,
    rounds: resolution.rounds,
    attackerInitial: { ...fleet.ships },
    defenderInitial: { ...entry.cycle.enemyUnits },
    attackerRemaining: { ...attackerRemaining },
    defenderRemaining: { ...resolution.defenderRemaining },
    mode: 'pve',
    attackerFormation: fleet.formation ?? 'line',
    attackerTargetPriority: fleet.targetPriority ?? 'balanced',
    defenderFormation: 'wedge',
    defenderTargetPriority: 'balanced',
  };
  return {
    state: { ...state, fleets },
    result: {
      id: `solar-war-result-${entry.cycle.cycleIndex}-${entry.empireId}`,
      entryId: entry.id,
      cycleId: entry.cycle.id,
      cycleIndex: entry.cycle.cycleIndex,
      empireId: entry.empireId,
      fleetId: entry.fleetId,
      originPlanetId: entry.originPlanetId,
      participationKind: entry.participationKind,
      participationId: entry.participationId,
      allianceId: entry.allianceId,
      resolvedAt: state.clock.elapsedSeconds,
      outcome: outcomeFromWinner(resolution.winner),
      score: calculateScore(entry.cycle.enemyUnits, resolution.defenderRemaining),
      attackerInitial: { ...attackerInitial },
      enemyInitial: { ...entry.cycle.enemyUnits },
      attackerRemaining: { ...attackerRemaining },
      enemyRemaining: { ...resolution.defenderRemaining },
      battleReport,
    },
  };
}

function empireOrder(state: GameState, empireId: string): number {
  const index = state.empires.indexOf(empireId);
  return index < 0 ? Number.MAX_SAFE_INTEGER : index;
}

export function applySolarWarResolutionEvent(
  state: GameState,
  event: ScheduledGameEvent,
): GameState {
  if (event.payload.type !== 'SOLAR_WAR_RESOLVE') return state;
  const cycleId = event.payload.cycleId;
  const participation = state.endgameParticipation;
  if (participation === undefined) return state;
  const entries = participation.solarWar.activeEntries
    .filter((entry) => entry.cycle.id === cycleId)
    .sort((left, right) =>
      empireOrder(state, left.empireId) - empireOrder(state, right.empireId) ||
      left.empireId.localeCompare(right.empireId),
    );
  if (entries.length === 0) return state;

  let working = state;
  const results: SolarWarResult[] = [];
  for (const entry of entries) {
    const resolved = resolveEntry(working, entry);
    working = resolved.state;
    results.push(resolved.result);
  }
  const current = working.endgameParticipation as EndgameParticipationState;
  return {
    ...working,
    endgameParticipation: {
      ...current,
      solarWar: {
        activeEntries: current.solarWar.activeEntries.filter(
          (entry) => entry.cycle.id !== cycleId,
        ),
        history: retainNewest(
          [...current.solarWar.history, ...results],
          SOLAR_WAR_HISTORY_LIMIT,
        ),
      },
    },
  };
}
