import type { FleetState } from '../fleets/types';
import type { GameState } from '../types';
import { getCompleteCommanderShipDefinition } from '../units/completeCommanderShipCatalog';
import { getUnitDefinition } from '../units/catalog';
import type { CommanderAbilityEffect, UnitDefinition } from '../units/types';
import { getEmpireCommandState } from './commandDoctrine';
import type { EmpireCommandState } from './types';

export interface ActiveCommanderShip {
  readonly unitId: string;
  readonly definition: UnitDefinition;
  readonly level: number;
}

export interface CommanderFleetEffects {
  readonly activeCommanderId: string | null;
  readonly activeEffect: CommanderAbilityEffect | null;
  readonly level: number;
  readonly weaponBonusPercent: number;
  readonly armorBonusPercent: number;
  readonly enemyWeaponPenaltyPercent: number;
  readonly enemyArmorPenaltyPercent: number;
  readonly speedBonusPercent: number;
  readonly cargoBonusPercent: number;
  readonly plunderBonusPercent: number;
  readonly recoveryPermille: number;
  readonly spyDetectionBasisPoints: number;
  readonly demolitionBasisPoints: number;
  readonly planetDestructionReductionBasisPoints: number;
  readonly upgradePointsPercent: number;
}

const NO_COMMANDER_EFFECTS: CommanderFleetEffects = {
  activeCommanderId: null,
  activeEffect: null,
  level: 0,
  weaponBonusPercent: 0,
  armorBonusPercent: 0,
  enemyWeaponPenaltyPercent: 0,
  enemyArmorPenaltyPercent: 0,
  speedBonusPercent: 0,
  cargoBonusPercent: 0,
  plunderBonusPercent: 0,
  recoveryPermille: 0,
  spyDetectionBasisPoints: 0,
  demolitionBasisPoints: 0,
  planetDestructionReductionBasisPoints: 0,
  upgradePointsPercent: 0,
};

function hashText(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

export function calculateCommanderAbilityLevel(
  commandLevel: number,
  definition: UnitDefinition,
): number {
  const required = definition.requiredAdmiralLevel ?? Number.POSITIVE_INFINITY;
  const maximum = definition.commanderAbility?.maximumLevel ?? 0;
  if (commandLevel < required || maximum <= 0) return 0;
  return Math.min(maximum, 1 + Math.floor((commandLevel - required) / 4));
}

export function findCommanderShipIds(
  units: Readonly<Record<string, number>>,
): readonly string[] {
  return Object.entries(units)
    .filter(([unitId, quantity]) => quantity > 0 && getUnitDefinition(unitId)?.commanderClass !== undefined)
    .map(([unitId]) => unitId)
    .sort();
}

export function selectActiveCommanderShip(
  commandState: EmpireCommandState | undefined,
  fleetId: string | undefined,
  units: Readonly<Record<string, number>>,
): ActiveCommanderShip | undefined {
  if (
    commandState === undefined ||
    fleetId === undefined ||
    commandState.flagshipFleetId !== fleetId
  ) {
    return undefined;
  }

  return findCommanderShipIds(units)
    .map((unitId) => {
      const definition = getCompleteCommanderShipDefinition(unitId);
      if (definition === undefined || definition.commanderAbility === undefined) return undefined;
      const level = calculateCommanderAbilityLevel(commandState.level, definition);
      return level <= 0 ? undefined : { unitId, definition, level };
    })
    .filter((candidate): candidate is ActiveCommanderShip => candidate !== undefined)
    .sort((left, right) =>
      left.definition.commanderAbility!.battlePriority -
        right.definition.commanderAbility!.battlePriority ||
      left.unitId.localeCompare(right.unitId),
    )[0];
}

function percentFromBasisPoints(basisPoints: number): number {
  return basisPoints <= 0 ? 0 : Math.max(1, Math.ceil(basisPoints / 100));
}

export function getCommanderFleetEffects(
  state: Pick<GameState, 'commanders'>,
  empireId: string,
  fleetId: string | undefined,
  units: Readonly<Record<string, number>>,
): CommanderFleetEffects {
  const active = selectActiveCommanderShip(
    getEmpireCommandState(state.commanders, empireId),
    fleetId,
    units,
  );
  const ability = active?.definition.commanderAbility;
  if (active === undefined || ability === undefined) return NO_COMMANDER_EFFECTS;

  const basisPoints = ability.effectPerLevelBasisPoints * active.level;
  const percent = percentFromBasisPoints(basisPoints);
  const base = {
    ...NO_COMMANDER_EFFECTS,
    activeCommanderId: active.unitId,
    activeEffect: ability.effect,
    level: active.level,
  };

  switch (ability.effect) {
    case 'attack':
    case 'critical':
      return { ...base, weaponBonusPercent: percent };
    case 'vitality':
    case 'repulse':
    case 'planet-shield':
      return {
        ...base,
        armorBonusPercent: percent,
        planetDestructionReductionBasisPoints:
          ability.effect === 'planet-shield' ? basisPoints : 0,
      };
    case 'paralysis':
      return { ...base, enemyWeaponPenaltyPercent: percent };
    case 'armor-break':
      return { ...base, enemyArmorPenaltyPercent: percent };
    case 'speed':
      return { ...base, speedBonusPercent: percent };
    case 'plunder':
      return { ...base, plunderBonusPercent: percent };
    case 'recovery':
      return { ...base, recoveryPermille: Math.max(1, Math.floor(basisPoints / 10)) };
    case 'spy-detection':
      return { ...base, spyDetectionBasisPoints: basisPoints };
    case 'demolition':
      return { ...base, demolitionBasisPoints: basisPoints };
    case 'upgrade-points':
      return { ...base, cargoBonusPercent: percent, upgradePointsPercent: percent };
  }
}

export function getFleetCommanderEffects(
  state: Pick<GameState, 'commanders'>,
  fleet: Pick<FleetState, 'id' | 'empireId' | 'ships'>,
): CommanderFleetEffects {
  return getCommanderFleetEffects(state, fleet.empireId, fleet.id, fleet.ships);
}

export function countCommanderShipForEmpire(
  state: Pick<GameState, 'planets' | 'fleets'>,
  empireId: string,
  commanderId: string,
): number {
  const planets = state.planets
    .filter((planet) => planet.ownerEmpireId === empireId)
    .reduce((total, planet) =>
      total +
      (planet.inventory.ships[commanderId] ?? 0) +
      planet.productionQueues.shipyard.reduce(
        (queued, item) => queued + (item.unitId === commanderId ? item.quantity : 0),
        0,
      ), 0);
  return state.fleets
    .filter((fleet) => fleet.empireId === empireId)
    .reduce((total, fleet) => total + (fleet.ships[commanderId] ?? 0), planets);
}

export function recoverFleetShipsWithCommander(
  initial: Readonly<Record<string, number>>,
  remaining: Readonly<Record<string, number>>,
  recoveryPermille: number,
  seed: number,
): Readonly<Record<string, number>> {
  if (recoveryPermille <= 0) return remaining;
  const result = { ...remaining };
  for (const unitId of Object.keys(initial).sort()) {
    const definition = getUnitDefinition(unitId);
    if (definition?.kind !== 'ship' || definition.commanderClass !== undefined) continue;
    const destroyed = Math.max(0, (initial[unitId] ?? 0) - (remaining[unitId] ?? 0));
    if (destroyed <= 0) continue;
    const scaled = destroyed * recoveryPermille;
    const guaranteed = Math.floor(scaled / 1_000);
    const remainder = scaled % 1_000;
    const bonus = hashText(`${seed}:${unitId}:commander-recovery`) % 1_000 < remainder ? 1 : 0;
    const recovered = Math.min(destroyed, guaranteed + bonus);
    if (recovered > 0) result[unitId] = (result[unitId] ?? 0) + recovered;
  }
  return result;
}
