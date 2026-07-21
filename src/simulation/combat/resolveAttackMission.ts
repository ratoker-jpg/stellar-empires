import {
  addDamagedDefenses,
  calculateRecoveredDefenses,
} from '../defense/planetaryDefense';
import {
  awardBattleCommandExperience,
  getCommandCombatEffects,
} from '../command/commandDoctrine';
import type { ResourceCost } from '../economy/types';
import type { FleetState } from '../fleets/types';
import type { PlanetState } from '../planet/types';
import { PIRATE_EMPIRE_ID } from '../pve/neutralForces';
import {
  applyPvePlunderMultiplier,
  calculatePirateThreatMultiplier,
  calculatePveRewardMultiplier,
  scalePveUnits,
} from '../pve/pveBalance';
import { AEGIS_RESEARCH_CATALOG } from '../research/catalog';
import { calculateResearchEffects } from '../research/progression';
import { getEmpireResearch } from '../research/researchState';
import type { GameState } from '../types';
import { getUnitDefinition } from '../units/catalog';
import { getShipUpgradeBonusMap } from '../upgrades/shipUpgrades';
import {
  addDebrisField,
  calculateDebrisFromLosses,
  plunderPlanet,
  type DebrisAmount,
} from './debris';
import { resolveBattle } from './resolveBattle';
import type { BattleReport } from './types';

function getCombatEffects(
  state: GameState,
  empireId: string,
  units: Readonly<Record<string, number>>,
  fleetId?: string,
) {
  const research = getEmpireResearch(state.research, empireId);
  const effects =
    research === undefined
      ? undefined
      : calculateResearchEffects(research, AEGIS_RESEARCH_CATALOG);
  const command = getCommandCombatEffects(state.commanders, empireId, fleetId);
  return {
    weaponBonusPercent: (effects?.weaponStrengthPercent ?? 0) + command.weaponBonusPercent,
    armorBonusPercent: (effects?.armorStrengthPercent ?? 0) + command.armorBonusPercent,
    unitWeaponBonusPercent: getShipUpgradeBonusMap(
      state.shipUpgrades,
      empireId,
      units,
      'weapons',
    ),
    unitArmorBonusPercent: getShipUpgradeBonusMap(
      state.shipUpgrades,
      empireId,
      units,
      'armor',
    ),
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

function clampActiveDefenses(
  initial: Readonly<Record<string, number>>,
  remaining: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> {
  return Object.fromEntries(
    Object.entries(initial)
      .map(([unitId, initialCount]) => [
        unitId,
        Math.min(initialCount, remaining[unitId] ?? 0),
      ] as const)
      .filter(([, count]) => count > 0),
  );
}

function addRecoveredToRemaining(
  remaining: Readonly<Record<string, number>>,
  recovered: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> {
  const result = { ...remaining };
  for (const [unitId, quantity] of Object.entries(recovered)) {
    result[unitId] = (result[unitId] ?? 0) + quantity;
  }
  return result;
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

function addDestroyedCargoDebris(
  debris: DebrisAmount,
  fleet: FleetState,
  attackerSurvived: boolean,
): DebrisAmount {
  if (attackerSurvived) return debris;
  return {
    metal: debris.metal + Math.floor(fleet.cargo.metal * 0.5),
    crystal: debris.crystal + Math.floor(fleet.cargo.crystal * 0.5),
  };
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
  const defenderFleets = state.fleets.filter(
    (fleet) =>
      fleet.empireId === target.ownerEmpireId &&
      fleet.status === 'stationed' &&
      fleet.location.type === 'planet' &&
      fleet.location.planetId === target.id,
  );
  for (const fleet of defenderFleets) mergeUnits(defenderUnits, fleet.ships);
  const defenderDoctrine = defenderFleets[0];
  const attackerFormation = attackerFleet.formation ?? 'line';
  const attackerTargetPriority = attackerFleet.targetPriority ?? 'balanced';
  const defenderFormation = defenderDoctrine?.formation ?? 'line';
  const defenderTargetPriority = defenderDoctrine?.targetPriority ?? 'balanced';

  const isPve = target.ownerEmpireId === PIRATE_EMPIRE_ID;
  const threatMultiplierPermille = isPve
    ? calculatePirateThreatMultiplier(state, attackerFleet.empireId)
    : 1_000;
  const rewardMultiplierPermille = isPve
    ? calculatePveRewardMultiplier(
        state,
        attackerFleet.empireId,
        'pirate-raid',
        target.id,
      )
    : 1_000;
  const effectiveDefenderUnits = isPve
    ? scalePveUnits(defenderUnits, threatMultiplierPermille)
    : defenderUnits;

  const seed = (state.seed ^ eventSequence ^ attackerFleet.id.length) >>> 0;
  const resolution = resolveBattle(
    seed,
    {
      empireId: attackerFleet.empireId,
      units: attackerFleet.ships,
      formation: attackerFormation,
      targetPriority: attackerTargetPriority,
      ...getCombatEffects(state, attackerFleet.empireId, attackerFleet.ships, attackerFleet.id),
    },
    {
      empireId: target.ownerEmpireId,
      units: effectiveDefenderUnits,
      formation: defenderFormation,
      targetPriority: defenderTargetPriority,
      ...getCombatEffects(state, target.ownerEmpireId, effectiveDefenderUnits, defenderDoctrine?.id),
    },
  );
  const defenderRemaining = splitDefenderRemaining(resolution.defenderRemaining);
  const activeDefenses = clampActiveDefenses(
    target.inventory.defenses,
    defenderRemaining.defenses,
  );
  const defensesRecovered = calculateRecoveredDefenses(
    target.inventory.defenses,
    activeDefenses,
    seed,
  );
  let updatedTarget: PlanetState = {
    ...target,
    inventory: {
      ...target.inventory,
      defenses: activeDefenses,
    },
    defense: addDamagedDefenses(target.defense, defensesRecovered),
  };
  let fleets = redistributeDefenderShips(
    state.fleets,
    target.id,
    target.ownerEmpireId,
    defenderRemaining.ships,
  );
  const attackerSurvived = Object.keys(resolution.attackerRemaining).length > 0;
  let updatedAttacker = attackerSurvived
    ? { ...attackerFleet, ships: resolution.attackerRemaining }
    : undefined;
  let plunderedCargo: ResourceCost = { metal: 0, crystal: 0, gas: 0 };

  if (resolution.winner === 'attacker' && updatedAttacker !== undefined) {
    const plunder = plunderPlanet(updatedTarget, updatedAttacker);
    if (isPve) {
      const adjusted = applyPvePlunderMultiplier(
        plunder.planet,
        plunder.fleet,
        plunder.plundered,
        rewardMultiplierPermille,
      );
      updatedTarget = adjusted.planet;
      updatedAttacker = adjusted.fleet;
      plunderedCargo = adjusted.plundered;
    } else {
      updatedTarget = plunder.planet;
      updatedAttacker = plunder.fleet;
      plunderedCargo = plunder.plundered;
    }
  }

  fleets = updatedAttacker === undefined
    ? fleets.filter((fleet) => fleet.id !== attackerFleet.id)
    : fleets.map((fleet) =>
        fleet.id === attackerFleet.id ? updatedAttacker : fleet,
      );

  const debrisDefenderRemaining = addRecoveredToRemaining(
    resolution.defenderRemaining,
    defensesRecovered,
  );
  const baseDebris = calculateDebrisFromLosses(
    attackerFleet.ships,
    resolution.attackerRemaining,
    effectiveDefenderUnits,
    debrisDefenderRemaining,
  );
  const debrisCreated = addDestroyedCargoDebris(
    baseDebris,
    attackerFleet,
    attackerSurvived,
  );
  const debrisFields = addDebrisField(
    state.debrisFields,
    target.id,
    debrisCreated,
    state.clock.elapsedSeconds,
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
    defenderInitial: effectiveDefenderUnits,
    attackerRemaining: resolution.attackerRemaining,
    defenderRemaining: resolution.defenderRemaining,
    defensesRecovered,
    debrisCreated,
    plunderedCargo,
    mode: isPve ? 'pve' : 'pvp',
    threatMultiplierPermille,
    rewardMultiplierPermille,
    attackerFormation,
    attackerTargetPriority,
    defenderFormation,
    defenderTargetPriority,
  };

  return {
    state: {
      ...state,
      planets: state.planets.map((planet) =>
        planet.id === target.id ? updatedTarget : planet,
      ),
      fleets,
      debrisFields,
      commanders: awardBattleCommandExperience(state.commanders, report),
    },
    report,
    attackerFleet: updatedAttacker,
  };
}
