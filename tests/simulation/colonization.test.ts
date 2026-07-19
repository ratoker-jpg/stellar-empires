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

function findFreeGalaxyPlanet(state: GameState) {
  for (const system of state.galaxy.systems) {
    const planet = system.planets.find(
      (candidate) =>
        candidate.ownerEmpireId === null &&
        candidate.biome !== 'gas' &&
        !state.planets.some(
          (colony) => colony.galaxyPlanetId === candidate.id,
        ),
    );
    if (planet !== undefined) return { system, planet };
  }
  throw new Error('Free colonizable galaxy planet missing.');
}

function prepareColonizationState(
  seed: string,
  colonizationLevel = 1,
): GameState {
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
              'technology.aegis.sensors': 1,
              'technology.aegis.propulsion': 2,
              'technology.aegis.colonization': colonizationLevel,
            },
          }
        : research,
    ),
  };
}

function createExpedition(
  state: GameState,
  includeColonyShip = true,
): GameState {
  const origin = state.planets.find(
    (planet) => planet.ownerEmpireId === 'player',
  );
  if (origin === undefined) throw new Error('Player origin missing.');

  const result = executeGameCommand(state, {
    type: 'CREATE_FLEET',
    empireId: 'player',
    planetId: origin.id,
    ships: includeColonyShip
      ? { 'ship.aegis.colony': 1 }
      : { 'ship.aegis.scout': 1 },
    cargo: includeColonyShip
      ? { metal: 200, crystal: 100, gas: 50 }
      : { metal: 0, crystal: 0, gas: 0 },
  });
  if (!result.ok) throw new Error(result.code);
  return result.value;
}

describe('colonization', () => {
  it('creates a complete second colony and consumes the colony ship', () => {
    const initial = createExpedition(
      prepareColonizationState('colonization-success'),
    );
    const target = findFreeGalaxyPlanet(initial);
    const fleet = initial.fleets[0];
    expect(fleet).toBeDefined();
    if (fleet === undefined) return;

    const estimate = estimateFlightToGalaxyPlanet(
      initial.galaxy,
      initial.planets,
      fleet,
      target.planet.id,
    );
    const sent = executeGameCommand(initial, {
      type: 'SEND_FLEET',
      empireId: 'player',
      fleetId: fleet.id,
      targetPlanetId: target.planet.id,
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
      (planet) => planet.galaxyPlanetId === target.planet.id,
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
        'building.aegis.crystal-refinery',
        'building.aegis.gas-extractor',
        'building.aegis.power-plant',
      ]),
    );
    expect(
      arrived.value.galaxy.systems
        .flatMap((system) => system.planets)
        .find((planet) => planet.id === target.planet.id)?.ownerEmpireId,
    ).toBe('player');
    expect(getEmpireColonyCount(arrived.value, 'player')).toBe(2);
    expect(arrived.value.fleets).toHaveLength(0);
  });

  it('stations escort ships at the founded colony', () => {
    const prepared = prepareColonizationState('colonization-escort');
    const origin = prepared.planets.find(
      (planet) => planet.ownerEmpireId === 'player',
    );
    if (origin === undefined) throw new Error('Player origin missing.');
    const created = executeGameCommand(prepared, {
      type: 'CREATE_FLEET',
      empireId: 'player',
      planetId: origin.id,
      ships: {
        'ship.aegis.colony': 1,
        'ship.aegis.scout': 1,
      },
      cargo: { metal: 100, crystal: 50, gas: 25 },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const target = findFreeGalaxyPlanet(created.value);
    const fleet = created.value.fleets[0];
    if (fleet === undefined) throw new Error('Expedition fleet missing.');
    const estimate = estimateFlightToGalaxyPlanet(
      created.value.galaxy,
      created.value.planets,
      fleet,
      target.planet.id,
    );
    const sent = executeGameCommand(created.value, {
      type: 'SEND_FLEET',
      empireId: 'player',
      fleetId: fleet.id,
      targetPlanetId: target.planet.id,
      mission: 'colonize',
    });
    if (!sent.ok) throw new Error(sent.code);
    const arrived = executeGameCommand(sent.value, {
      type: 'ADVANCE_TIME',
      seconds: estimate.durationSeconds,
    });
    if (!arrived.ok) throw new Error(arrived.code);

    const colony = arrived.value.planets.find(
      (planet) => planet.galaxyPlanetId === target.planet.id,
    );
    expect(arrived.value.fleets[0]).toMatchObject({
      originPlanetId: colony?.id,
      status: 'stationed',
      location: { type: 'planet', planetId: colony?.id },
      ships: { 'ship.aegis.scout': 1 },
      mission: null,
    });
  });

  it('returns when another empire occupies the target before arrival', () => {
    const initial = createExpedition(
      prepareColonizationState('colonization-race'),
    );
    const target = findFreeGalaxyPlanet(initial);
    const fleet = initial.fleets[0];
    if (fleet === undefined) throw new Error('Expedition fleet missing.');
    const estimate = estimateFlightToGalaxyPlanet(
      initial.galaxy,
      initial.planets,
      fleet,
      target.planet.id,
    );
    const sent = executeGameCommand(initial, {
      type: 'SEND_FLEET',
      empireId: 'player',
      fleetId: fleet.id,
      targetPlanetId: target.planet.id,
      mission: 'colonize',
    });
    if (!sent.ok) throw new Error(sent.code);

    const occupied = {
      ...sent.value,
      galaxy: updateGalaxyPlanetOwner(
        sent.value.galaxy,
        target.planet.id,
        'aegis-bot',
      ),
    };
    const arrived = executeGameCommand(occupied, {
      type: 'ADVANCE_TIME',
      seconds: estimate.durationSeconds,
    });
    expect(arrived.ok).toBe(true);
    if (!arrived.ok) return;
    expect(arrived.value.fleets[0]?.status).toBe('returning');
    expect(
      arrived.value.planets.some(
        (planet) => planet.galaxyPlanetId === target.planet.id,
      ),
    ).toBe(false);
  });

  it('requires research, a colony ship and free colony capacity', () => {
    const withoutTech = createExpedition(
      prepareColonizationState('colonization-tech', 0),
    );
    const target = findFreeGalaxyPlanet(withoutTech);
    expect(
      executeGameCommand(withoutTech, {
        type: 'SEND_FLEET',
        empireId: 'player',
        fleetId: withoutTech.fleets[0]!.id,
        targetPlanetId: target.planet.id,
        mission: 'colonize',
      }),
    ).toMatchObject({ ok: false, code: 'COLONIZATION_TECH_REQUIRED' });

    const withoutShip = createExpedition(
      prepareColonizationState('colonization-ship'),
      false,
    );
    const secondTarget = findFreeGalaxyPlanet(withoutShip);
    expect(
      executeGameCommand(withoutShip, {
        type: 'SEND_FLEET',
        empireId: 'player',
        fleetId: withoutShip.fleets[0]!.id,
        targetPlanetId: secondTarget.planet.id,
        mission: 'colonize',
      }),
    ).toMatchObject({ ok: false, code: 'COLONY_SHIP_REQUIRED' });

    const base = prepareColonizationState('colonization-limit');
    const occupiedWorld = findFreeGalaxyPlanet(base);
    const extraColony = {
      ...base.planets.find((planet) => planet.ownerEmpireId === 'player')!,
      id: `colony-${occupiedWorld.planet.id}`,
      galaxyPlanetId: occupiedWorld.planet.id,
      systemId: occupiedWorld.system.id,
      position: occupiedWorld.planet.position,
      ownerEmpireId: 'player',
    };
    const atLimit = createExpedition({
      ...base,
      planets: [...base.planets, extraColony],
      galaxy: updateGalaxyPlanetOwner(
        base.galaxy,
        occupiedWorld.planet.id,
        'player',
      ),
    });
    const limitTarget = findFreeGalaxyPlanet(atLimit);
    expect(getColonyLimit(atLimit, 'player')).toBe(2);
    expect(
      executeGameCommand(atLimit, {
        type: 'SEND_FLEET',
        empireId: 'player',
        fleetId: atLimit.fleets[0]!.id,
        targetPlanetId: limitTarget.planet.id,
        mission: 'colonize',
      }),
    ).toMatchObject({ ok: false, code: 'COLONY_LIMIT_REACHED' });
  });
});
