import { describe, expect, it } from 'vitest';
import type { BattleReport, PlanetDestructionReport } from '../../src/simulation/combat/types';
import {
  createEmptyCatchUpSummary,
  mergeCatchUpSummaries,
} from '../../src/simulation/campaign/catchUpSummary';
import { advanceCampaignTime } from '../../src/simulation/campaign/time';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { PIRATE_EMPIRE_ID } from '../../src/simulation/pve/neutralForces';
import { PVE_TARGET_RECOVERY_SECONDS } from '../../src/simulation/pve/targetRecovery';
import type {
  CampaignCatchUpSummary,
} from '../../src/simulation/campaign/catchUpSummary';
import type { GameState, ScheduledGameEvent } from '../../src/simulation/types';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

const TOTAL_SECONDS = 172_800;
const CHUNK_SECONDS = 21_600;
const SAVE_SPLIT_SECONDS = 86_400;
const SAVE_TIME = '2026-08-01T09:00:00.000Z';

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

function createFixture(): {
  readonly state: GameState;
  readonly objectId: string;
  readonly survivingPirateId: string;
  readonly destroyedPirateId: string;
} {
  const initial = createInitialGameState('pve-target-recovery-partitions');
  const object = initial.spaceObjects[0];
  const pirates = initial.planets
    .filter((planet) => planet.ownerEmpireId === PIRATE_EMPIRE_ID)
    .sort((left, right) => left.id.localeCompare(right.id));
  const surviving = pirates[0];
  const destroyed = pirates[1];
  if (object === undefined || surviving === undefined || destroyed === undefined) {
    throw new Error('Missing recovery fixture targets.');
  }
  const survivingReport = reportFor(initial, surviving.id, 'battle-surviving-pirate', false);
  const destroyedReport = reportFor(initial, destroyed.id, 'battle-destroyed-pirate', true);
  const sequence = initial.nextEventSequence;
  return {
    objectId: object.id,
    survivingPirateId: surviving.id,
    destroyedPirateId: destroyed.id,
    state: {
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
      planets: initial.planets
        .filter((planet) => planet.id !== destroyed.id)
        .map((planet) =>
          planet.id === surviving.id
            ? {
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
              }
            : planet),
      pendingEvents: [
        ...initial.pendingEvents,
        scheduledBattle(survivingReport, sequence),
        scheduledBattle(destroyedReport, sequence + 1),
      ].sort((left, right) => left.executeAt - right.executeAt || left.sequence - right.sequence),
      nextEventSequence: sequence + 2,
    },
  };
}

function runChunked(initial: GameState): {
  readonly state: GameState;
  readonly summary: CampaignCatchUpSummary;
} {
  let state = initial;
  let summary = createEmptyCatchUpSummary();
  for (let elapsed = 0; elapsed < TOTAL_SECONDS; elapsed += CHUNK_SECONDS) {
    const result = advanceCampaignTime(state, CHUNK_SECONDS, {
      botProfiles: [],
      operationBudget: 512,
    });
    expect(result.complete).toBe(true);
    state = result.state;
    summary = mergeCatchUpSummaries(summary, result.summaryDelta);
  }
  return { state, summary };
}

function runSaveLoaded(initial: GameState): {
  readonly state: GameState;
  readonly summary: CampaignCatchUpSummary;
} {
  const first = advanceCampaignTime(initial, SAVE_SPLIT_SECONDS, {
    botProfiles: [],
    operationBudget: 512,
  });
  expect(first.complete).toBe(true);
  const parsed = parseSaveJson(serializeSave(
    createSaveEnvelope('pve-target-recovery', first.state, SAVE_TIME),
  ));
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) throw new Error(parsed.message);
  const second = advanceCampaignTime(parsed.value.state, TOTAL_SECONDS - SAVE_SPLIT_SECONDS, {
    botProfiles: [],
    operationBudget: 512,
  });
  expect(second.complete).toBe(true);
  return {
    state: second.state,
    summary: mergeCatchUpSummaries(first.summaryDelta, second.summaryDelta),
  };
}

describe('PvE target recovery audit gate', () => {
  it('is identical across direct, six-hour chunks and save/load over 48 campaign hours', () => {
    const fixture = createFixture();
    const direct = advanceCampaignTime(fixture.state, TOTAL_SECONDS, {
      botProfiles: [],
      operationBudget: 512,
    });
    expect(direct.complete).toBe(true);
    const chunked = runChunked(fixture.state);
    const saveLoaded = runSaveLoaded(fixture.state);

    expect(chunked.state).toEqual(direct.state);
    expect(saveLoaded.state).toEqual(direct.state);
    expect(chunked.summary).toEqual(direct.summaryDelta);
    expect(saveLoaded.summary).toEqual(direct.summaryDelta);

    expect(direct.state.spaceObjects.find((object) => object.id === fixture.objectId)).toMatchObject({
      remainingYield: fixture.state.spaceObjects.find((object) => object.id === fixture.objectId)?.initialYield,
      controllerEmpireId: null,
      controlExpiresAt: null,
      cooldownUntil: 0,
    });
    expect(direct.state.planets.find((planet) => planet.id === fixture.survivingPirateId)).toBeDefined();
    expect(direct.state.planets.find((planet) => planet.id === fixture.destroyedPirateId)).toBeDefined();
    expect(
      new Set(direct.state.planets.map((planet) => planet.galaxyPlanetId)).size,
    ).toBe(direct.state.planets.length);
  });
});
