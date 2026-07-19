import { describe, expect, it } from 'vitest';
import {
  getColonyLimit,
  getEmpireColonyCount,
  updateGalaxyPlanetOwner,
} from '../../src/simulation/colonization/colonization';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeGameCommand } from '../../src/simulation/executeGameCommand';
import { estimateFlightToGalaxyPlanet } from '../../src/simulation/fleets/flightCalculations';
import type { GameState } from '../../src/simulation/types';

function freeGalaxyPlanet(state: GameState) {
  for (const system of state.galaxy.systems) {
    const planet = system.planets.find(
      (candidate) =>
        candidate.ownerEmpireId === null &&
        !state.planets.some(
          (colony) => colony.galaxyPlanetId === candidate.id,
        ),
    );
    if (planet !== undefined) return planet;
  }
  throw new Error('Free galaxy planet missing.');
}

function prepareColonizationState(seed: string, techLevel = 1): GameState {
  const state = createInitialGameState(seed);
  const origin = state.planets.find(
    (planet) => planet.ownerEmpireId === 'player',
  );
  if (origin === undefined) throw new Error('Player origin missing.');
  return {
    ...state,
    planets: state.planets.map((planet) =>
      planet.id === origin.id
        ? {
            ...planet,
            inventory: {
              ...planet.inventory,
              ships: {
                ...planet.inventory.ships,
                'ship.aegis.colony': 2,
                'ship.aegis.scout': 1,
              },
            },
            economy: {
              ...planet.economy,
              resources: {
                ...planet.economy.resources,
                gas: {
                  ...planet.economy.resources.gas,
                  amount: 100_000,
                  capacity: 100_000,
                },
              },
            },
          }
        : planet,
    ),
    research: state.research.map((research) =>
      research.empireId === 'player'
        ? {
            ...research,
            levels: {
              ...research.levels,
              'technology.aegis.construction': 2,
              'technology.aegis.propulsion': 2,
              'technology.aegis.colonization': techLevel,
            },
          }
        : research,
    ),
  };
}

function createColonyFleet(state: GameState, includeColonyShip = true): GameState {
  const origin = state.planets.find(
    (planet) => planet.ownerEmpireId === 'player',
  )!;
  const result = executeGameCommand(state, {
    type: 'CREATE_FLEET',
    empireId: 'player',
    planetId: origin.id,
    ships: includeColonyShip
      ? { 'ship.aegis.colony': 1 }
      : { 'ship.aegis.scout': 1 },
    cargo: { metal: 200, crystal: 100, gas: 50 },
  });
  if (!result.ok) throw new Error(result.code);
  return result.value;
}

describe('colonization', () => {
  it('creates a complete second colony and consumes the colony ship', () => {
    const initial = createColonyFleet(
      prepareColonizationState('colonization-success'),
    );
    const target = freeGalaxyPlanet(initial);
    const fleet = initial.fleets[0]!;
    const estimate = estimateFlightToGalaxyPlanet(
      initial.galaxy,
      initial.planets,
      fleet,
      target.id,
    );
    const sent = executeGameCommand(initial, {
      type: 'SEND_FLEET',
      empireId: 'player',
      fleetId: fleet.id,
      targetPlanetId: target.id,
      mission: 'colonize',
    });
    expect(sent.ok).toBe(true);
    if (!sent.ok) return;

    const arrived = executeGameCommand(sent.value, {
      type: 'ADVANCE_TIME',
      seconds: estimate.durationSeconds,
    });
    expect(arrived.ok).toBe(true);
    if (!arrived.ok) return;

    const colony = arrived.value.planets.find(
      (planet) => planet.galaxyPlanetId === target.id,
    );
    expect(colony).toMatchObject({
      ownerEmpireId: 'player',
      factionId: 'aegis',
      inventory: { ships: {}, defenses: {} },
      productionQueues: { shipyard: [], defense: [] },
    });
    expect(
      colony?.buildings.map((building) => building.buildingId),
    ).toEqual(
      expect.arrayContaining([
        'building.aegis.command',
        'building.aegis.metal-extractor',
        'building.aegis.power-plant',
      ]),
    );
    expect(
      arrived.value.galaxy.systems
        .flatMap((system) => system.planets)
        .find((planet) => planet.id === target.id)?.ownerEmpireId,
    ).toBe('player');
    expect(getEmpireColonyCount(arrived.value, 'player')).toBe(2);
    expect(arrived.value.fleets).toHaveLength(0);
  });

  it('returns when another empire occupies the target before arrival', () => {
    const initial = createColonyFleet(
      prepareColonizationState('colonization-race'),
    );
    const target = freeGalaxyPlanet(initial);
    const fleet = initial.fleets[0]!;
    const estimate = estimateFlightToGalaxyPlanet(
      initial.galaxy,
      initial.planets,
      fleet,
      target.id,
    );
    const sent = executeGameCommand(initial, {
      type: 'SEND_FLEET',
      empireId: 'player',
      fleetId: fleet.id,
      targetPlanetId: target.id,
      mission: 'colonize',
    });
    expect(sent.ok).toBe(true);
    if (!sent.ok) return;

    const occupied = {
      ...sent.value,
      galaxy: updateGalaxyPlanetOwner(
        sent.value.galaxy,
        target.id,
        'aegis-bot',
      ),
    };
    const arrived = executeGameCommand(occupied, {
      type: 'ADVANCE_TIME',
      seconds: estimate.durationSeconds,
    });
    expect(arrived.ok).toBe(true);
    if (arrived.ok) {
      expect(arrived.value.fleets[0]?.status).toBe('returning');
      expect(
        arrived.value.planets.some(
          (planet) => planet.galaxyPlanetId === target.id,
        ),
      ).toBe(false);
    }
  });

  it('requires colonization research and a colony ship', () => {
    const withoutTech = createColonyFleet(
      prepareColonizationState('colonization-tech', 0),
    );
    const target = freeGalaxyPlanet(withoutTech);
    expect(
      executeGameCommand(withoutTech, {
        type: 'SEND_FLEET',
        empireId: 'player',
        fleetId: withoutTech.fleets[0]!.id,
        targetPlanetId: target.id,
        mission: 'colonize',
      }),
    ).toMatchObject({ ok: false, code: 'COLONIZATION_TECH_REQUIRED' });

    const withoutShip = createColonyFleet(
      prepareColonizationState('colonization-ship'),
      false,
    );
    const secondTarget = freeGalaxyPlanet(withoutShip);
    expect(
      executeGameCommand(withoutShip, {
        type: 'SEND_FLEET',
        empireId: 'player',
        fleetId: withoutShip.fleets[0]!.id,
        targetPlanetId: secondTarget.id,
        mission: 'colonize',
      }),
    ).toMatchObject({ ok: false, code: 'COLONY_SHIP_REQUIRED' });
  });

  it('enforces the technology-based colony limit', () => {
    const base = prepareColonizationState('colonization-limit');
    const free = freeGalaxyPlanet(base);
    const occupied = {
      ...base,
      planets: [
        ...base.planets,
        {
          ...base.planets[0]!,
          id: `colony-${free.id}`,
          galaxyPlanetId: free.id,
          ownerEmpireId: 'player',
        },
      ],
      galaxy: updateGalaxyPlanetOwner(base.galaxy, free.id, 'player'),
    };
    const withFleet = createColonyFleet(occupied);
    const target = freeGalaxyPlanet(withFleet);
    expect(getColonyLimit(withFleet, 'player')).toBe(2);
    expect(
      executeGameCommand(withFleet, {
        type: 'SEND_FLEET',
        empireId: 'player',
        fleetId: withFleet.fleets[0]!.id,
        targetPlanetId: target.id,
        mission: 'colonize',
      }),
    ).toMatchObject({ ok: false, code: 'COLONY_LIMIT_REACHED' });
  });
});
