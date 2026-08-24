import {
  getCommanderFleetEffects,
  recoverFleetShipsWithCommander,
} from '../command/commanderShips';
import { getCommandCombatEffects } from '../command/commandDoctrine';
import { stableFleetIdentityContribution } from '../combat/combatIdentity';
import type { FleetFormation, FleetTargetPriority } from '../combat/fleetDoctrine';
import { resolveBattle } from '../combat/resolveBattle';
import type { ResourceCost, ResourceId } from '../economy/types';
import { getResearchEffectsForEmpire } from '../factions/factionResearchEffects';
import { getFactionMechanicalRoles } from '../factions/factionMechanicalRoles';
import { enqueueEvent } from '../eventQueue';
import type { FleetState } from '../fleets/types';
import { appendCommandHistory, retainNewest } from '../history/stateHistory';
import type { PlanetState } from '../planet/types';
import { canAfford, spendResources } from '../planet/buildingProgression';
import type {
  CommandResult,
  GameCommand,
  GameState,
  ScheduledGameEvent,
} from '../types';
import { getShipUpgradeBonusMap } from '../upgrades/shipUpgrades';
import {
  ARENA_HISTORY_LIMIT,
  awardPveReputation,
  createInitialPveMetaState,
  type ArenaChallenge,
  type ArenaDifficulty,
  type ArenaEntry,
  type ArenaResult,
  type PveMetaState,
} from './reputation';

export const ARENA_CYCLE_SECONDS = 21_600;
export const ARENA_CHALLENGE_COUNT = 3;

const DIFFICULTIES: readonly ArenaDifficulty[] = ['patrol', 'assault', 'elite'];
const FACTIONS = ['aegis', 'synod', 'veyra'] as const;
const RESOURCE_IDS: readonly ResourceId[] = ['metal', 'crystal', 'gas'];

const ENTRY_COSTS: Readonly<Record<ArenaDifficulty, ResourceCost>> = {
  patrol: { metal: 500, crystal: 250, gas: 100 },
  assault: { metal: 1_500, crystal: 750, gas: 300 },
  elite: { metal: 4_000, crystal: 2_000, gas: 800 },
};

const VICTORY_REWARDS: Readonly<Record<ArenaDifficulty, ResourceCost>> = {
  patrol: { metal: 1_200, crystal: 600, gas: 200 },
  assault: { metal: 4_000, crystal: 2_000, gas: 700 },
  elite: { metal: 10_000, crystal: 5_000, gas: 1_800 },
};

const DURATION_SECONDS: Readonly<Record<ArenaDifficulty, number>> = {
  patrol: 900,
  assault: 1_800,
  elite: 3_600,
};

const REPUTATION_AWARDS: Readonly<Record<ArenaDifficulty, number>> = {
  patrol: 10,
  assault: 20,
  elite: 35,
};

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

function copyCost(cost: ResourceCost): ResourceCost {
  return { metal: cost.metal, crystal: cost.crystal, gas: cost.gas };
}

function createEnemyUnits(
  factionId: (typeof FACTIONS)[number],
  difficulty: ArenaDifficulty,
  seed: number,
): Readonly<Record<string, number>> {
  const ships = getFactionMechanicalRoles(factionId).ships;
  let random = nextRandom(seed);
  const take = (base: number, spread: number): number => {
    random = nextRandom(random);
    return base + (random % (spread + 1));
  };

  if (difficulty === 'patrol') {
    return {
      [ships.fighter]: take(6, 4),
      [ships.frigate]: take(1, 2),
    };
  }
  if (difficulty === 'assault') {
    return {
      [ships.fighter]: take(16, 8),
      [ships.frigate]: take(5, 4),
      [ships.corvette]: take(2, 3),
    };
  }
  return {
    [ships.fighter]: take(30, 12),
    [ships.frigate]: take(11, 6),
    [ships.corvette]: take(6, 4),
    [ships.cruiser]: take(3, 3),
  };
}

export function getArenaCycleIndex(elapsedSeconds: number): number {
  if (!Number.isSafeInteger(elapsedSeconds) || elapsedSeconds < 0) {
    throw new Error('Arena time must be a non-negative safe integer.');
  }
  return Math.floor(elapsedSeconds / ARENA_CYCLE_SECONDS);
}

export function getArenaChallenges(
  state: Pick<GameState, 'seed' | 'clock'>,
): readonly ArenaChallenge[] {
  const cycleIndex = getArenaCycleIndex(state.clock.elapsedSeconds);
  return DIFFICULTIES.map((difficulty, slotIndex): ArenaChallenge => {
    const slot = slotIndex as 0 | 1 | 2;
    const challengeSeed = mixSeed(
      state.seed ^ Math.imul(cycleIndex + 1, 0x9e3779b1) ^ Math.imul(slot + 1, 0x85ebca6b),
    );
    const factionId = FACTIONS[challengeSeed % FACTIONS.length]!;
    return {
      id: `arena-${cycleIndex}-${slot}`,
      cycleIndex,
      slot,
      difficulty,
      factionId,
      enemyUnits: createEnemyUnits(factionId, difficulty, challengeSeed),
      entryCost: copyCost(ENTRY_COSTS[difficulty]),
      reward: copyCost(VICTORY_REWARDS[difficulty]),
      durationSeconds: DURATION_SECONDS[difficulty],
      combatSeed: challengeSeed,
    };
  });
}

function getPveMeta(state: GameState): PveMetaState {
  return state.pveMeta ?? createInitialPveMetaState(state.empires);
}

function replaceFleet(
  fleets: readonly FleetState[],
  replacement: FleetState,
): readonly FleetState[] {
  return fleets.map((fleet) => fleet.id === replacement.id ? replacement : fleet);
}

function replacePlanet(
  planets: readonly PlanetState[],
  replacement: PlanetState,
): readonly PlanetState[] {
  return planets.map((planet) => planet.id === replacement.id ? replacement : planet);
}

function appendArenaResult(
  pveMeta: PveMetaState,
  result: ArenaResult,
): PveMetaState {
  return {
    ...pveMeta,
    arenaHistory: retainNewest(
      [...pveMeta.arenaHistory, result],
      ARENA_HISTORY_LIMIT,
    ),
  };
}

function createResult(
  entry: ArenaEntry,
  resolvedAt: number,
  outcome: ArenaResult['outcome'],
  attackerInitial: Readonly<Record<string, number>>,
  attackerRemaining: Readonly<Record<string, number>>,
  enemyRemaining: Readonly<Record<string, number>>,
  rewardGranted: ResourceCost,
  reputationAward: number,
): ArenaResult {
  return {
    id: `arena-result-${entry.id}`,
    entryId: entry.id,
    challengeId: entry.challenge.id,
    empireId: entry.empireId,
    fleetId: entry.fleetId,
    difficulty: entry.challenge.difficulty,
    resolvedAt,
    outcome,
    attackerInitial: { ...attackerInitial },
    enemyInitial: { ...entry.challenge.enemyUnits },
    attackerRemaining: { ...attackerRemaining },
    enemyRemaining: { ...enemyRemaining },
    rewardGranted: copyCost(rewardGranted),
    reputationAward,
  };
}

export function enterArenaChallenge(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'ENTER_ARENA_CHALLENGE' }>,
): CommandResult<GameState> {
  const pveMeta = getPveMeta(state);
  if (pveMeta.activeArenaEntries.some((entry) => entry.empireId === command.empireId)) {
    return {
      ok: false,
      code: 'ARENA_ENTRY_ACTIVE',
      message: 'Empire already has an active Arena entry.',
    };
  }
  const challenge = getArenaChallenges(state).find(
    (candidate) => candidate.id === command.challengeId,
  );
  if (challenge === undefined) {
    return {
      ok: false,
      code: 'ARENA_CHALLENGE_UNAVAILABLE',
      message: 'Arena challenge is not available in the current cycle.',
    };
  }
  const fleet = state.fleets.find((candidate) => candidate.id === command.fleetId);
  if (fleet === undefined || fleet.empireId !== command.empireId) {
    return { ok: false, code: 'ARENA_FLEET_NOT_FOUND', message: 'Arena fleet is unavailable.' };
  }
  if (fleet.status !== 'stationed' || fleet.location.type !== 'planet' || fleet.mission !== null) {
    return {
      ok: false,
      code: 'ARENA_FLEET_NOT_IDLE',
      message: 'Arena entry requires an owned idle stationed fleet.',
    };
  }
  const originPlanetId = fleet.location.planetId;
  const origin = state.planets.find((planet) => planet.id === originPlanetId);
  if (origin === undefined || origin.ownerEmpireId !== command.empireId) {
    return {
      ok: false,
      code: 'ARENA_ORIGIN_UNAVAILABLE',
      message: 'Arena entry requires an owned origin planet.',
    };
  }
  if (!canAfford(origin.economy, challenge.entryCost)) {
    return {
      ok: false,
      code: 'ARENA_ENTRY_COST_UNAFFORDABLE',
      message: 'Origin planet cannot afford the Arena entry cost.',
      details: { entryCost: challenge.entryCost },
    };
  }

  const sequence = state.nextEventSequence;
  const entry: ArenaEntry = {
    id: `arena-entry-${sequence}-${command.empireId}`,
    empireId: command.empireId,
    fleetId: fleet.id,
    originPlanetId: origin.id,
    challenge,
    enteredAt: state.clock.elapsedSeconds,
    resolvesAt: state.clock.elapsedSeconds + challenge.durationSeconds,
    resolutionSeed: mixSeed(
      challenge.combatSeed ^ sequence ^ stableFleetIdentityContribution(fleet.id),
    ),
  };
  const event: ScheduledGameEvent = {
    id: `event-${sequence}`,
    executeAt: entry.resolvesAt,
    sequence,
    payload: { type: 'ARENA_RESOLVE', entryId: entry.id },
  };
  const heldFleet: FleetState = {
    ...fleet,
    status: 'holding',
  };
  const paidOrigin: PlanetState = {
    ...origin,
    economy: spendResources(origin.economy, challenge.entryCost),
  };

  return {
    ok: true,
    value: {
      ...state,
      planets: replacePlanet(state.planets, paidOrigin),
      fleets: replaceFleet(state.fleets, heldFleet),
      pveMeta: {
        ...pveMeta,
        activeArenaEntries: [...pveMeta.activeArenaEntries, entry],
      },
      nextEventSequence: sequence + 1,
      pendingEvents: enqueueEvent(state.pendingEvents, event),
      commandLog: appendCommandHistory(state.commandLog, command),
    },
  };
}

export function withdrawArenaEntry(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'WITHDRAW_ARENA_ENTRY' }>,
): CommandResult<GameState> {
  const pveMeta = getPveMeta(state);
  const entry = pveMeta.activeArenaEntries.find(
    (candidate) => candidate.id === command.entryId && candidate.empireId === command.empireId,
  );
  if (entry === undefined) {
    return { ok: false, code: 'ARENA_ENTRY_NOT_FOUND', message: 'Active Arena entry was not found.' };
  }
  const fleet = state.fleets.find((candidate) => candidate.id === entry.fleetId);
  const fleets = fleet === undefined
    ? state.fleets
    : replaceFleet(state.fleets, {
        ...fleet,
        status: 'stationed',
        mission: null,
        location: { type: 'planet', planetId: entry.originPlanetId },
      });
  const result = createResult(
    entry,
    state.clock.elapsedSeconds,
    'withdrawn',
    fleet?.ships ?? {},
    fleet?.ships ?? {},
    entry.challenge.enemyUnits,
    { metal: 0, crystal: 0, gas: 0 },
    0,
  );
  const withoutEntry: PveMetaState = {
    ...pveMeta,
    activeArenaEntries: pveMeta.activeArenaEntries.filter(
      (candidate) => candidate.id !== entry.id,
    ),
  };

  return {
    ok: true,
    value: {
      ...state,
      fleets,
      pveMeta: appendArenaResult(withoutEntry, result),
      pendingEvents: state.pendingEvents.filter(
        (event) => !(event.payload.type === 'ARENA_RESOLVE' && event.payload.entryId === entry.id),
      ),
      commandLog: appendCommandHistory(state.commandLog, command),
    },
  };
}

function combatFormation(difficulty: ArenaDifficulty): FleetFormation {
  if (difficulty === 'patrol') return 'screen';
  if (difficulty === 'elite') return 'wedge';
  return 'line';
}

function combatPriority(difficulty: ArenaDifficulty): FleetTargetPriority {
  return difficulty === 'elite' ? 'capitals' : 'balanced';
}

function grantReward(
  state: GameState,
  entry: ArenaEntry,
): {
  readonly planets: readonly PlanetState[];
  readonly rewardGranted: ResourceCost;
} {
  const target = state.planets.find(
    (planet) => planet.id === entry.originPlanetId && planet.ownerEmpireId === entry.empireId,
  ) ?? state.planets.find((planet) => planet.ownerEmpireId === entry.empireId);
  if (target === undefined) {
    return { planets: state.planets, rewardGranted: { metal: 0, crystal: 0, gas: 0 } };
  }

  const resources = { ...target.economy.resources };
  const rewardGranted = { metal: 0, crystal: 0, gas: 0 };
  for (const resourceId of RESOURCE_IDS) {
    const stock = resources[resourceId];
    const granted = Math.min(entry.challenge.reward[resourceId], stock.capacity - stock.amount);
    resources[resourceId] = { ...stock, amount: stock.amount + granted };
    rewardGranted[resourceId] = granted;
  }
  return {
    planets: replacePlanet(state.planets, {
      ...target,
      economy: { ...target.economy, resources },
    }),
    rewardGranted,
  };
}

export function applyArenaResolutionEvent(
  state: GameState,
  event: ScheduledGameEvent,
): GameState {
  if (event.payload.type !== 'ARENA_RESOLVE') return state;
  const entryId = event.payload.entryId;
  const pveMeta = getPveMeta(state);
  const entry = pveMeta.activeArenaEntries.find(
    (candidate) => candidate.id === entryId,
  );
  if (entry === undefined) return state;
  const fleet = state.fleets.find(
    (candidate) => candidate.id === entry.fleetId && candidate.empireId === entry.empireId,
  );
  const withoutEntry: PveMetaState = {
    ...pveMeta,
    activeArenaEntries: pveMeta.activeArenaEntries.filter(
      (candidate) => candidate.id !== entry.id,
    ),
  };

  if (fleet === undefined) {
    const result = createResult(
      entry,
      state.clock.elapsedSeconds,
      'defeat',
      {},
      {},
      entry.challenge.enemyUnits,
      { metal: 0, crystal: 0, gas: 0 },
      0,
    );
    return { ...state, pveMeta: appendArenaResult(withoutEntry, result) };
  }

  const research = getResearchEffectsForEmpire(state, entry.empireId);
  const command = getCommandCombatEffects(state.commanders, entry.empireId, fleet.id);
  const commander = getCommanderFleetEffects(state, fleet);
  const seed = entry.resolutionSeed ??
    mixSeed(entry.challenge.combatSeed ^ event.sequence ^ fleet.id.length);
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
      empireId: `arena-${entry.challenge.factionId}`,
      units: entry.challenge.enemyUnits,
      weaponBonusPercent: 0,
      armorBonusPercent: 0,
      unitWeaponBonusPercent: {},
      unitArmorBonusPercent: {},
      formation: combatFormation(entry.challenge.difficulty),
      targetPriority: combatPriority(entry.challenge.difficulty),
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
  const victory = resolution.winner === 'attacker';
  const granted = victory
    ? grantReward(state, entry)
    : { planets: state.planets, rewardGranted: { metal: 0, crystal: 0, gas: 0 } as ResourceCost };
  const reputationAward = victory ? REPUTATION_AWARDS[entry.challenge.difficulty] : 0;
  const outcome: ArenaResult['outcome'] = resolution.winner === 'attacker'
    ? 'victory'
    : resolution.winner === 'defender'
      ? 'defeat'
      : 'draw';
  const result = createResult(
    entry,
    state.clock.elapsedSeconds,
    outcome,
    fleet.ships,
    attackerRemaining,
    resolution.defenderRemaining,
    granted.rewardGranted,
    reputationAward,
  );
  const awarded = reputationAward > 0
    ? awardPveReputation(withoutEntry, entry.empireId, reputationAward)
    : withoutEntry;

  return {
    ...state,
    planets: granted.planets,
    fleets,
    pveMeta: appendArenaResult(awarded, result),
  };
}
