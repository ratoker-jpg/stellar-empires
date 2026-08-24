import {
  getCommanderFleetEffects,
  recoverFleetShipsWithCommander,
  type CommanderFleetEffects,
} from '../command/commanderShips';
import {
  awardBattleCommandExperience,
  getCommandCombatEffects,
  getEmpireCommandState,
} from '../command/commandDoctrine';
import {
  addDamagedDefenses,
  calculateRecoveredDefenses,
} from '../defense/planetaryDefense';
import type { ResourceCost } from '../economy/types';
import { getResearchEffectsForEmpire } from '../factions/factionResearchEffects';
import type { FleetState } from '../fleets/types';
import { reconcileDestroyedPlanet } from '../planet/reconcileDestroyedPlanet';
import type { PlanetState } from '../planet/types';
import { PIRATE_EMPIRE_ID } from '../pve/neutralForces';
import {
  applyPvePlunderMultiplier,
  calculatePirateThreatMultiplier,
  calculatePveRewardMultiplier,
  scalePveUnits,
} from '../pve/pveBalance';
import type { GameState } from '../types';
import { getUnitDefinition } from '../units/catalog';
import { getShipUpgradeBonusMap } from '../upgrades/shipUpgrades';
import { stableFleetIdentityContribution } from './combatIdentity';
import {
  addDebrisField,
  calculateDebrisFromLosses,
  plunderPlanet,
  type DebrisAmount,
} from './debris';
import { getPlanetaryDefenseTargetPriority } from './defenseAbilities';
import {
  selectPrimaryFleetByStableId,
  type FleetFormation,
  type FleetTargetPriority,
} from './fleetDoctrine';
import { resolvePlanetDemolition } from './planetDemolition';
import { resolvePlanetDestruction } from './planetDestruction';
import { resolveBattle } from './resolveBattle';
import type { BattleReport, CombatTacticalSnapshot } from './types';

function getCombatEffects(
  state: GameState,
  empireId: string,
  units: Readonly<Record<string, number>>,
  fleetId: string | undefined,
  commander: CommanderFleetEffects,
  opponentCommander: CommanderFleetEffects,
) {
  const effects = getResearchEffectsForEmpire(state, empireId);
  const command = getCommandCombatEffects(state.commanders, empireId, fleetId);
  return {
    weaponBonusPercent:
      effects.weaponStrengthPercent +
      command.weaponBonusPercent +
      commander.weaponBonusPercent -
      opponentCommander.enemyWeaponPenaltyPercent,
    armorBonusPercent:
      effects.armorStrengthPercent +
      command.armorBonusPercent +
      commander.armorBonusPercent -
      opponentCommander.enemyArmorPenaltyPercent,
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

function createTacticalSnapshot(
  state: GameState,
  empireId: string,
  fleetId: string | undefined,
  formation: FleetFormation,
  targetPriority: FleetTargetPriority,
  commanderId: string | null,
): CombatTacticalSnapshot | undefined {
  const command = getEmpireCommandState(state.commanders, empireId);
  if (command === undefined) return undefined;
  return {
    doctrineId: command.doctrineId,
    commandLevel: command.level,
    isFlagship: fleetId !== undefined && command.flagshipFleetId === fleetId,
    formation,
    targetPriority,
    commanderId,
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

function recoveredDelta(
  before: Readonly<Record<string, number>>,
  after: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> {
  return Object.fromEntries(
    Object.keys(after)
      .sort()
      .map((unitId) => [unitId, Math.max(0, (after[unitId] ?? 0) - (before[unitId] ?? 0))] as const)
      .filter(([, quantity]) => quantity > 0),
  );
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
  const defenderDoctrine = selectPrimaryFleetByStableId(defenderFleets);
  const attackerFormation = attackerFleet.formation ?? 'line';
  const attackerTargetPriority = attackerFleet.targetPriority ?? 'balanced';
  const defenderFormation = defenderDoctrine?.formation ?? 'line';
  const defenderTargetPriority = defenderDoctrine?.targetPriority ??
    getPlanetaryDefenseTargetPriority(target.inventory.defenses);

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
  const attackerCommander = getCommanderFleetEffects(state, attackerFleet);
  const defenderCommander = defenderDoctrine === undefined
    ? getCommanderFleetEffects(state, target.ownerEmpireId, undefined, effectiveDefenderUnits)
    : getCommanderFleetEffects(state, defenderDoctrine);
  const attackerTacticalSnapshot = createTacticalSnapshot(
    state,
    attackerFleet.empireId,
    attackerFleet.id,
    attackerFormation,
    attackerTargetPriority,
    attackerCommander.activeCommanderId,
  );
  const defenderTacticalSnapshot = createTacticalSnapshot(
    state,
    target.ownerEmpireId,
    defenderDoctrine?.id,
    defenderFormation,
    defenderTargetPriority,
    defenderCommander.activeCommanderId,
  );

  const seed = (
    state.seed ^
    eventSequence ^
    stableFleetIdentityContribution(attackerFleet.id)
  ) >>> 0;
  const resolution = resolveBattle(
    seed,
    {
      empireId: attackerFleet.empireId,
      units: attackerFleet.ships,
      formation: attackerFormation,
      targetPriority: attackerTargetPriority,
      ...getCombatEffects(
        state,
        attackerFleet.empireId,
        attackerFleet.ships,
        attackerFleet.id,
        attackerCommander,
        defenderCommander,
      ),
    },
    {
      empireId: target.ownerEmpireId,
      units: effectiveDefenderUnits,
      formation: defenderFormation,
      targetPriority: defenderTargetPriority,
      ...getCombatEffects(
        state,
        target.ownerEmpireId,
        effectiveDefenderUnits,
        defenderDoctrine?.id,
        defenderCommander,
        attackerCommander,
      ),
    },
  );
  const attackerAfterCommanderRecovery = recoverFleetShipsWithCommander(
    attackerFleet.ships,
    resolution.attackerRemaining,
    attackerCommander.recoveryPermille,
    seed ^ 0xa5a5a5a5,
  );
  const defenderAfterCommanderRecovery = recoverFleetShipsWithCommander(
    effectiveDefenderUnits,
    resolution.defenderRemaining,
    defenderCommander.recoveryPermille,
    seed ^ 0x5a5a5a5a,
  );
  const defenderRemaining = splitDefenderRemaining(defenderAfterCommanderRecovery);
  const activeDefenses = clampActiveDefenses(
    target.inventory.defenses,
    defenderRemaining.defenses,
  );
  const defensesRecovered = calculateRecoveredDefenses(
    target.inventory.defenses,
    activeDefenses,
    seed,
  );
  const finalDefenderRemaining = addRecoveredToRemaining(
    defenderAfterCommanderRecovery,
    defensesRecovered,
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
  const attackerSurvived = Object.keys(attackerAfterCommanderRecovery).length > 0;
  let updatedAttacker = attackerSurvived
    ? { ...attackerFleet, ships: attackerAfterCommanderRecovery }
    : undefined;
  let plunderedCargo: ResourceCost = { metal: 0, crystal: 0, gas: 0 };

  if (resolution.winner === 'attacker' && updatedAttacker !== undefined) {
    const plunder = plunderPlanet(
      updatedTarget,
      updatedAttacker,
      attackerCommander.plunderBonusPercent,
    );
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

  const demolition = resolvePlanetDemolition({
    state,
    attackerEmpireId: attackerFleet.empireId,
    attackerFleetId: attackerFleet.id,
    attackerRemaining: attackerAfterCommanderRecovery,
    target: updatedTarget,
    activeDefenses,
    winner: resolution.winner,
    eventSequence,
    commanderBonusBasisPoints: attackerCommander.demolitionBasisPoints,
  });
  updatedTarget = demolition.planet;
  const destruction = resolvePlanetDestruction({
    state,
    attackerEmpireId: attackerFleet.empireId,
    attackerFleetId: attackerFleet.id,
    attackerRemaining: attackerAfterCommanderRecovery,
    defenderEmpireId: target.ownerEmpireId,
    defenderRemaining: finalDefenderRemaining,
    activeDefenses,
    targetPlanetId: target.id,
    targetGalaxyPlanetId: target.galaxyPlanetId,
    winner: resolution.winner,
    eventSequence,
    poliasReductionBasisPoints:
      defenderCommander.planetDestructionReductionBasisPoints,
  });

  fleets = updatedAttacker === undefined
    ? fleets.filter((fleet) => fleet.id !== attackerFleet.id)
    : fleets.map((fleet) =>
        fleet.id === attackerFleet.id ? updatedAttacker : fleet,
      );

  const baseDebris = calculateDebrisFromLosses(
    attackerFleet.ships,
    attackerAfterCommanderRecovery,
    effectiveDefenderUnits,
    finalDefenderRemaining,
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
    target.coordinate,
  );

  const report: BattleReport = {
    id: `battle-${eventSequence}-${attackerFleet.id}`,
    seed,
    resolvedAt: state.clock.elapsedSeconds,
    targetPlanetId: target.id,
    targetGalaxyPlanetId: target.galaxyPlanetId,
    targetCoordinate: target.coordinate,
    attackerEmpireId: attackerFleet.empireId,
    defenderEmpireId: target.ownerEmpireId,
    winner: resolution.winner,
    rounds: resolution.rounds,
    attackerInitial: { ...attackerFleet.ships },
    defenderInitial: effectiveDefenderUnits,
    attackerRemaining: attackerAfterCommanderRecovery,
    defenderRemaining: finalDefenderRemaining,
    attackerCommanderId: attackerCommander.activeCommanderId,
    defenderCommanderId: defenderCommander.activeCommanderId,
    ...(attackerTacticalSnapshot === undefined ? {} : { attackerTacticalSnapshot }),
    ...(defenderTacticalSnapshot === undefined ? {} : { defenderTacticalSnapshot }),
    commanderRecoveredShips: {
      attacker: recoveredDelta(resolution.attackerRemaining, attackerAfterCommanderRecovery),
      defender: recoveredDelta(resolution.defenderRemaining, defenderAfterCommanderRecovery),
    },
    defensesRecovered,
    debrisCreated,
    plunderedCargo,
    ...(demolition.report === undefined ? {} : { demolition: demolition.report }),
    destruction,
    mode: isPve ? 'pve' : 'pvp',
    threatMultiplierPermille,
    rewardMultiplierPermille,
    attackerFormation,
    attackerTargetPriority,
    defenderFormation,
    defenderTargetPriority,
  };

  let nextState: GameState = {
    ...state,
    planets: state.planets.map((planet) =>
      planet.id === target.id ? updatedTarget : planet,
    ),
    fleets,
    debrisFields,
    pendingEvents: demolition.pendingEvents,
    commanders: awardBattleCommandExperience(state.commanders, report),
  };
  if (destruction.planetDestroyed) {
    nextState = reconcileDestroyedPlanet(nextState, target.id).state;
  }
  const resolvedAttacker = updatedAttacker === undefined
    ? undefined
    : nextState.fleets.find((fleet) => fleet.id === updatedAttacker?.id);

  return {
    state: nextState,
    report,
    attackerFleet: resolvedAttacker,
  };
}
