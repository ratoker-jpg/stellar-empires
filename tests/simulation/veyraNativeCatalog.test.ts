import { describe, expect, it } from 'vitest';
import { planBotEconomy } from '../../src/simulation/bots/economyPlanner';
import { getUnitCombatProfile } from '../../src/simulation/combat/combatProfiles';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getDefenseGridCapacity } from '../../src/simulation/defense/planetaryDefense';
import { sendFleet } from '../../src/simulation/fleets/flightCommands';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState } from '../../src/simulation/types';
import { getHangarCapacity } from '../../src/simulation/units/inventory';
import { createBuildingCardViewModels } from '../../src/ui/planetViewModel';
import { createSaveEnvelope, parseSaveJson, serializeSave } from '../../src/storage/saveFormat';
import { LEGACY_AEGIS_TO_VEYRA_IDS } from '../../src/storage/migrateLegacyVeyraAliases';

const ZERO_CARGO = { metal: 0, crystal: 0, gas: 0 } as const;

function fillResources(state: GameState, empireId: string): GameState {
  return {
    ...state,
    planets: state.planets.map((planet) =>
      planet.ownerEmpireId === empireId
        ? {
            ...planet,
            economy: {
              ...planet.economy,
              resources: {
                metal: { ...planet.economy.resources.metal, amount: planet.economy.resources.metal.capacity },
                crystal: { ...planet.economy.resources.crystal, amount: planet.economy.resources.crystal.capacity },
                gas: { ...planet.economy.resources.gas, amount: planet.economy.resources.gas.capacity },
              },
            },
          }
        : planet,
    ),
  };
}

function addVeyraInfrastructure(state: GameState, empireId: string): GameState {
  const funded = fillResources(state, empireId);
  return {
    ...funded,
    planets: funded.planets.map((planet) =>
      planet.ownerEmpireId === empireId
        ? {
            ...planet,
            specializationId: 'industry' as const,
            buildings: [
              ...planet.buildings.filter((building) =>
                ![
                  'building.veyra.swarm-heart',
                  'building.veyra.memory-pod',
                  'building.veyra.living-dock',
                  'building.veyra.pulse-canopy',
                  'building.veyra.carapace-forge',
                ].includes(building.buildingId),
              ),
              { buildingId: 'building.veyra.swarm-heart', level: 4 },
              { buildingId: 'building.veyra.memory-pod', level: 5 },
              { buildingId: 'building.veyra.living-dock', level: 4 },
              { buildingId: 'building.veyra.pulse-canopy', level: 4 },
              { buildingId: 'building.veyra.carapace-forge', level: 3 },
            ],
          }
        : planet,
    ),
    research: funded.research.map((research) =>
      research.empireId === empireId
        ? {
            ...research,
            levels: {
              ...research.levels,
              'technology.veyra.adaptive-growth': 3,
              'technology.veyra.photosynthetic-grid': 3,
              'technology.veyra.echo-sense': 3,
              'technology.veyra.living-thrust': 3,
              'technology.veyra.carapace-weave': 3,
              'technology.veyra.predator-instinct': 3,
              'technology.veyra.brood-seeding': 1,
            },
          }
        : research,
    ),
  };
}

function reverseLegacyId(value: string): string {
  return Object.entries(LEGACY_AEGIS_TO_VEYRA_IDS).find(([, nativeId]) => nativeId === value)?.[0] ?? value;
}

describe('native Veyra runtime', () => {
  it('starts a Veyra game with native buildings and a valid economy', () => {
    const state = createInitialGameState('veyra-start', 'veyra');
    const planet = state.planets.find((candidate) => candidate.ownerEmpireId === 'player');
    expect(planet).toBeDefined();
    if (planet === undefined) return;

    expect(planet.factionId).toBe('veyra');
    expect(planet.buildings).toHaveLength(5);
    expect(planet.buildings.every((building) => building.buildingId.startsWith('building.veyra.'))).toBe(true);
    expect(planet.economy.energy.produced).toBeGreaterThan(planet.economy.energy.consumed);
    expect(planet.economy.resources.metal.productionPerHour).toBeGreaterThan(0);
    expect(planet.economy.resources.crystal.productionPerHour).toBeGreaterThan(0);
    expect(planet.economy.resources.gas.productionPerHour).toBeGreaterThan(0);
  });

  it('accepts native Veyra building, research, ship and defense queues', () => {
    const initial = createInitialGameState('veyra-queues', 'veyra');
    const planet = initial.planets.find((candidate) => candidate.ownerEmpireId === 'player')!;
    const building = executeCommand(initial, {
      type: 'QUEUE_BUILDING',
      empireId: 'player',
      planetId: planet.id,
      buildingId: 'building.veyra.swarm-heart',
    });
    expect(building.ok).toBe(true);

    const ready = addVeyraInfrastructure(initial, 'player');
    const readyPlanet = ready.planets.find((candidate) => candidate.ownerEmpireId === 'player')!;
    expect(executeCommand(ready, {
      type: 'QUEUE_RESEARCH',
      empireId: 'player',
      planetId: readyPlanet.id,
      technologyId: 'technology.veyra.swarm-mind',
    }).ok).toBe(true);
    expect(executeCommand(ready, {
      type: 'QUEUE_UNIT_BATCH',
      empireId: 'player',
      planetId: readyPlanet.id,
      unitId: 'ship.veyra.wisp',
      quantity: 1,
    }).ok).toBe(true);
    expect(executeCommand(ready, {
      type: 'QUEUE_UNIT_BATCH',
      empireId: 'player',
      planetId: readyPlanet.id,
      unitId: 'defense.veyra.thorn-spire',
      quantity: 1,
    }).ok).toBe(true);
  });

  it('uses Veyra shipyard and sensor infrastructure for capacity', () => {
    const state = addVeyraInfrastructure(createInitialGameState('veyra-capacity', 'veyra'), 'player');
    const planet = state.planets.find((candidate) => candidate.ownerEmpireId === 'player')!;
    expect(getHangarCapacity(planet)).toBe(100);
    expect(getDefenseGridCapacity(planet)).toBe(48);
  });

  it('accepts scout, recycle and colonize missions with Veyra hulls', () => {
    const base = addVeyraInfrastructure(createInitialGameState('veyra-missions', 'veyra'), 'player');
    const origin = base.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    const foreign = base.planets.find((planet) => planet.ownerEmpireId !== 'player')!;
    const freePlanet = base.galaxy.systems
      .flatMap((system) => system.planets)
      .find((planet) => planet.ownerEmpireId === null && planet.biome !== 'gas')!;

    const fleetState = (id: string, ships: Readonly<Record<string, number>>): GameState => ({
      ...base,
      fleets: [{
        id,
        empireId: 'player',
        originPlanetId: origin.id,
        location: { type: 'planet' as const, planetId: origin.id },
        status: 'stationed' as const,
        ships,
        cargo: ZERO_CARGO,
        speed: 10,
        cargoCapacity: 1_000,
        mission: null,
      }],
    });

    expect(sendFleet(fleetState('veyra-scout', { 'ship.veyra.wisp': 1 }), {
      type: 'SEND_FLEET',
      empireId: 'player',
      fleetId: 'veyra-scout',
      targetPlanetId: foreign.id,
      mission: 'scout',
    }).ok).toBe(true);

    const recycleState = {
      ...fleetState('veyra-recycler', { 'ship.veyra.devourer': 1 }),
      debrisFields: [{
        id: 'veyra-debris',
        planetId: foreign.id,
        metal: 500,
        crystal: 200,
        createdAt: 0,
      }],
    };
    expect(sendFleet(recycleState, {
      type: 'SEND_FLEET',
      empireId: 'player',
      fleetId: 'veyra-recycler',
      targetPlanetId: foreign.id,
      mission: 'recycle',
    }).ok).toBe(true);

    expect(sendFleet(fleetState('veyra-colonizer', { 'ship.veyra.brood-ark': 1 }), {
      type: 'SEND_FLEET',
      empireId: 'player',
      fleetId: 'veyra-colonizer',
      targetPlanetId: freePlanet.id,
      mission: 'colonize',
    }).ok).toBe(true);
  });

  it('resolves Veyra combat profiles and produces a valid bot command', () => {
    expect(getUnitCombatProfile('ship.veyra.leviathan')).toMatchObject({
      weaponType: 'plasma',
      protectionType: 'light-armor',
    });

    const state = fillResources(createInitialGameState('veyra-bot-command'), 'veyra-bot');
    const plan = planBotEconomy(state, 'veyra-bot');
    expect(plan.command).not.toBeNull();
    if (plan.command === null) return;
    expect(executeCommand(state, plan.command).ok).toBe(true);
    if (plan.command.type === 'QUEUE_BUILDING') {
      expect(plan.command.buildingId.startsWith('building.veyra.')).toBe(true);
    }
  });

  it('does not expose Aegis building definitions on a Veyra planet view-model', () => {
    const state = createInitialGameState('veyra-view-model', 'veyra');
    const planet = state.planets.find((candidate) => candidate.ownerEmpireId === 'player')!;
    const cards = createBuildingCardViewModels(planet);
    expect(cards).toHaveLength(12);
    expect(cards.every((card) => card.id.startsWith('building.veyra.'))).toBe(true);
    expect(cards.some((card) => card.id.includes('.aegis.'))).toBe(false);
  });

  it('migrates alias-era Veyra saves deterministically and preserves round-trip validity', () => {
    const native = createInitialGameState('veyra-alias-save', 'veyra');
    const playerPlanet = native.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    const aliasState: GameState = {
      ...native,
      planets: native.planets.map((planet) =>
        planet.id === playerPlanet.id
          ? {
              ...planet,
              buildings: planet.buildings.map((building) => ({
                ...building,
                buildingId: reverseLegacyId(building.buildingId),
              })),
              inventory: { ships: { 'ship.aegis.scout': 1 }, defenses: {} },
            }
          : planet,
      ),
      research: native.research.map((research) =>
        research.empireId === 'player'
          ? { ...research, levels: { 'technology.aegis.sensors': 2 } }
          : research,
      ),
      fleets: [{
        id: 'legacy-veyra-scout',
        empireId: 'player',
        originPlanetId: playerPlanet.id,
        location: { type: 'planet' as const, planetId: playerPlanet.id },
        status: 'stationed' as const,
        ships: { 'ship.aegis.scout': 1 },
        cargo: ZERO_CARGO,
        speed: 14,
        cargoCapacity: 20,
        mission: null,
      }],
    };
    const legacySave = createSaveEnvelope('legacy-veyra', aliasState, '2026-07-21T12:00:00.000Z');
    const first = parseSaveJson(serializeSave(legacySave));
    const second = parseSaveJson(serializeSave(legacySave));
    expect(first).toEqual(second);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const migratedPlanet = first.value.state.planets.find((planet) => planet.id === playerPlanet.id)!;
    expect(migratedPlanet.buildings.every((building) => building.buildingId.startsWith('building.veyra.'))).toBe(true);
    expect(migratedPlanet.inventory.ships).toEqual({ 'ship.veyra.wisp': 1 });
    expect(first.value.state.research.find((research) => research.empireId === 'player')?.levels)
      .toEqual({ 'technology.veyra.echo-sense': 2 });
    expect(first.value.state.fleets[0]?.ships).toEqual({ 'ship.veyra.wisp': 1 });

    const roundTrip = createSaveEnvelope('native-veyra', first.value.state, '2026-07-21T12:05:00.000Z');
    expect(parseSaveJson(serializeSave(roundTrip))).toEqual({ ok: true, value: roundTrip });
  });
});
