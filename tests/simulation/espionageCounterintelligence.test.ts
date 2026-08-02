import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeGameCommand } from '../../src/simulation/executeGameCommand';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import { getMissionAvailability } from '../../src/simulation/fleets/missionRules';
import type { FleetState } from '../../src/simulation/fleets/types';
import {
  getScoutCooldownStatus,
  getScoutStrengthSummary,
  resolveScoutArrivalOutcome,
} from '../../src/simulation/intelligence/resolveScout';
import type { PlanetState } from '../../src/simulation/planet/types';
import type { GameCommand, GameState } from '../../src/simulation/types';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

interface ScoutFixture {
  readonly state: GameState;
  readonly fleet: FleetState;
  readonly origin: PlanetState;
  readonly target: PlanetState;
  readonly scoutUnitId: string;
  readonly fighterUnitId: string;
}

function setBuildingLevel(
  planet: PlanetState,
  buildingId: string,
  level: number,
): PlanetState {
  const exists = planet.buildings.some((building) => building.buildingId === buildingId);
  return {
    ...planet,
    buildings: exists
      ? planet.buildings.map((building) =>
          building.buildingId === buildingId
            ? { ...building, level }
            : building,
        )
      : [...planet.buildings, { buildingId, level }],
  };
}

function prepareFixture(
  seed: string,
  observerSensorLevel = 0,
  defenderSensorLevel = 0,
  sensorGridLevel = 0,
): ScoutFixture {
  const state = createInitialGameState(seed);
  const origin = state.planets.find((planet) => planet.ownerEmpireId === 'player');
  const target = state.planets.find(
    (planet) =>
      planet.ownerEmpireId !== 'player' &&
      state.empires.includes(planet.ownerEmpireId),
  );
  if (origin === undefined || target === undefined) {
    throw new Error('Managed scout fixture planets are missing.');
  }

  const observerRoles = getFactionMechanicalRoles(origin.factionId);
  const defenderRoles = getFactionMechanicalRoles(target.factionId);
  const scoutUnitId = observerRoles.ships.scout;
  const fighterUnitId = observerRoles.ships.fighter;
  const fleet: FleetState = {
    id: 'fleet-scout-fixture',
    empireId: 'player',
    originPlanetId: origin.id,
    location: { type: 'planet', planetId: origin.id },
    status: 'stationed',
    ships: { [scoutUnitId]: 1 },
    cargo: { metal: 0, crystal: 0, gas: 0 },
    speed: 1_000,
    cargoCapacity: 100,
    mission: null,
  };

  const prepared: GameState = {
    ...state,
    planets: state.planets.map((planet) => {
      if (planet.id === origin.id) {
        return {
          ...planet,
          economy: {
            ...planet.economy,
            resources: {
              ...planet.economy.resources,
              gas: {
                ...planet.economy.resources.gas,
                amount: 1_000_000,
                capacity: 1_000_000,
              },
            },
          },
        };
      }
      return planet.id === target.id
        ? setBuildingLevel(planet, defenderRoles.buildings.sensorGrid, sensorGridLevel)
        : planet;
    }),
    research: state.research.map((research) => {
      if (research.empireId === 'player') {
        return {
          ...research,
          levels: {
            ...research.levels,
            [observerRoles.research.sensors]: observerSensorLevel,
          },
        };
      }
      if (research.empireId === target.ownerEmpireId) {
        return {
          ...research,
          levels: {
            ...research.levels,
            [defenderRoles.research.sensors]: defenderSensorLevel,
          },
        };
      }
      return research;
    }),
    fleets: [...state.fleets, fleet],
  };

  return {
    state: prepared,
    fleet,
    origin: prepared.planets.find((planet) => planet.id === origin.id)!,
    target: prepared.planets.find((planet) => planet.id === target.id)!,
    scoutUnitId,
    fighterUnitId,
  };
}

function scoutCommand(
  fixture: ScoutFixture,
): Extract<GameCommand, { readonly type: 'SEND_FLEET' }> {
  return {
    type: 'SEND_FLEET',
    empireId: 'player',
    fleetId: fixture.fleet.id,
    targetPlanetId: fixture.target.id,
    mission: 'scout',
  };
}

function findSequence(
  fixture: ScoutFixture,
  detected: boolean,
): number {
  for (let sequence = 0; sequence < 500; sequence += 1) {
    const result = resolveScoutArrivalOutcome(
      fixture.state,
      fixture.fleet,
      fixture.target,
      sequence,
    );
    if (result.detected === detected) return sequence;
  }
  throw new Error(`No deterministic scout sequence found for detected=${detected}.`);
}

function advanceToScoutArrival(
  state: GameState,
  fleetId: string,
): GameState {
  const event = state.pendingEvents.find(
    (candidate) =>
      candidate.payload.type === 'FLEET_ARRIVE' &&
      candidate.payload.fleetId === fleetId,
  );
  if (event === undefined) throw new Error('Scout arrival event is missing.');
  const advanced = executeGameCommand(state, {
    type: 'ADVANCE_TIME',
    seconds: event.executeAt - state.clock.elapsedSeconds,
  });
  if (!advanced.ok) throw new Error(advanced.code);
  return advanced.value;
}

describe('espionage and counter-intelligence', () => {
  it('requires exactly one scout-role ship and zero cargo', () => {
    const fixture = prepareFixture('scout-composition');
    const mixed: GameState = {
      ...fixture.state,
      fleets: fixture.state.fleets.map((fleet) =>
        fleet.id === fixture.fleet.id
          ? {
              ...fleet,
              ships: {
                [fixture.scoutUnitId]: 1,
                [fixture.fighterUnitId]: 1,
              },
            }
          : fleet,
      ),
    };
    expect(getMissionAvailability(mixed, scoutCommand(fixture))).toMatchObject({
      allowed: false,
      code: 'SCOUT_FLEET_COMPOSITION_INVALID',
    });

    const loaded: GameState = {
      ...fixture.state,
      fleets: fixture.state.fleets.map((fleet) =>
        fleet.id === fixture.fleet.id
          ? { ...fleet, cargo: { metal: 1, crystal: 0, gas: 0 } }
          : fleet,
      ),
    };
    expect(getMissionAvailability(loaded, scoutCommand(fixture))).toMatchObject({
      allowed: false,
      code: 'SCOUT_CARGO_NOT_ALLOWED',
    });

    expect(getMissionAvailability(fixture.state, scoutCommand(fixture))).toMatchObject({
      allowed: true,
      code: 'MISSION_READY',
    });
  });

  it('derives basic, detailed and full tiers from relative strength', () => {
    const full = prepareFixture('scout-tier-full', 10, 0, 0);
    const detailed = prepareFixture('scout-tier-detailed', 0, 0, 1);
    const basic = prepareFixture('scout-tier-basic', 0, 10, 10);

    expect(getScoutStrengthSummary(full.state, 'player', full.target).level).toBe(3);
    expect(getScoutStrengthSummary(detailed.state, 'player', detailed.target).level).toBe(2);
    expect(getScoutStrengthSummary(basic.state, 'player', basic.target).level).toBe(1);

    const fullResult = resolveScoutArrivalOutcome(full.state, full.fleet, full.target, 7);
    const detailedResult = resolveScoutArrivalOutcome(
      detailed.state,
      detailed.fleet,
      detailed.target,
      7,
    );
    const basicResult = resolveScoutArrivalOutcome(basic.state, basic.fleet, basic.target, 7);
    const fullSnapshot = fullResult.state.intelligence
      .find((entry) => entry.empireId === 'player')
      ?.observations[0]?.snapshot;
    const detailedSnapshot = detailedResult.state.intelligence
      .find((entry) => entry.empireId === 'player')
      ?.observations[0]?.snapshot;
    const basicSnapshot = basicResult.state.intelligence
      .find((entry) => entry.empireId === 'player')
      ?.observations[0]?.snapshot;

    expect(fullSnapshot).toMatchObject({ level: 3 });
    expect(fullSnapshot?.defenses).toBeDefined();
    expect(detailedSnapshot).toMatchObject({ level: 2 });
    expect(detailedSnapshot?.resources).toBeDefined();
    expect(detailedSnapshot?.defenses).toBeUndefined();
    expect(basicSnapshot).toMatchObject({ level: 1 });
    expect(basicSnapshot?.resources).toBeUndefined();
  });

  it('enforces cooldown until the exact deterministic boundary', () => {
    const fixture = prepareFixture('scout-cooldown', 2, 1, 1);
    const observed = resolveScoutArrivalOutcome(
      fixture.state,
      fixture.fleet,
      fixture.target,
      11,
    ).state;
    const status = getScoutCooldownStatus(observed, 'player', fixture.target);
    expect(status.nextAllowedAt).toBe(status.cooldownSeconds);

    const beforeBoundary: GameState = {
      ...observed,
      clock: { ...observed.clock, elapsedSeconds: status.nextAllowedAt - 1 },
    };
    expect(
      getMissionAvailability(beforeBoundary, scoutCommand(fixture)),
    ).toMatchObject({ allowed: false, code: 'SCOUT_COOLDOWN_ACTIVE' });

    const atBoundary: GameState = {
      ...observed,
      clock: { ...observed.clock, elapsedSeconds: status.nextAllowedAt },
    };
    expect(getMissionAvailability(atBoundary, scoutCommand(fixture))).toMatchObject({
      allowed: true,
      code: 'MISSION_READY',
    });
  });

  it('records observation and alert, then removes a detected probe without return', () => {
    const fixture = prepareFixture('scout-detected', 0, 8, 8);
    const sequence = findSequence(fixture, true);
    const prepared = { ...fixture.state, nextEventSequence: sequence };
    const sent = executeGameCommand(prepared, scoutCommand(fixture));
    expect(sent.ok).toBe(true);
    if (!sent.ok) return;

    const arrived = advanceToScoutArrival(sent.value, fixture.fleet.id);
    expect(arrived.fleets.some((fleet) => fleet.id === fixture.fleet.id)).toBe(false);
    expect(
      arrived.pendingEvents.some(
        (event) =>
          event.payload.type === 'FLEET_RETURN' &&
          event.payload.fleetId === fixture.fleet.id,
      ),
    ).toBe(false);
    expect(
      arrived.intelligence
        .find((entry) => entry.empireId === 'player')
        ?.observations[0],
    ).toMatchObject({ targetPlanetId: fixture.target.id, detected: true });
    expect(
      arrived.intelligence
        .find((entry) => entry.empireId === fixture.target.ownerEmpireId)
        ?.alerts[0],
    ).toMatchObject({ targetPlanetId: fixture.target.id });
  });

  it('returns an undetected probe through the existing return path', () => {
    const fixture = prepareFixture('scout-undetected', 8, 0, 0);
    const sequence = findSequence(fixture, false);
    const prepared = { ...fixture.state, nextEventSequence: sequence };
    const sent = executeGameCommand(prepared, scoutCommand(fixture));
    expect(sent.ok).toBe(true);
    if (!sent.ok) return;

    const arrived = advanceToScoutArrival(sent.value, fixture.fleet.id);
    expect(arrived.fleets.find((fleet) => fleet.id === fixture.fleet.id)).toMatchObject({
      status: 'returning',
    });
    expect(
      arrived.pendingEvents.some(
        (event) =>
          event.payload.type === 'FLEET_RETURN' &&
          event.payload.fleetId === fixture.fleet.id,
      ),
    ).toBe(true);
  });

  it('repeats the same outcome and round-trips schema-v18 intelligence unchanged', () => {
    const fixture = prepareFixture('scout-determinism', 1, 4, 3);
    const sequence = findSequence(fixture, true);
    const first = resolveScoutArrivalOutcome(
      fixture.state,
      fixture.fleet,
      fixture.target,
      sequence,
    );
    const second = resolveScoutArrivalOutcome(
      fixture.state,
      fixture.fleet,
      fixture.target,
      sequence,
    );
    expect(second).toEqual(first);

    const envelope = createSaveEnvelope(
      'scout-intelligence',
      first.state,
      '2026-07-27T17:30:00.000Z',
    );
    const parsed = parseSaveJson(serializeSave(envelope));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.state.schemaVersion).toBe(18);
      expect(parsed.value.state.intelligence).toEqual(first.state.intelligence);
    }
  });
});
