import { describe, expect, it } from 'vitest';
import { createStateChecksum } from '../../src/simulation/checksum';
import {
  continueOrganicTerminalScenario,
  runOrganicTerminalScenario,
} from '../../src/simulation/progression/scenarioRunner';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

const runtimeEnvironment = (
  globalThis as typeof globalThis & {
    readonly process?: { readonly env?: Readonly<Record<string, string | undefined>> };
  }
).process?.env;
const scenarioIt = runtimeEnvironment?.RUN_ORGANIC_TERMINAL_DETERMINISM === '1' ? it : it.skip;

const INPUT = {
  seed: 'stellar-empires-m1',
  playerFaction: 'aegis',
  worldSpeed: 2,
  decisionStepGameSeconds: 3_600,
} as const;
const CHECKPOINT_REAL_SECONDS = 14 * 24 * 60 * 60;
const PARTITION_REAL_SECONDS = CHECKPOINT_REAL_SECONDS + 2 * 60 * 60;
const TERMINAL_HORIZON_REAL_SECONDS = 15 * 24 * 60 * 60;
const SAVED_AT = '2026-08-21T12:00:00.000Z';

function expectTerminal(result: ReturnType<typeof continueOrganicTerminalScenario>) {
  expect(result.complete).toBe(true);
  expect(result.state.campaignResult?.status).toBe('terminal');
  if (result.state.campaignResult?.status !== 'terminal') {
    throw new Error('Expected organic continuation to reach terminal state.');
  }
  return result.state.campaignResult;
}

describe('POST-1.0-PR1 organic terminal determinism', () => {
  scenarioIt('preserves authoritative terminal state across save/load and partitioned continuation', () => {
    const checkpoint = runOrganicTerminalScenario({
      ...INPUT,
      maximumRealSeconds: CHECKPOINT_REAL_SECONDS,
    });
    expect(checkpoint.complete).toBe(false);
    expect(checkpoint.state.schemaVersion).toBe(19);

    const direct = continueOrganicTerminalScenario(checkpoint.state, {
      ...INPUT,
      maximumRealSeconds: TERMINAL_HORIZON_REAL_SECONDS,
    });
    const directResult = expectTerminal(direct);

    const save = createSaveEnvelope('post-1.0-pr1-organic-checkpoint', checkpoint.state, SAVED_AT);
    expect(save.formatVersion).toBe(6);
    const parsed = parseSaveJson(serializeSave(save));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error(parsed.message);
    expect(parsed.value.state.schemaVersion).toBe(19);
    expect(createStateChecksum(parsed.value.state)).toBe(createStateChecksum(checkpoint.state));

    const saveLoaded = continueOrganicTerminalScenario(parsed.value.state, {
      ...INPUT,
      maximumRealSeconds: TERMINAL_HORIZON_REAL_SECONDS,
    });
    const saveLoadedResult = expectTerminal(saveLoaded);

    const firstPartition = continueOrganicTerminalScenario(checkpoint.state, {
      ...INPUT,
      maximumRealSeconds: PARTITION_REAL_SECONDS,
    });
    expect(firstPartition.complete).toBe(false);
    const partitioned = continueOrganicTerminalScenario(firstPartition.state, {
      ...INPUT,
      maximumRealSeconds: TERMINAL_HORIZON_REAL_SECONDS,
    });
    const partitionedResult = expectTerminal(partitioned);

    expect(saveLoadedResult).toEqual(directResult);
    expect(partitionedResult).toEqual(directResult);
    expect(saveLoaded.state.endgameFinalObjects).toEqual(direct.state.endgameFinalObjects);
    expect(partitioned.state.endgameFinalObjects).toEqual(direct.state.endgameFinalObjects);
    expect(createStateChecksum(saveLoaded.state)).toBe(createStateChecksum(direct.state));
    expect(createStateChecksum(partitioned.state)).toBe(createStateChecksum(direct.state));

    console.info(`ORGANIC_TERMINAL_DETERMINISM=${JSON.stringify({
      checkpointRealSeconds: CHECKPOINT_REAL_SECONDS,
      partitionRealSeconds: PARTITION_REAL_SECONDS,
      terminalElapsedRealSeconds: direct.elapsedRealSeconds,
      terminalResult: directResult,
      stateChecksum: createStateChecksum(direct.state),
      schemaVersion: direct.state.schemaVersion,
      saveFormatVersion: save.formatVersion,
    })}`);
  }, 600_000);
});
