import { appendCommandHistory } from '../history/stateHistory';
import type { BattleReport } from '../combat/types';
import type { GameCommand, GameState } from '../types';
import { getUnitDefinition } from '../units/catalog';
import type {
  CommandCombatEffects,
  CommandDoctrineId,
  EmpireCommandState,
} from './types';

export interface CommandDoctrineDefinition {
  readonly id: CommandDoctrineId;
  readonly name: string;
  readonly description: string;
  readonly weaponBonusPercent: number;
  readonly armorBonusPercent: number;
  readonly experiencePermille: number;
}

export const COMMAND_LEVEL_THRESHOLDS = [0, 100, 300, 700, 1_500] as const;
export const COMMAND_MAX_LEVEL = COMMAND_LEVEL_THRESHOLDS.length;
export const FLAGSHIP_UNLOCK_LEVEL = 2;

export const COMMAND_DOCTRINES: Readonly<
  Record<CommandDoctrineId, CommandDoctrineDefinition>
> = {
  vanguard: {
    id: 'vanguard',
    name: 'Доктрина авангарда',
    description: 'Агрессивное управление огнём: +8% атака, −2% защита.',
    weaponBonusPercent: 8,
    armorBonusPercent: -2,
    experiencePermille: 1_000,
  },
  sentinel: {
    id: 'sentinel',
    name: 'Доктрина стража',
    description: 'Удержание строя: +10% защита, −3% атака.',
    weaponBonusPercent: -3,
    armorBonusPercent: 10,
    experiencePermille: 1_000,
  },
  adaptive: {
    id: 'adaptive',
    name: 'Адаптивное командование',
    description: 'Сбалансированные приказы и ускоренное обучение: +4% атака, +4% защита, +10% опыта.',
    weaponBonusPercent: 4,
    armorBonusPercent: 4,
    experiencePermille: 1_100,
  },
};

export function isCommandDoctrineId(value: unknown): value is CommandDoctrineId {
  return value === 'vanguard' || value === 'sentinel' || value === 'adaptive';
}

export function calculateCommandLevel(experience: number): number {
  const normalized = Math.max(0, Math.floor(experience));
  let level = 1;
  for (const [index, threshold] of COMMAND_LEVEL_THRESHOLDS.entries()) {
    if (normalized >= threshold) level = index + 1;
  }
  return Math.min(COMMAND_MAX_LEVEL, level);
}

export function createInitialCommandStates(
  empireIds: readonly string[],
): readonly EmpireCommandState[] {
  return empireIds.map((empireId) => ({
    empireId,
    doctrineId: 'adaptive',
    experience: 0,
    level: 1,
    flagshipFleetId: null,
  }));
}

export function getEmpireCommandState(
  states: readonly EmpireCommandState[],
  empireId: string,
): EmpireCommandState | undefined {
  return states.find((state) => state.empireId === empireId);
}

function replaceCommandState(
  states: readonly EmpireCommandState[],
  replacement: EmpireCommandState,
): readonly EmpireCommandState[] {
  return states.map((state) =>
    state.empireId === replacement.empireId ? replacement : state,
  );
}

function appendCommand(state: GameState, command: GameCommand): GameState['commandLog'] {
  return appendCommandHistory(state.commandLog, command);
}

export function addCommandExperience(
  states: readonly EmpireCommandState[],
  empireId: string,
  baseAmount: number,
): readonly EmpireCommandState[] {
  const current = getEmpireCommandState(states, empireId);
  if (current === undefined || baseAmount <= 0) return states;
  const doctrine = COMMAND_DOCTRINES[current.doctrineId];
  const gained = Math.max(1, Math.floor((baseAmount * doctrine.experiencePermille) / 1_000));
  const experience = current.experience + gained;
  return replaceCommandState(states, {
    ...current,
    experience,
    level: calculateCommandLevel(experience),
  });
}

export function awardBattleCommandExperience(
  states: readonly EmpireCommandState[],
  report: BattleReport,
): readonly EmpireCommandState[] {
  const rounds = Math.max(1, report.rounds.length);
  const attackerBase = 18 + rounds * 4 + (report.winner === 'attacker' ? 24 : 8);
  const defenderBase = 18 + rounds * 4 + (report.winner === 'defender' ? 24 : 8);
  return addCommandExperience(
    addCommandExperience(states, report.attackerEmpireId, attackerBase),
    report.defenderEmpireId,
    defenderBase,
  );
}

export function setCommandDoctrine(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'SET_COMMAND_DOCTRINE' }>,
) {
  const current = getEmpireCommandState(state.commanders, command.empireId);
  if (current === undefined) {
    return { ok: false, code: 'COMMAND_STATE_NOT_FOUND', message: 'Command profile is unavailable.' } as const;
  }
  return {
    ok: true,
    value: {
      ...state,
      commanders: replaceCommandState(state.commanders, {
        ...current,
        doctrineId: command.doctrineId,
      }),
      commandLog: appendCommand(state, command),
    },
  } as const;
}

export function assignFlagship(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'ASSIGN_FLAGSHIP' }>,
) {
  const current = getEmpireCommandState(state.commanders, command.empireId);
  if (current === undefined) {
    return { ok: false, code: 'COMMAND_STATE_NOT_FOUND', message: 'Command profile is unavailable.' } as const;
  }
  if (command.fleetId === null) {
    return {
      ok: true,
      value: {
        ...state,
        commanders: replaceCommandState(state.commanders, {
          ...current,
          flagshipFleetId: null,
        }),
        commandLog: appendCommand(state, command),
      },
    } as const;
  }
  if (current.level < FLAGSHIP_UNLOCK_LEVEL) {
    return {
      ok: false,
      code: 'FLAGSHIP_LEVEL_REQUIRED',
      message: `Command level ${FLAGSHIP_UNLOCK_LEVEL} is required to appoint a flagship.`,
    } as const;
  }
  const fleet = state.fleets.find((candidate) => candidate.id === command.fleetId);
  if (
    fleet === undefined ||
    fleet.empireId !== command.empireId ||
    fleet.status !== 'stationed' ||
    fleet.location.type !== 'planet'
  ) {
    return { ok: false, code: 'FLAGSHIP_FLEET_UNAVAILABLE', message: 'Flagship fleet must be owned and stationed.' } as const;
  }
  const hasArmedShip = Object.entries(fleet.ships).some(
    ([unitId, count]) => count > 0 && (getUnitDefinition(unitId)?.stats.attack ?? 0) > 0,
  );
  if (!hasArmedShip) {
    return { ok: false, code: 'FLAGSHIP_ARMED_SHIP_REQUIRED', message: 'Flagship fleet requires an armed ship.' } as const;
  }
  return {
    ok: true,
    value: {
      ...state,
      commanders: replaceCommandState(state.commanders, {
        ...current,
        flagshipFleetId: fleet.id,
      }),
      commandLog: appendCommand(state, command),
    },
  } as const;
}

export function getCommandCombatEffects(
  states: readonly EmpireCommandState[],
  empireId: string,
  fleetId?: string,
): CommandCombatEffects {
  const state = getEmpireCommandState(states, empireId);
  if (state === undefined) {
    return {
      weaponBonusPercent: 0,
      armorBonusPercent: 0,
      experiencePermille: 1_000,
      isFlagship: false,
    };
  }
  const doctrine = COMMAND_DOCTRINES[state.doctrineId];
  const levelBonus = Math.max(0, state.level - 1);
  const isFlagship = fleetId !== undefined && state.flagshipFleetId === fleetId;
  return {
    weaponBonusPercent: doctrine.weaponBonusPercent + levelBonus + (isFlagship ? 6 : 0),
    armorBonusPercent: doctrine.armorBonusPercent + levelBonus + (isFlagship ? 6 : 0),
    experiencePermille: doctrine.experiencePermille,
    isFlagship,
  };
}
