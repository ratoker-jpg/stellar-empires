import { describe, expect, it } from 'vitest';
import { advanceCampaignTime } from '../../src/simulation/campaign/time';
import type { BattleReport, PlanetDestructionReport } from '../../src/simulation/combat/types';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { STATE_HISTORY_LIMITS } from '../../src/simulation/history/stateHistory';
import type { FactionId } from '../../src/simulation/planet/types';
import { PIRATE_EMPIRE_ID } from '../../src/simulation/pve/neutralForces';
import {
  calculatePveRewardMultiplier,
  PIRATE_HUNT_REWARD_PERMILLE,
} from '../../src/simulation/pve/pveBalance';
import { getRequiredSpaceObjectShipId } from '../../src/simulation/pve/spaceObjects';
import { PVE_TARGET_RECOVERY_SECONDS } from '../../src/simulation/pve/targetRecovery';
import { startWorldEventAt } from '../../src/simulation/pve/worldEvents';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState, ScheduledGameEvent } from '../../src/simulation/types';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

const TOTAL_SECONDS = 172_800;
const CHUNK_SECONDS = 21_600;
const SAVE_SPLIT_SECONDS = 86_400;
const FACTIONS: readonly FactionId[] = ['aegis', 'synod', 'veyra'];

interface Fixture {
  readonly state: GameState;
  readonly factionId: FactionId;
  readonly objectId: string;
  readonly survivingPirateId: string;
  readonly freeRespawnPirateId: string;
  readonly blockedRespawnPirateId: string;
  readonly blockerPlanetId: string;
  readonly otherPirateId: string;
}

function destructionReport(planetDestroyed: boolean): PlanetDestructionReport {
  return {
    attackerContributions: [],
    defenderContributions: [],
    defensePopulation: 0,
    rawChanceBasisPoints: planetDestroyed ? 10_000 : 0,
    defenseReductionBasisPoints: 0,
    defenderPlanetDestroyerReductionBasisPoints: 0,
    poliasReductionBasisPoints: 0,
    finalChanceBasisPoints: planetDestroyed ? 10_000 : 0,
    rollBasisPoints: 0,
    blockedReason: planetDestroyed ? null : 'ZERO_FINAL_CHANCE',
    planetDestroyed,
  };
}

function reportFor(
  state: GameState,
  planetId: string,
  id: string,
  destroyed: boolean,
): BattleReport {
  const planet = state.planets.find((candidate) => candidate.id === planetId);
  if (planet === undefined) throw new Error(`Missing pirate target ${planetId}.`);
  return {
    id,
    seed: state.seed,
    resolvedAt: 1_800,
    targetPlanetId: planet.id,
    targetGalaxyPlanetId: planet.galaxyPlanetId,
    targetCoordinate: planet.coordinate,
    attackerEmpireId: 'player',
    defenderEmpireId: PIRATE_EMPIRE_ID,
    winner: 'attacker',
    rounds: [],
    attackerInitial: {},
    defenderInitial: {},
    attackerRemaining: {},
    defenderRemaining: {},
    destruction: destructionReport(destroyed),
    mode: 'pve',
  };
}

function scheduledBattle(report: BattleReport, sequence: number): ScheduledGameEvent {
  return {
    id: `event-${report.id}`,
    executeAt: report.resolvedAt,
    sequence,
    payload: { type: 'BATTLE_REPORT', report },
  };
}

function createFixture(factionId: FactionId): Fixture {
  const initial = createInitialGameState(`pve-sustainability-${factionId}`, { playerFaction: factionId });
  const object = initial.spaceObjects.find(
    (candidate) => candidate.kind === 'asteroid' || candidate.kind === 'gas-cloud',
  );
  const pirates = initial.planets
    .filter((planet) => planet.ownerEmpireId === PIRATE_EMPIRE_ID)
    .sort((left, right) => left.id.localeCompare(right.id));
  const surviving = pirates[0];
  const freeRespawn = pirates[1];
  const blockedRespawn = pirates[2];
  const playerOrigin = initial.planets.find((planet) => planet.ownerEmpireId === 'player');
  if (
    object === undefined ||
    surviving === undefined ||
    freeRespawn === undefined ||
    blockedRespawn === undefined ||
    playerOrigin === undefined
  ) {
    throw new Error(`Incomplete sustainability fixture for ${factionId}.`);
  }

  const requiredShipId = getRequiredSpaceObjectShipId(object.kind, factionId);
  const blockerPlanetId = `planet-${factionId}-blocked-pirate-slot`;
  const blocker = {
    ...playerOrigin,
    id: blockerPlanetId,
    galaxyPlanetId: blockedRespawn.galaxyPlanetId,
    systemId: blockedRespawn.systemId,
    position: blockedRespawn.position,
    coordinate: blockedRespawn.coordinate,
    name: `${factionId} occupation fixture`,
    buildQueue: [],
    productionQueues: { shipyard: [], defense: [] },
  };
  const originWithFuel = {
    ...playerOrigin,
    economy: {
      ...playerOrigin.economy,
      resources: {
        ...playerOrigin.economy.resources,
        gas: {
          ...playerOrigin.economy.resources.gas,
          amount: 1_000_000,
          capacity: 1_000_000,
        },
      },
    },
  };

  const reports = [
    reportFor(initial, surviving.id, `${factionId}-surviving-raid`, false),
    reportFor(initial, freeRespawn.id, `${factionId}-free-destruction`, true),
    reportFor(initial, blockedRespawn.id, `${factionId}-blocked-destruction`, true),
  ];
  const sequence = initial.nextEventSequence;
  let state: GameState = {
    ...initial,
    spaceObjects: initial.spaceObjects.map((candidate) =>
      candidate.id === object.id
        ? {
            ...candidate,
            remainingYield: 0,
            controllerEmpireId: 'player',
            controlExpiresAt: PVE_TARGET_RECOVERY_SECONDS,
            cooldownUntil: PVE_TARGET_RECOVERY_SECONDS,
          }
        : candidate),
    planets: [
      ...initial.planets
        .filter(
          (planet) =>
            planet.id !== freeRespawn.id &&
            planet.id !== blockedRespawn.id,
        )
        .map((planet) => {
          if (planet.id === playerOrigin.id) return originWithFuel;
          if (planet.id !== surviving.id) return planet;
          return {
            ...planet,
            economy: {
              ...planet.economy,
              resources: {
                metal: { ...planet.economy.resources.metal, amount: 0 },
                crystal: { ...planet.economy.resources.crystal, amount: 0 },
                gas: { ...planet.economy.resources.gas, amount: 0 },
              },
            },
            inventory: { ...planet.inventory, defenses: {} },
          };
        }),
      blocker,
    ],
    fleets: [
      ...initial.fleets,
      {
        id: `fleet-${factionId}-recovery-reuse`,
        empireId: 'player',
        originPlanetId: playerOrigin.id,
        location: { type: 'planet' as const, planetId: playerOrigin.id },
        status: 'stationed' as const,
        ships: { [requiredShipId]: 1 },
        cargo: { metal: 0, crystal: 0, gas: 0 },
        speed: 1_000,
        cargoCapacity: 10_000,
        mission: null,
      },
    ],
    pendingEvents: [
      ...initial.pendingEvents,
      ...reports.map((report, index) => scheduledBattle(report, sequence + index)),
    ].sort((left, right) => left.executeAt - right.executeAt || left.sequence - right.sequence),
    nextEventSequence: sequence + reports.length,
  };

  state = startWorldEventAt(
    state,
    'solar-storm',
    'system',
    object.systemId,
    0,
    0,
  );
  state = startWorldEventAt(
    state,
    'pirate-hunt',
    'planet',
    surviving.id,
    0,
    0,
  );

  return {
    state,
    factionId,
    objectId: object.id,
    survivingPirateId: surviving.id,
    freeRespawnPirateId: freeRespawn.id,
    blockedRespawnPirateId: blockedRespawn.id,
    blockerPlanetId,
    otherPirateId: freeRespawn.id,
  };
}

function advance(initial: GameState, seconds: number): GameState {
  const result = advanceCampaignTime(initial, seconds, {
    botProfiles: [],
    operationBudget: 2_048,
  });
  expect(result.complete).toBe(true);
  return result.state;
}

function runChunked(initial: GameState): GameState {
  let state = initial;
  for (let elapsed = 0; elapsed < TOTAL_SECONDS; elapsed += CHUNK_SECONDS) {
    state = advance(state, CHUNK_SECONDS);
  }
  return state;
}

function runSaveLoaded(initial: GameState, factionId: FactionId): GameState {
  const first = advance(initial, SAVE_SPLIT_SECONDS);
  const parsed = parseSaveJson(serializeSave(
    createSaveEnvelope(
      `pve-sustainability-${factionId}`,
      first,
      '2026-08-02T10:00:00.000Z',
    ),
  ));
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) throw new Error(parsed.message);
  return advance(parsed.value.state, TOTAL_SECONDS - SAVE_SPLIT_SECONDS);
}

function expectUniqueTargets(state: GameState): void {
  expect(new Set(state.spaceObjects.map((object) => object.id)).size).toBe(state.spaceObjects.length);
  expect(new Set(state.planets.map((planet) => planet.id)).size).toBe(state.planets.length);
  expect(new Set(state.planets.map((planet) => planet.galaxyPlanetId)).size).toBe(
    state.planets.length,
  );
}

describe('three-faction sustainable PvE closure gate', () => {
  for (const factionId of FACTIONS) {
    it(`${factionId}: preserves the complete 48-hour PvE state across partitions`, () => {
      const fixture = createFixture(factionId);
      const initialPlanetCount = fixture.state.planets.length;
      const initialObjectCount = fixture.state.spaceObjects.length;
      const direct = advance(fixture.state, TOTAL_SECONDS);
      const chunked = runChunked(fixture.state);
      const saveLoaded = runSaveLoaded(fixture.state, factionId);

      expect(chunked).toEqual(direct);
      expect(saveLoaded).toEqual(direct);
      expect(direct.planets).toHaveLength(initialPlanetCount + 1);
      expect(direct.spaceObjects).toHaveLength(initialObjectCount);
      expectUniqueTargets(direct);

      expect(direct.spaceObjects.find((object) => object.id === fixture.objectId)).toMatchObject({
        remainingYield: fixture.state.spaceObjects.find(
          (object) => object.id === fixture.objectId,
        )?.initialYield,
        controllerEmpireId: null,
        controlExpiresAt: null,
        cooldownUntil: 0,
      });
      expect(direct.planets.find((planet) => planet.id === fixture.survivingPirateId)).toBeDefined();
      expect(direct.planets.find((planet) => planet.id === fixture.freeRespawnPirateId)).toBeDefined();
      expect(direct.planets.find((planet) => planet.id === fixture.blockedRespawnPirateId)).toBeUndefined();
      expect(direct.planets.find((planet) => planet.id === fixture.blockerPlanetId)).toBeDefined();

      expect(direct.worldEvents.history).toContainEqual(
        expect.objectContaining({ definitionId: 'solar-storm', chainDepth: 0 }),
      );
      expect(direct.worldEvents.history).toContainEqual(
        expect.objectContaining({ definitionId: 'anomaly-aftershock', chainDepth: 1 }),
      );
      expect(direct.commandLog.length).toBeLessThanOrEqual(STATE_HISTORY_LIMITS.commands);
      expect(direct.eventLog.length).toBeLessThanOrEqual(STATE_HISTORY_LIMITS.executedEvents);
      expect(direct.worldEvents.history.length).toBeLessThanOrEqual(STATE_HISTORY_LIMITS.worldEvents);
    });

    it(`${factionId}: recovers exactly at six hours and permits ordinary reuse`, () => {
      const fixture = createFixture(factionId);
      const recovered = advance(fixture.state, PVE_TARGET_RECOVERY_SECONDS);
      const object = recovered.spaceObjects.find((candidate) => candidate.id === fixture.objectId);
      expect(object?.remainingYield).toBe(object?.initialYield);
      const command = {
        type: 'START_SPACE_OBJECT_MISSION' as const,
        empireId: 'player',
        fleetId: `fleet-${factionId}-recovery-reuse`,
        objectId: fixture.objectId,
      };
      expect(executeCommand(recovered, command).ok).toBe(true);
    });

    it(`${factionId}: applies pirate-hunt reward only to its active target`, () => {
      const fixture = createFixture(factionId);
      expect(PIRATE_HUNT_REWARD_PERMILLE).toBe(1_500);
      expect(
        calculatePveRewardMultiplier(
          fixture.state,
          'player',
          'pirate-raid',
          fixture.survivingPirateId,
          0,
        ),
      ).toBe(1_500);
      expect(
        calculatePveRewardMultiplier(
          fixture.state,
          'player',
          'pirate-raid',
          fixture.otherPirateId,
          0,
        ),
      ).toBe(1_000);
    });
  }
});
