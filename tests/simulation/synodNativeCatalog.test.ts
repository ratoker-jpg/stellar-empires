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
import { LEGACY_AEGIS_TO_SYNOD_IDS } from '../../src/storage/migrateLegacySynodAliases';

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

function addSynodInfrastructure(state: GameState, empireId: string): GameState {
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
                  'building.synod.concord-nexus',
                  'building.synod.cognition-vault',
                  'building.synod.lattice-yard',
                  'building.synod.deep-array',
                  'building.synod.shield-foundry',
                ].includes(building.buildingId),
              ),
              { buildingId: 'building.synod.concord-nexus', level: 4 },
              { buildingId: 'building.synod.cognition-vault', level: 5 },
              { buildingId: 'building.synod.lattice-yard', level: 4 },
              { buildingId: 'building.synod.deep-array', level: 4 },
              { buildingId: 'building.synod.shield-foundry', level: 3 },
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
              'technology.synod.distributed-construction': 3,
              'technology.synod.harmonic-grid': 3,
              'technology.synod.deep-sight': 3,
              'technology.synod.vector-folding': 3,
              'technology.synod.coherent-shields': 3,
              'technology.synod.precision-fire': 3,
              'technology.synod.seed-consensus': 1,
            },
          }
        : research,
    ),
  };
}

function reverseLegacyId(value: string): string {
  return Object.entries(LEGACY_AEGIS_TO_SYNOD_IDS).find(([, nativeId]) => nativeId === value)?.[0] ?? value;
}

describe('native Synod runtime', () => {
  it('starts a Synod game with native buildings and a valid economy', () => {
    const state = createInitialGameState('synod-start', 'synod');
    const planet = state.planets.find((candidate) => candidate.ownerEmpireId === 'player');
    expect(planet).toBeDefined();
    if (planet === undefined) return;

    expect(planet.factionId).toBe('synod');
    expect(planet.buildings).toHaveLength(5);
    expect(planet.buildings.every((building) => building.buildingId.startsWith('building.synod.'))).toBe(true);
    expect(planet.economy.energy.produced).toBeGreaterThan(planet.economy.energy.consumed);
    expect(planet.economy.resources.metal.productionPerHour).toBeGreaterThan(0);
    expect(planet.economy.resources.crystal.productionPerHour).toBeGreaterThan(0);
    expect(planet.economy.resources.gas.productionPerHour).toBeGreaterThan(0);
  });

  it('accepts native Synod building, research, ship and defense queues', () => {
    const initial = createInitialGameState('synod-queues', 'synod');
    const planet = initial.planets.find((candidate) => candidate.ownerEmpireId === 'player')!;
    const building = executeCommand(initial, {
      type: 'QUEUE_BUILDING',
      empireId: 'player',
      planetId: planet.id,
      buildingId: 'building.synod.concord-nexus',
    });
    expect(building.ok).toBe(true);

    const ready = addSynodInfrastructure(initial, 'player');
    const readyPlanet = ready.planets.find((candidate) => candidate.ownerEmpireId === 'player')!;
    expect(executeCommand(ready, {
      type: 'QUEUE_RESEARCH',
      empireId: 'player',
      planetId: readyPlanet.id,
      technologyId: 'technology.synod.chorus-command',
    }).ok).toBe(true);
    expect(executeCommand(ready, {
      type: 'QUEUE_UNIT_BATCH',
      empireId: 'player',
      planetId: readyPlanet.id,
      unitId: 'ship.synod.whisper',
      quantity: 1,
    }).ok).toBe(true);
    expect(executeCommand(ready, {
      type: 'QUEUE_UNIT_BATCH',
      empireId: 'player',
      planetId: readyPlanet.id,
      unitId: 'defense.synod.lance-node',
      quantity: 1,
    }).ok).toBe(true);
  });

  it('uses Synod shipyard and sensor infrastructure for capacity', () => {
    const state = addSynodInfrastructure(createInitialGameState('synod-capacity', 'synod'), 'player');
    const planet = state.planets.find((candidate) => candidate.ownerEmpireId === 'player')!;
    expect(getHangarCapacity(planet)).toBe(100);
    expect(getDefenseGridCapacity(planet)).toBe(48);
  });

  it('accepts scout, recycle and colonize missions with Synod hulls', () => {
    const base = addSynodInfrastructure(createInitialGameState('synod-missions', 'synod'), 'player');
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

    expect(sendFleet(fleetState('synod-scout', { 'ship.synod.whisper': 1 }), {
      type: 'SEND_FLEET',
      empireId: 'player',
      fleetId: 'synod-scout',
      targetPlanetId: foreign.id,
      mission: 'scout',
    }).ok).toBe(true);

    const recycleState = {
      ...fleetState('synod-recycler', { 'ship.synod.salvage-mind': 1 }),
      debrisFields: [{
        id: 'synod-debris',
        planetId: foreign.id,
        metal: 500,
        crystal: 200,
        createdAt: 0,
      }],
    };
    expect(sendFleet(recycleState, {
      type: 'SEND_FLEET',
      empireId: 'player',
      fleetId: 'synod-recycler',
      targetPlanetId: foreign.id,
      mission: 'recycle',
    }).ok).toBe(true);

    expect(sendFleet(fleetState('synod-colonizer', { 'ship.synod.seed-ark': 1 }), {
      type: 'SEND_FLEET',
      empireId: 'player',
      fleetId: 'synod-colonizer',
      targetPlanetId: freePlanet.id,
      mission: 'colonize',
    }).ok).toBe(true);
  });

  it('resolves Synod combat profiles and produces a valid bot command', () => {
    expect(getUnitCombatProfile('ship.synod.oracle-dreadnought')).toMatchObject({
      weaponType: 'disruptor',
      protectionType: 'shield-grid',
    });

    const state = fillResources(createInitialGameState('synod-bot-command'), 'synod-bot');
    const plan = planBotEconomy(state, 'synod-bot');
    expect(plan.command).not.toBeNull();
    if (plan.command === null) return;
    expect(executeCommand(state, plan.command).ok).toBe(true);
    if (plan.command.type === 'QUEUE_BUILDING') {
      expect(plan.command.buildingId.startsWith('building.synod.')).toBe(true);
    }
  });

  it('does not expose Aegis building definitions on a Synod planet view-model', () => {
    const state = createInitialGameState('synod-view-model', 'synod');
    const planet = state.planets.find((candidate) => candidate.ownerEmpireId === 'player')!;
    const cards = createBuildingCardViewModels(planet);
    expect(cards).toHaveLength(12);
    expect(cards.every((card) => card.id.startsWith('building.synod.'))).toBe(true);
    expect(cards.some((card) => card.id.includes('.aegis.'))).toBe(false);
  });

  it('migrates alias-era Synod saves deterministically and preserves round-trip validity', () => {
    const native = createInitialGameState('synod-alias-save', 'synod');
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
        id: 'legacy-synod-scout',
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
    const legacySave = createSaveEnvelope('legacy-synod', aliasState, '2026-07-21T12:00:00.000Z');
    const first = parseSaveJson(serializeSave(legacySave));
    const second = parseSaveJson(serializeSave(legacySave));
    expect(first).toEqual(second);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const migratedPlanet = first.value.state.planets.find((planet) => planet.id === playerPlanet.id)!;
    expect(migratedPlanet.buildings.every((building) => building.buildingId.startsWith('building.synod.'))).toBe(true);
    expect(migratedPlanet.inventory.ships).toEqual({ 'ship.synod.whisper': 1 });
    expect(first.value.state.research.find((research) => research.empireId === 'player')?.levels)
      .toEqual({ 'technology.synod.deep-sight': 2 });
    expect(first.value.state.fleets[0]?.ships).toEqual({ 'ship.synod.whisper': 1 });

    const roundTrip = createSaveEnvelope('native-synod', first.value.state, '2026-07-21T12:05:00.000Z');
    expect(parseSaveJson(serializeSave(roundTrip))).toEqual({ ok: true, value: roundTrip });
  });
});
