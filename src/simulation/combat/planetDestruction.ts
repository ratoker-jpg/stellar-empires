import { getCommanderFleetEffects } from '../command/commanderShips';
import { getUnitDefinition } from '../units/catalog';
import type { GameState } from '../types';
import { getPlanetDestroyerSiegeContributions } from './planetSiegeConfig';
import type {
  BattleWinner,
  PlanetDestructionContributionReport,
  PlanetDestructionReport,
} from './types';

export interface ResolvePlanetDestructionInput {
  readonly state: Pick<
    GameState,
    'seed' | 'planets' | 'shipUpgrades' | 'commanders' | 'fleets'
  >;
  readonly attackerEmpireId: string;
  readonly attackerFleetId: string;
  readonly attackerRemaining: Readonly<Record<string, number>>;
  readonly defenderEmpireId: string;
  readonly defenderRemaining: Readonly<Record<string, number>>;
  readonly activeDefenses: Readonly<Record<string, number>>;
  readonly targetPlanetId: string;
  readonly targetGalaxyPlanetId: string;
  readonly winner: BattleWinner;
  readonly eventSequence: number;
  readonly poliasReductionBasisPoints: number;
}

function hashText(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function defensePopulation(
  defenses: Readonly<Record<string, number>>,
): number {
  return Object.entries(defenses).reduce((total, [unitId, quantity]) => {
    if (quantity <= 0) return total;
    const definition = getUnitDefinition(unitId);
    return definition?.kind === 'defense'
      ? total + definition.populationCost * quantity
      : total;
  }, 0);
}

function assignedDefenderPoliasReduction(
  state: Pick<GameState, 'commanders' | 'fleets'>,
  defenderEmpireId: string,
  targetPlanetId: string,
): number {
  const flagshipFleetId = state.commanders.find(
    (entry) => entry.empireId === defenderEmpireId,
  )?.flagshipFleetId;
  if (flagshipFleetId === null || flagshipFleetId === undefined) return 0;
  const flagship = state.fleets.find(
    (fleet) =>
      fleet.id === flagshipFleetId &&
      fleet.empireId === defenderEmpireId &&
      fleet.status === 'stationed' &&
      fleet.location.type === 'planet' &&
      fleet.location.planetId === targetPlanetId,
  );
  return flagship === undefined
    ? 0
    : getCommanderFleetEffects(
        state,
        flagship,
      ).planetDestructionReductionBasisPoints;
}

function toReportContribution(
  contribution: ReturnType<typeof getPlanetDestroyerSiegeContributions>[number],
): PlanetDestructionContributionReport {
  return {
    unitId: contribution.unitId,
    factionId: contribution.factionId,
    count: contribution.count,
    weaponLevel: contribution.weaponLevel,
    chanceBasisPointsPerShip:
      contribution.destructionChanceBasisPointsPerShip,
    totalChanceBasisPoints:
      contribution.totalDestructionChanceBasisPoints,
  };
}

export function resolvePlanetDestruction(
  input: ResolvePlanetDestructionInput,
): PlanetDestructionReport {
  const attackerContributions = getPlanetDestroyerSiegeContributions(
    input.state.shipUpgrades,
    input.attackerEmpireId,
    input.attackerRemaining,
  );
  const defenderContributions = getPlanetDestroyerSiegeContributions(
    input.state.shipUpgrades,
    input.defenderEmpireId,
    input.defenderRemaining,
  );
  const rawChanceBasisPoints = attackerContributions.reduce(
    (total, contribution) =>
      total + contribution.totalDestructionChanceBasisPoints,
    0,
  );
  const survivingDefensePopulation = defensePopulation(input.activeDefenses);
  const defenseReductionBasisPoints =
    Math.floor(survivingDefensePopulation / 1_000) * 100;
  const defenderPlanetDestroyerReductionBasisPoints =
    defenderContributions.reduce(
      (total, contribution) =>
        total + contribution.totalDestructionChanceBasisPoints,
      0,
    );
  const poliasReductionBasisPoints = Math.max(
    0,
    input.poliasReductionBasisPoints,
    assignedDefenderPoliasReduction(
      input.state,
      input.defenderEmpireId,
      input.targetPlanetId,
    ),
  );
  const finalChanceBasisPoints = Math.max(
    0,
    Math.min(
      3_000,
      rawChanceBasisPoints -
        defenseReductionBasisPoints -
        defenderPlanetDestroyerReductionBasisPoints -
        poliasReductionBasisPoints,
    ),
  );
  const rollBasisPoints = hashText([
    input.state.seed,
    input.eventSequence,
    input.attackerFleetId,
    input.targetGalaxyPlanetId,
    'planet-destruction-roll',
  ].join(':')) % 10_000;
  const defenderColonyCount = input.state.planets.filter(
    (planet) => planet.ownerEmpireId === input.defenderEmpireId,
  ).length;

  let blockedReason: PlanetDestructionReport['blockedReason'] = null;
  if (attackerContributions.length === 0) {
    blockedReason = 'NO_SURVIVING_PLANET_DESTROYER';
  } else if (input.winner !== 'attacker') {
    blockedReason = 'BATTLE_RESULT_INELIGIBLE';
  } else if (defenderColonyCount <= 1) {
    blockedReason = 'LAST_COLONY_PROTECTED';
  } else if (finalChanceBasisPoints === 0) {
    blockedReason = 'ZERO_FINAL_CHANCE';
  }
  const planetDestroyed =
    blockedReason === null && rollBasisPoints < finalChanceBasisPoints;

  return {
    attackerContributions: attackerContributions.map(toReportContribution),
    defenderContributions: defenderContributions.map(toReportContribution),
    defensePopulation: survivingDefensePopulation,
    rawChanceBasisPoints,
    defenseReductionBasisPoints,
    defenderPlanetDestroyerReductionBasisPoints,
    poliasReductionBasisPoints,
    finalChanceBasisPoints,
    rollBasisPoints,
    blockedReason,
    planetDestroyed,
  };
}
