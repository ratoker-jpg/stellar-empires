import { describe, expect, it } from 'vitest';
import { CampaignClockController } from '../../src/runtime/CampaignClockController';
import {
  advanceCampaignRuntimeCheckpoint,
  runCampaignCatchUp,
} from '../../src/runtime/campaignTimeRuntime';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import type { FinalObjectProject } from '../../src/simulation/endgame/types';
import { getCompleteBuildingIds } from '../../src/simulation/planet/completeBuildingCatalog';
import type { GameState } from '../../src/simulation/types';
import { createCampaignRuntimeMetadata } from '../../src/storage/runtimeMetadata';
import type { CampaignRuntimeMetadata } from '../../src/storage/types';

const START = '2026-08-18T00:00:00.000Z';
const START_MS = Date.parse(START);
const FULL = { metal: 100, crystal: 80, gas: 60 } as const;

function terminalPendingState(seed = 'terminal-runtime'): GameState {
  const state = createInitialGameState(seed);
  const host = state.planets.find((planet) => planet.ownerEmpireId === 'player');
  if (host === undefined || state.endgameFinalObjects === undefined) {
    throw new Error('Terminal runtime host missing.');
  }
  const ids = getCompleteBuildingIds(host.factionId);
  const stabilizesAt = 10;
  const project: FinalObjectProject = {
    id: 'runtime-terminal-project',
    ownerEmpireId: 'player',
    ownerPlanetId: host.id,
    factionId: host.factionId,
    obeliskBuildingId: ids.galacticObelisk,
    gateBuildingId: ids.supremeGalacticGates,
    participationKind: 'solo',
    participationId: 'player',
    allianceId: null,
    eligibleEmpireIds: ['player'],
    qualification: { cycleId: 'cycle-runtime', cycleIndex: 1, resolvedAt: 0, score: 1 },
    phase: 'vulnerable',
    requiredResources: FULL,
    contributedResources: FULL,
    contributionByEmpire: [{ empireId: 'player', resources: FULL }],
    startedAt: 0,
    fundedAt: 0,
    gateCompletesAt: 0,
    vulnerabilityStartedAt: 0,
    stabilizesAt,
  };
  return {
    ...state,
    planets: state.planets.map((planet) =>
      planet.id === host.id
        ? {
            ...planet,
            buildings: [
              ...planet.buildings.filter((building) => building.buildingId !== ids.supremeGalacticGates),
              { buildingId: ids.supremeGalacticGates, level: 1 },
            ],
          }
        : planet,
    ),
    endgameFinalObjects: {
      ...state.endgameFinalObjects,
      activeProjects: [project],
      nextProjectSequence: 2,
    },
    botAutomation: {
      ...state.botAutomation,
      nextDecisionAtByEmpire: Object.fromEntries(
        Object.keys(state.botAutomation.nextDecisionAtByEmpire).map((empireId) => [empireId, 1_000]),
      ),
    },
    pendingEvents: [{
      id: `event-${state.nextEventSequence}`,
      executeAt: stabilizesAt,
      sequence: state.nextEventSequence,
      payload: { type: 'FINAL_GATE_STABILIZE', projectId: project.id },
    }],
    nextEventSequence: state.nextEventSequence + 1,
  };
}

function targetAfter(seconds: number): string {
  return new Date(START_MS + seconds * 1_000).toISOString();
}

describe('terminal campaign runtime', () => {
  it('advances the real cursor only to terminal first, then consumes remaining active backlog at zero game cost', () => {
    const initial = terminalPendingState('terminal-active-runtime');
    const target = targetAfter(20);
    const first = advanceCampaignRuntimeCheckpoint(
      initial,
      createCampaignRuntimeMetadata(START),
      target,
      'active',
      100,
    );

    expect(first.complete).toBe(false);
    expect(first.state.campaignResult?.status).toBe('terminal');
    expect(first.state.clock.elapsedSeconds).toBe(10);
    expect(first.runtimeMetadata.lastActiveAtReal).toBe(targetAfter(10));
    expect(first.runtimeMetadata.pendingCatchUp).toMatchObject({
      targetAtReal: target,
      remainingRealDurationMilliseconds: 10_000,
      gameTimeFractionNumerator: 0,
    });

    const second = advanceCampaignRuntimeCheckpoint(
      first.state,
      first.runtimeMetadata,
      target,
      'active',
      100,
    );
    expect(second.complete).toBe(true);
    expect(second.state).toBe(first.state);
    expect(second.state.clock.elapsedSeconds).toBe(10);
    expect(second.advance.processedGameSeconds).toBe(0);
    expect(second.runtimeMetadata.lastActiveAtReal).toBe(target);
    expect(second.runtimeMetadata.pendingCatchUp).toBeUndefined();
    expect(second.runtimeMetadata.pendingReturnSummary?.result.status).toBe('victory');
  });

  it('offline catch-up reaches the same terminal fixed point and consumes the entire wall-clock target', async () => {
    const initial = terminalPendingState('terminal-offline-runtime');
    const target = targetAfter(20);
    const checkpoints: Array<{ state: GameState; metadata: CampaignRuntimeMetadata }> = [];
    const result = await runCampaignCatchUp({
      state: initial,
      runtimeMetadata: createCampaignRuntimeMetadata(START),
      targetAtReal: target,
      operationBudget: 100,
      checkpoint: async (state, metadata) => {
        checkpoints.push({ state, metadata });
      },
    });

    expect(result.state.campaignResult?.status).toBe('terminal');
    expect(result.state.clock.elapsedSeconds).toBe(10);
    expect(result.runtimeMetadata.lastActiveAtReal).toBe(target);
    expect(result.runtimeMetadata.pendingCatchUp).toBeUndefined();
    expect(result.runtimeMetadata.pendingReturnSummary?.result.status).toBe('victory');
    expect(checkpoints.some((entry) => entry.metadata.lastActiveAtReal === targetAfter(10))).toBe(true);
    expect(checkpoints.at(-1)?.metadata.lastActiveAtReal).toBe(target);
  });

  it('preserves terminal catch-up partition equality across operation budgets', async () => {
    const initial = terminalPendingState('terminal-runtime-partition');
    const target = targetAfter(20);
    const direct = await runCampaignCatchUp({
      state: initial,
      runtimeMetadata: createCampaignRuntimeMetadata(START),
      targetAtReal: target,
      operationBudget: 100,
      checkpoint: async () => undefined,
    });
    const chunked = await runCampaignCatchUp({
      state: initial,
      runtimeMetadata: createCampaignRuntimeMetadata(START),
      targetAtReal: target,
      operationBudget: 1,
      checkpoint: async () => undefined,
    });

    expect(chunked.state).toEqual(direct.state);
    expect(chunked.runtimeMetadata).toEqual(direct.runtimeMetadata);
  });

  it('active controller requests an immediate save on terminal transition and then drains the cursor', () => {
    let state = terminalPendingState('terminal-controller-runtime');
    let metadata = createCampaignRuntimeMetadata(START);
    let nowMs = START_MS + 20_000;
    const saves: boolean[] = [];
    const controller = new CampaignClockController({
      getState: () => state,
      getRuntimeMetadata: () => metadata,
      realTimeSource: { nowMs: () => nowMs },
      tickIntervalMilliseconds: 60_000,
      saveIntervalMilliseconds: 60_000,
      operationBudget: 100,
      applyCheckpoint: (checkpoint, saveRequested) => {
        state = checkpoint.state;
        metadata = checkpoint.runtimeMetadata;
        saves.push(saveRequested);
      },
    });

    controller.tick();
    expect(state.campaignResult?.status).toBe('terminal');
    expect(metadata.lastActiveAtReal).toBe(targetAfter(10));
    expect(saves).toEqual([true]);

    nowMs = START_MS + 20_000;
    controller.tick();
    controller.dispose();
    expect(state.clock.elapsedSeconds).toBe(10);
    expect(metadata.lastActiveAtReal).toBe(targetAfter(20));
    expect(metadata.pendingCatchUp).toBeUndefined();
    expect(saves).toEqual([true, false]);
  });
});
