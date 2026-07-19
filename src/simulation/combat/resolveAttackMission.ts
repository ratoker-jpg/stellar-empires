import type { FleetState } from '../fleets/types';
import type { PlanetState } from '../planet/types';
import { AEGIS_RESEARCH_CATALOG } from '../research/catalog';
import { calculateResearchEffects } from '../research/progression';
import { getEmpireResearch } from '../research/researchState';
import type { GameState } from '../types';
import { getUnitDefinition } from '../units/catalog';
import { resolveBattle } from './resolveBattle';
import type { BattleReport } from './types';

function getCombatEffects(state: GameState, empireId: string) {
  const research = getEmpireResearch(state.research, empireId);
  const effects =
    research === undefined
      ? undefined
      : calculateResearchEffects(research, AEGIS_RESEARCH_CATALOG);
  return {
    weaponBonusPercent: effects?.weaponStrengthPercent ?? 0,
    armorBonusPercent: effects?.armorStrengthPercent ?? 0,
  };
}

function mergeUnits(
  target: Record<string, number>,
  source: Readonly<Record<string, number>>,
): void {
  for (const [unitId, count] of Object.entries(source)) {
    target[unitId] = (target[unitId] ?? 0) + count;
  }
}

function splitDefenderRemaining(
  remaining: Readonly<Record<string, number>>,
): {
  readonly ships: Readonly<Record<string, number>>;
  readonly defenses: Readonly<Record<string, number>>;
} {
  const ships: Record<string, number> = {};
  const defenses: Record<string, number> = {};
  for (const [unitId, count] of Object.entries(remaining)) {
    const definition = getUnitDefinition(unitId);
    if (definition?.kind === 'ship') ships[unitId] = count;
    if (definition?.kind === 'defense') defenses[unitId] = count;
  }
  return { ships, defenses };
}

function redistributeDefenderShips(
  fleets: readonly FleetState[],
  targetPlanetId: string,
  defenderEmpireId: string,
  remainingShips: Readonly<Record<string, number>>,
): readonly FleetState[] {
  const available = { ...remainingShips };
  const result: FleetState[] = [];

  for (const fleet of fleets) {
    const isDefender =
      fleet.empireId === defenderEmpireId &&
      fleet.status === 'stationed' &&
      fleet.location.type === 'planet' &&
      fleet.location.planetId === targetPlanetId;
    if (!isDefender) {
      result.push(fleet);
      continue;
    }

    const ships: Record<string, number> = {};
    for (const [unitId, originalCount] of Object.entries(fleet.ships)) {
      const assigned = Math.min(originalCount, available[unitId] ?? 0);
      if (assigned > 0) {
        ships[unitId] = assigned;
        available[unitId] = (available[unitId] ?? 0) - assigned;
      }
    }
    if (Object.keys(ships).length > 0) result.push({ ...fleet, ships });
  }

  return result;
}

export interface AttackMissionResolution {
  readonly state: GameState;
  readonly report: BattleReport;
  readonly attackerFleet: FleetState | undefined;
}

export function resolveAttackMission(
  state: GameState,
  attackerFleet: FleetState,
  target: PlanetState,
  eventSequence: number,
): AttackMissionResolution {
  const defenderUnits: Record<string, number> = {};
  mergeUnits(defenderUnits, target.inventory.defenses);
  for (const fleet of state.fleets) {
    if (
      fleet.empireId === target.ownerEmpireId &&
      fleet.status === 'stationed' &&
      fleet.location.type === 'planet' &&
      fleet.location.planetId === target.id
    ) {
      mergeUnits(defenderUnits, fleet.ships);
    }
  }

  const seed = (state.seed ^ eventSequence ^ attackerFleet.id.length) >>> 0;
  const resolution = resolveBattle(
    seed,
    {
      empireId: attackerFleet.empireId,
      units: attackerFleet.ships,
      ...getCombatEffects(state, attackerFleet.empireId),
    },
    {
      empireId: target.ownerEmpireId,
      units: defenderUnits,
      ...getCombatEffects(state, target.ownerEmpireId),
    },
  );
  const defenderRemaining = splitDefenderRemaining(resolution.defenderRemaining);
  const updatedTarget: PlanetState = {
    ...target,
    inventory: {
      ...target.inventory,
      defenses: defenderRemaining.defenses,
    },
  };
  let fleets = redistributeDefenderShips(
    state.fleets,
    target.id,
    target.ownerEmpireId,
    defenderRemaining.ships,
  );
  const attackerSurvived = Object.keys(resolution.attackerRemaining).length > 0;
  const updatedAttacker = attackerSurvived
    ? { ...attackerFleet, ships: resolution.attackerRemaining }
    : undefined;
  fleets = updatedAttacker === undefined
    ? fleets.filter((fleet) => fleet.id !== attackerFleet.id)
    : fleets.map((fleet) =>
        fleet.id === attackerFleet.id ? updatedAttacker : fleet,
      );

  const report: BattleReport = {
    id: `battle-${eventSequence}-${attackerFleet.id}`,
    seed,
    resolvedAt: state.clock.elapsedSeconds,
    targetPlanetId: target.id,
    attackerEmpireId: attackerFleet.empireId,
    defenderEmpireId: target.ownerEmpireId,
    winner: resolution.winner,
    rounds: resolution.rounds,
    attackerInitial: { ...attackerFleet.ships },
    defenderInitial: defenderUnits,
    attackerRemaining: resolution.attackerRemaining,
    defenderRemaining: resolution.defenderRemaining,
  };

  return {
    state: {
      ...state,
      planets: state.planets.map((planet) =>
        planet.id === target.id ? updatedTarget : planet,
      ),
      fleets,
    },
    report,
    attackerFleet: updatedAttacker,
  };
}
