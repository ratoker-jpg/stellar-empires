import { BOT_LOGISTICS_RESERVE_PERMILLE } from './colonyLogisticsPlanner';
import { getBotProgressionPhase } from './progressionPhase';
import type { BotPersonality, BotProfile } from './profiles';
import type { FleetState } from '../fleets/types';
import { canAfford } from '../planet/buildingProgression';
import {
  getArenaChallenges,
} from '../pveMeta/arena';
import type {
  ArenaChallenge,
  ArenaDifficulty,
} from '../pveMeta/reputation';
import { executeCommand } from '../reducer';
import type { GameCommand, GameState } from '../types';
import { getUnitDefinition } from '../units/catalog';

export type BotArenaReasonCode =
  | 'arena-selected'
  | 'arena-locked'
  | 'arena-entry-active'
  | 'arena-no-ready-fleet'
  | 'arena-safety-threshold'
  | 'arena-gas-reserve-protected'
  | 'arena-entry-cost-unaffordable'
  | 'arena-validator-rejected';

export interface BotArenaParticipationPlan {
  readonly empireId: string;
  readonly personality: BotPersonality;
  readonly reasonCode: BotArenaReasonCode;
  readonly availabilityCode: string | null;
  readonly explanation: string;
  readonly selectedChallengeId: string | null;
  readonly selectedFleetId: string | null;
  readonly command: GameCommand | null;
}

interface FleetCandidate {
  readonly fleet: FleetState;
  readonly power: number;
}

const ARENA_SAFETY_PERMILLE = 1_200;

const DIFFICULTY_ORDER: Readonly<Record<BotPersonality, readonly ArenaDifficulty[]>> = {
  explorer: ['patrol', 'assault', 'elite'],
  industrial: ['assault', 'patrol', 'elite'],
  aggressive: ['elite', 'assault', 'patrol'],
};

function blockedPlan(
  profile: BotProfile,
  reasonCode: BotArenaReasonCode,
  availabilityCode: string | null,
  explanation: string,
  selectedChallengeId: string | null = null,
  selectedFleetId: string | null = null,
): BotArenaParticipationPlan {
  return {
    empireId: profile.empireId,
    personality: profile.personality,
    reasonCode,
    availabilityCode,
    explanation,
    selectedChallengeId,
    selectedFleetId,
    command: null,
  };
}

function compositionPower(ships: Readonly<Record<string, number>>): number {
  return Object.entries(ships).reduce((total, [unitId, quantity]) => {
    if (quantity <= 0) return total;
    const stats = getUnitDefinition(unitId)?.stats;
    return stats === undefined
      ? total
      : total + quantity * (stats.attack * 2 + stats.armor + stats.shield);
  }, 0);
}

function hasOffensiveShip(ships: Readonly<Record<string, number>>): boolean {
  return Object.entries(ships).some(([unitId, quantity]) =>
    quantity > 0 && (getUnitDefinition(unitId)?.stats.attack ?? 0) > 0,
  );
}

function readyFleetCandidates(
  state: GameState,
  empireId: string,
): readonly FleetCandidate[] {
  return state.fleets
    .filter((fleet) =>
      fleet.empireId === empireId &&
      fleet.status === 'stationed' &&
      fleet.location.type === 'planet' &&
      fleet.mission === null &&
      hasOffensiveShip(fleet.ships),
    )
    .map((fleet) => ({ fleet, power: compositionPower(fleet.ships) }))
    .filter((candidate) => candidate.power > 0)
    .sort((left, right) =>
      right.power - left.power || left.fleet.id.localeCompare(right.fleet.id),
    );
}

function orderedChallenges(
  state: GameState,
  personality: BotPersonality,
): readonly ArenaChallenge[] {
  const order = DIFFICULTY_ORDER[personality];
  return [...getArenaChallenges(state)].sort((left, right) =>
    order.indexOf(left.difficulty) - order.indexOf(right.difficulty) ||
    left.slot - right.slot ||
    left.id.localeCompare(right.id),
  );
}

function isSafeMatchup(fleetPower: number, challenge: ArenaChallenge): boolean {
  const enemyPower = compositionPower(challenge.enemyUnits);
  return fleetPower * 1_000 >= Math.max(1, enemyPower) * ARENA_SAFETY_PERMILLE;
}

function gasReserveAllows(
  state: GameState,
  fleet: FleetState,
  challenge: ArenaChallenge,
): boolean {
  if (fleet.location.type !== 'planet') return false;
  const origin = state.planets.find((planet) =>
    planet.id === fleet.location.planetId && planet.ownerEmpireId === fleet.empireId,
  );
  if (origin === undefined) return false;
  const gas = origin.economy.resources.gas;
  const reserve = Math.floor(
    (gas.capacity * BOT_LOGISTICS_RESERVE_PERMILLE) / 1_000,
  );
  return gas.amount - challenge.entryCost.gas >= reserve;
}

function canPayEntry(
  state: GameState,
  fleet: FleetState,
  challenge: ArenaChallenge,
): boolean {
  if (fleet.location.type !== 'planet') return false;
  const origin = state.planets.find((planet) =>
    planet.id === fleet.location.planetId && planet.ownerEmpireId === fleet.empireId,
  );
  return origin !== undefined && canAfford(origin.economy, challenge.entryCost);
}

function selectedPlan(
  profile: BotProfile,
  challenge: ArenaChallenge,
  fleet: FleetState,
  command: GameCommand,
): BotArenaParticipationPlan {
  return {
    empireId: profile.empireId,
    personality: profile.personality,
    reasonCode: 'arena-selected',
    availabilityCode: null,
    explanation:
      `${challenge.difficulty} ${challenge.id}: публичный Arena challenge выбран ` +
      `обычной командой для собственного готового флота ${fleet.id}.`,
    selectedChallengeId: challenge.id,
    selectedFleetId: fleet.id,
    command,
  };
}

export function planBotArenaParticipation(
  state: GameState,
  profile: BotProfile,
): BotArenaParticipationPlan {
  const phase = getBotProgressionPhase(state, profile.empireId);
  if (phase !== 'planet-destruction' && phase !== 'endgame-preparation') {
    return blockedPlan(
      profile,
      'arena-locked',
      'BOT_ARENA_PROGRESSION_LOCKED',
      `Routine Arena planning requires planet-destruction capability; current phase is ${phase}.`,
    );
  }

  if (state.pveMeta?.activeArenaEntries.some(
    (entry) => entry.empireId === profile.empireId,
  )) {
    return blockedPlan(
      profile,
      'arena-entry-active',
      'ARENA_ENTRY_ACTIVE',
      'Empire already has an active Arena entry.',
    );
  }

  const fleets = readyFleetCandidates(state, profile.empireId);
  if (fleets.length === 0) {
    return blockedPlan(
      profile,
      'arena-no-ready-fleet',
      'BOT_ARENA_READY_FLEET_REQUIRED',
      'Arena requires an owned idle stationed fleet with offensive ships.',
    );
  }

  let sawSafeMatchup = false;
  let sawGasReserveBlock = false;
  let sawEntryCostBlock = false;
  let lastValidation: { readonly code: string; readonly message: string } | null = null;

  for (const challenge of orderedChallenges(state, profile.personality)) {
    for (const candidate of fleets) {
      if (!isSafeMatchup(candidate.power, challenge)) continue;
      sawSafeMatchup = true;
      if (!canPayEntry(state, candidate.fleet, challenge)) {
        sawEntryCostBlock = true;
        continue;
      }
      if (!gasReserveAllows(state, candidate.fleet, challenge)) {
        sawGasReserveBlock = true;
        continue;
      }

      const command: GameCommand = {
        type: 'ENTER_ARENA_CHALLENGE',
        empireId: profile.empireId,
        fleetId: candidate.fleet.id,
        challengeId: challenge.id,
      };
      const validation = executeCommand(state, command);
      if (validation.ok) {
        return selectedPlan(profile, challenge, candidate.fleet, command);
      }
      lastValidation = { code: validation.code, message: validation.message };
    }
  }

  if (!sawSafeMatchup) {
    return blockedPlan(
      profile,
      'arena-safety-threshold',
      'BOT_ARENA_MATCHUP_UNSAFE',
      'No public Arena challenge meets the ordinary 120% fleet-readiness threshold.',
    );
  }
  if (sawGasReserveBlock) {
    return blockedPlan(
      profile,
      'arena-gas-reserve-protected',
      'BOT_ARENA_GAS_RESERVE',
      'Arena entry would reduce the origin colony below the mandatory 40% gas reserve.',
    );
  }
  if (sawEntryCostBlock) {
    return blockedPlan(
      profile,
      'arena-entry-cost-unaffordable',
      'ARENA_ENTRY_COST_UNAFFORDABLE',
      'No safe Arena challenge can be paid from the selected fleet origin.',
    );
  }
  return blockedPlan(
    profile,
    'arena-validator-rejected',
    lastValidation?.code ?? 'ARENA_CHALLENGE_UNAVAILABLE',
    lastValidation?.message ?? 'Arena entry was rejected by the ordinary command validator.',
  );
}
