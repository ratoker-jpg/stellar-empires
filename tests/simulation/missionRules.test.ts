import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeGameCommand } from '../../src/simulation/executeGameCommand';
import {
  getFleetSlotSummary,
  getMissionAvailability,
  listMissionTargets,
} from '../../src/simulation/fleets/missionRules';
import type { FleetState } from '../../src/simulation/fleets/types';
import type { GameState } from '../../src/simulation/types';

const ZERO_CARGO = { metal: 0, crystal: 0, gas: 0 } as const;

function stationedFleet(
  originPlanetId: string,
  ships: Readonly<Record<string, number>> = { 'ship.aegis.scout': 1 },
  id = 'mission-rules-fleet',
): FleetState {
  return {
    id,
    empireId: 'player',
    originPlanetId,
    location: { type: 'planet', planetId: originPlanetId },
    status: 'stationed',
    ships,
    cargo: ZERO_CARGO,
    speed: 14,
    cargoCapacity: 250,
    mission: null,
  };
}

function prepareState(seed: string): GameState {
  const state = createInitialGameState(seed);
  const origin = state.planets.find((planet) => planet.ownerEmpireId === 'player');
  if (origin === undefined) throw new Error('Player origin missing.');
  return {
    ...state,
    planets: state.planets.map((planet) =>
      planet.id === origin.id
        ? {
            ...planet,
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
    fleets: [stationedFleet(origin.id)],
  };
}

function withFullObservation(state: GameState, targetPlanetId: string): GameState {
  const target = state.planets.find((planet) => planet.id === targetPlanetId);
  if (target === undefined) throw new Error('Target missing.');
  return {
    ...state,
    intelligence: state.intelligence.map((entry) =>
      entry.empireId === 'player'
        ? {
            ...entry,
            observations: [
              ...entry.observations,
              {
                id: 'intel-full-target',
                observerEmpireId: 'player',
                targetPlanetId: target.id,
                coordinate: target.coordinate,
                observedAt: state.clock.elapsedSeconds,
                expiresAt: state.clock.elapsedSeconds + 10_000,
                detected: false,
                snapshot: {
                  planetId: target.id,
                  coordinate: target.coordinate,
                  name: target.name,
                  ownerEmpireId: target.ownerEmpireId,
                  factionId: target.factionId,
                  level: 3,
                  resources: {
                    metal: target.economy.resources.metal.amount,
                    crystal: target.economy.resources.crystal.amount,
                    gas: target.economy.resources.gas.amount,
                    energyProduced: target.economy.energy.produced,
                    energyConsumed: target.economy.energy.consumed,
                  },
                  buildings: Object.fromEntries(
                    target.buildings.map((building) => [building.buildingId, building.level]),
                  ),
                  defenses: { ...target.inventory.defenses },
                  stationedFleets: [],
                },
              },
            ],
          }
        : entry,
    ),
  };
}

describe('ordinary mission rules', () => {
  it('returns redacted foreign contacts without exposing owner identity', () => {
    const state = prepareState('mission-target-redaction');
    const fleet = state.fleets[0]!;
    const targets = listMissionTargets(state, 'player', fleet, 'scout');
    const contact = targets.find((target) => target.visibility === 'contact');

    expect(contact).toBeDefined();
    expect(contact?.knownOwnerEmpireId).toBeNull();
    expect(contact?.knownFactionId).toBeNull();
    expect(contact?.label).toContain('неизвестный контакт');
    expect(state.empires.some((empireId) => contact?.label.includes(empireId))).toBe(false);
  });

  it('enforces the calculated flight-slot capacity before route and fuel work', () => {
    const base = prepareState('mission-slot-limit');
    const origin = base.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    const target = base.planets.find((planet) => planet.ownerEmpireId !== 'player')!;
    const slots = getFleetSlotSummary(base, 'player');
    const active = Array.from({ length: slots.capacity }, (_, index): FleetState => ({
      ...stationedFleet(origin.id, { 'ship.aegis.cargo': 1 }, `active-${index}`),
      status: 'outbound',
      location: {
        type: 'transit',
        fromPlanetId: origin.id,
        toPlanetId: target.id,
        departedAt: 0,
        arrivesAt: 100,
      },
      mission: { kind: 'transport', targetPlanetId: target.id },
    }));
    const state = { ...base, fleets: [...active, base.fleets[0]!] };
    const command = {
      type: 'SEND_FLEET' as const,
      empireId: 'player',
      fleetId: base.fleets[0]!.id,
      targetPlanetId: target.id,
      mission: 'scout' as const,
    };

    expect(getMissionAvailability(state, command)).toMatchObject({
      allowed: false,
      code: 'FLIGHT_SLOT_LIMIT_REACHED',
      slotCapacity: slots.capacity,
      slotUsed: slots.capacity,
    });
    expect(executeGameCommand(state, command)).toMatchObject({
      ok: false,
      code: 'FLIGHT_SLOT_LIMIT_REACHED',
    });
  });

  it('requires current level-three intelligence for attack and then returns one deterministic estimate', () => {
    const base = prepareState('mission-attack-intelligence');
    const origin = base.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    const target = base.planets.find((planet) => planet.ownerEmpireId !== 'player')!;
    const armedFleet = stationedFleet(
      origin.id,
      { 'ship.aegis.fighter': 2 },
      'armed-fleet',
    );
    const withoutIntel = { ...base, fleets: [armedFleet] };
    const command = {
      type: 'SEND_FLEET' as const,
      empireId: 'player',
      fleetId: armedFleet.id,
      targetPlanetId: target.id,
      mission: 'attack' as const,
    };

    expect(getMissionAvailability(withoutIntel, command)).toMatchObject({
      allowed: false,
      code: 'ATTACK_INTELLIGENCE_REQUIRED',
    });

    const withIntel = withFullObservation(withoutIntel, target.id);
    const first = getMissionAvailability(withIntel, command);
    const second = getMissionAvailability(withIntel, command);
    expect(first).toEqual(second);
    expect(first).toMatchObject({
      allowed: true,
      code: 'MISSION_READY',
      target: { id: target.id, visibility: 'current' },
    });
    expect(first.estimate).not.toBeNull();
  });
});
