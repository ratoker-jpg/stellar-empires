import { describe, expect, it } from 'vitest';
import { resolvePlanetDestruction } from '../../src/simulation/combat/planetDestruction';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import type { FleetState } from '../../src/simulation/fleets/types';
import type { GameState } from '../../src/simulation/types';
import { getCompleteCommanderShipId } from '../../src/simulation/units/completeCommanderShipCatalog';

function setWeaponLevel(
  state: GameState,
  empireId: string,
  unitId: string,
  weapons: number,
): GameState {
  return {
    ...state,
    shipUpgrades: state.shipUpgrades.map((entry) =>
      entry.empireId === empireId
        ? {
            ...entry,
            levels: {
              ...entry.levels,
              [unitId]: { weapons, armor: 0, cargo: 0 },
            },
          }
        : entry,
    ),
  };
}

describe('assigned Polias destruction protection', () => {
  it('uses the defending flagship even when it is not the first fleet', () => {
    let state = createInitialGameState('assigned-polias-protection');
    const defenderCommand = state.commanders.find(
      (entry) => entry.empireId !== 'player',
    );
    const target = state.planets.find(
      (planet) => planet.ownerEmpireId === defenderCommand?.empireId,
    );
    const fallback = state.planets.find(
      (planet) =>
        planet.id !== target?.id &&
        planet.ownerEmpireId !== 'player',
    );
    const attackerOrigin = state.planets.find(
      (planet) => planet.ownerEmpireId === 'player',
    );
    if (
      defenderCommand === undefined ||
      target === undefined ||
      fallback === undefined ||
      attackerOrigin === undefined
    ) {
      throw new Error('Polias fixture state is incomplete.');
    }

    const defenderEmpireId = defenderCommand.empireId;
    const attackerDestroyerId = getFactionMechanicalRoles(
      attackerOrigin.factionId,
    ).ships.dreadnought;
    const decoyFleet: FleetState = {
      id: 'fleet-defender-decoy-first',
      empireId: defenderEmpireId,
      originPlanetId: target.id,
      location: { type: 'planet', planetId: target.id },
      status: 'stationed',
      ships: {
        [getFactionMechanicalRoles(target.factionId).ships.fighter]: 1,
      },
      cargo: { metal: 0, crystal: 0, gas: 0 },
      speed: 1,
      cargoCapacity: 100,
      mission: null,
    };
    const poliasFleet: FleetState = {
      id: 'fleet-defender-polias-flagship',
      empireId: defenderEmpireId,
      originPlanetId: target.id,
      location: { type: 'planet', planetId: target.id },
      status: 'stationed',
      ships: { [getCompleteCommanderShipId('polias')]: 1 },
      cargo: { metal: 0, crystal: 0, gas: 0 },
      speed: 1,
      cargoCapacity: 100,
      mission: null,
    };
    state = setWeaponLevel(state, 'player', attackerDestroyerId, 10);
    state = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.id === fallback.id
          ? {
              ...planet,
              ownerEmpireId: defenderEmpireId,
              factionId: target.factionId,
            }
          : planet,
      ),
      fleets: [...state.fleets, decoyFleet, poliasFleet],
      commanders: state.commanders.map((entry) =>
        entry.empireId === defenderEmpireId
          ? {
              ...entry,
              level: 28,
              flagshipFleetId: poliasFleet.id,
            }
          : entry,
      ),
    };

    const report = resolvePlanetDestruction({
      state,
      attackerEmpireId: 'player',
      attackerFleetId: 'fleet-attacker-destroyer',
      attackerRemaining: { [attackerDestroyerId]: 10 },
      defenderEmpireId,
      defenderRemaining: {
        ...decoyFleet.ships,
        ...poliasFleet.ships,
      },
      activeDefenses: {},
      targetPlanetId: target.id,
      targetGalaxyPlanetId: target.galaxyPlanetId,
      winner: 'attacker',
      eventSequence: 801,
      poliasReductionBasisPoints: 0,
    });

    expect(state.fleets.find((fleet) => fleet.id === decoyFleet.id)).toBeDefined();
    expect(state.fleets.find((fleet) => fleet.id === poliasFleet.id)).toBeDefined();
    expect(report.poliasReductionBasisPoints).toBe(50);
    expect(report.finalChanceBasisPoints).toBe(
      Math.max(0, report.rawChanceBasisPoints - 50),
    );
  });
});
