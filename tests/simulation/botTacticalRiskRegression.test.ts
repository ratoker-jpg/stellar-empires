import { describe, expect, it } from 'vitest';
import { planBotFleetMission } from '../../src/simulation/bots/fleetMissionPlanner';
import { planBotThreatAndRecovery } from '../../src/simulation/bots/threatRecoveryPlanner';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import type { GameState } from '../../src/simulation/types';
import { getUnitDefinition } from '../../src/simulation/units/catalog';

const ZERO_CARGO = { metal: 0, crystal: 0, gas: 0 } as const;

function unitPower(unitId: string, quantity: number): number {
  const definition = getUnitDefinition(unitId);
  if (definition === undefined) throw new Error(`Missing unit definition: ${unitId}`);
  return quantity * (
    definition.stats.attack * 2 +
    definition.stats.armor +
    definition.stats.shield
  );
}

function riskPermille(targetPower: number, ownPower: number): number {
  return Math.min(9_999, Math.floor((targetPower * 1_000) / Math.max(1, ownPower)));
}

function findRiskWindow(
  ownUnitId: string,
  targetUnitId: string,
  minimumExclusive: number,
  maximumInclusive: number,
): { readonly ownCount: number; readonly targetCount: number; readonly risk: number } {
  for (let ownCount = 1; ownCount <= 20; ownCount += 1) {
    for (let targetCount = 1; targetCount <= 20; targetCount += 1) {
      const risk = riskPermille(
        unitPower(targetUnitId, targetCount),
        unitPower(ownUnitId, ownCount),
      );
      if (risk > minimumExclusive && risk <= maximumInclusive) {
        return { ownCount, targetCount, risk };
      }
    }
  }
  throw new Error(
    `No real catalog configuration found for risk (${minimumExclusive}, ${maximumInclusive}].`,
  );
}

function fillGas(state: GameState, empireId: string): GameState {
  return {
    ...state,
    planets: state.planets.map((planet) =>
      planet.ownerEmpireId === empireId
        ? {
            ...planet,
            economy: {
              ...planet.economy,
              resources: {
                ...planet.economy.resources,
                gas: {
                  ...planet.economy.resources.gas,
                  amount: planet.economy.resources.gas.capacity,
                },
              },
            },
          }
        : planet,
    ),
  };
}

function addFullCurrentIntel(
  state: GameState,
  observerEmpireId: string,
  targetPlanetId: string,
  defenses: Readonly<Record<string, number>>,
): GameState {
  const target = state.planets.find((planet) => planet.id === targetPlanetId);
  if (target === undefined) throw new Error(`Missing target planet: ${targetPlanetId}`);
  return {
    ...state,
    intelligence: state.intelligence.map((entry) =>
      entry.empireId === observerEmpireId
        ? {
            ...entry,
            observations: [{
              id: `${observerEmpireId}-tactical-risk-intel`,
              observerEmpireId,
              targetPlanetId,
              observedAt: state.clock.elapsedSeconds,
              expiresAt: state.clock.elapsedSeconds + 10_000,
              detected: false,
              snapshot: {
                planetId: target.id,
                coordinate: target.coordinate,
                name: target.name,
                ownerEmpireId: target.ownerEmpireId,
                factionId: target.factionId,
                level: 3 as const,
                defenses,
                stationedFleets: [],
              },
            }],
          }
        : entry,
    ),
  };
}

describe('POST-1.0-PR2 tactical-risk regression evidence', () => {
  it('rejects an Industrial fleet target above the accepted 700 permille threshold', () => {
    const empireId = 'aegis-bot';
    const roles = getFactionMechanicalRoles('aegis');
    const fighterId = roles.ships.fighter;
    const defenseId = roles.defenses.light;
    const configuration = findRiskWindow(fighterId, defenseId, 700, 833);
    let state = fillGas(createInitialGameState('pr2-fleet-risk-red'), empireId);
    const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
    const target = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    state = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.id === origin.id
          ? { ...planet, inventory: { ships: {}, defenses: {} } }
          : planet,
      ),
      fleets: [{
        id: 'industrial-marginal-strike',
        empireId,
        originPlanetId: origin.id,
        location: { type: 'planet' as const, planetId: origin.id },
        status: 'stationed' as const,
        ships: { [fighterId]: configuration.ownCount },
        cargo: ZERO_CARGO,
        speed: getUnitDefinition(fighterId)?.stats.speed ?? 1,
        cargoCapacity: 1_000,
        mission: null,
      }],
      pendingEvents: [],
    };
    state = addFullCurrentIntel(
      state,
      empireId,
      target.id,
      { [defenseId]: configuration.targetCount },
    );

    expect(configuration.risk).toBeGreaterThan(700);
    expect(configuration.risk).toBeLessThanOrEqual(833);
    expect(planBotFleetMission(state, empireId)).not.toMatchObject({
      reasonCode: 'mission-attack-selected',
      command: {
        type: 'SEND_FLEET',
        targetPlanetId: target.id,
        mission: 'attack',
      },
    });
  });

  it('recommends an Aggressive threat target above 800 and at or below 900 permille', () => {
    const empireId = 'veyra-bot';
    const ownRoles = getFactionMechanicalRoles('veyra');
    const targetRoles = getFactionMechanicalRoles('aegis');
    const fighterId = ownRoles.ships.fighter;
    const defenseId = targetRoles.defenses.light;
    const configuration = findRiskWindow(fighterId, defenseId, 800, 900);
    let state = createInitialGameState('pr2-threat-risk-red');
    const origin = state.planets.find((planet) => planet.ownerEmpireId === empireId)!;
    const target = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    state = {
      ...state,
      planets: state.planets.map((planet) => {
        if (planet.ownerEmpireId !== empireId) return planet;
        return {
          ...planet,
          inventory: {
            ships: planet.id === origin.id
              ? { [fighterId]: configuration.ownCount }
              : {},
            defenses: {},
          },
        };
      }),
      fleets: state.fleets.filter((fleet) => fleet.empireId !== empireId),
    };
    state = addFullCurrentIntel(
      state,
      empireId,
      target.id,
      { [defenseId]: configuration.targetCount },
    );

    const plan = planBotThreatAndRecovery(state, empireId);
    const assessment = plan.targets.find((candidate) => candidate.planetId === target.id);
    expect(configuration.risk).toBeGreaterThan(800);
    expect(configuration.risk).toBeLessThanOrEqual(900);
    expect(assessment?.riskPermille).toBe(configuration.risk);
    expect(assessment?.attackRecommended).toBe(true);
  });
});
