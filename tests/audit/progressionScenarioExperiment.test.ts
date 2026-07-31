import { describe, expect, it } from 'vitest';
import {
  ACCEPTED_PROGRESSION_SEEDS,
  runProgressionScenario,
} from '../../src/simulation/progression/scenarioRunner';
import type { FactionId } from '../../src/simulation/planet/types';

const runtimeEnvironment = (
  globalThis as typeof globalThis & {
    readonly process?: { readonly env?: Readonly<Record<string, string | undefined>> };
  }
).process?.env;
const scenarioIt = runtimeEnvironment?.RUN_PROGRESSION_SCENARIO === '1' ? it : it.skip;
const PLAYER_FACTIONS: readonly FactionId[] = ['aegis', 'synod', 'veyra'];
const PHASE_LIMITS_SECONDS = {
  reconnaissance: 45 * 60,
  colonization: 480 * 60,
  'heavy-fleet': 600 * 60,
  'endgame-preparation': 960 * 60,
} as const;

describe('compressed progression scenario experiment', () => {
  scenarioIt('gates every accepted seed and player faction through ordinary commands', () => {
    const matrix = ACCEPTED_PROGRESSION_SEEDS.flatMap((seed) =>
      PLAYER_FACTIONS.map((playerFaction) => {
        const result = runProgressionScenario({
          seed,
          playerFaction,
          worldSpeed: 2,
        });
        const entry = {
          seed,
          playerFaction,
          complete: result.complete,
          elapsedRealSeconds: result.elapsedRealSeconds,
          phases: result.phaseReachedAtRealSeconds,
          acceptedPlayerCommands: result.acceptedPlayerCommands,
          rejectedPlayerCommands: result.rejectedPlayerCommands,
        };
        console.info(`COMPRESSED_PROGRESSION_MATRIX_CASE=${JSON.stringify(entry)}`);
        return entry;
      }),
    );

    const durations = matrix
      .map((entry) => entry.elapsedRealSeconds)
      .sort((left, right) => left - right);
    const medianRealSeconds = durations[Math.floor(durations.length / 2)] ?? 0;
    const maximumRealSeconds = durations[durations.length - 1] ?? 0;
    const phaseMaximums = Object.fromEntries(
      Object.keys(PHASE_LIMITS_SECONDS).map((phase) => [
        phase,
        Math.max(
          ...matrix.flatMap((entry) =>
            Object.values(entry.phases).map((phases) =>
              phases[phase as keyof typeof PHASE_LIMITS_SECONDS] ?? 0,
            ),
          ),
        ),
      ]),
    );
    const phaseViolations = matrix.flatMap((entry) =>
      Object.entries(entry.phases).flatMap(([empireId, phases]) =>
        Object.entries(PHASE_LIMITS_SECONDS)
          .filter(([phase, limit]) =>
            (phases[phase as keyof typeof PHASE_LIMITS_SECONDS] ?? Number.POSITIVE_INFINITY) > limit,
          )
          .map(([phase, limit]) => ({
            seed: entry.seed,
            playerFaction: entry.playerFaction,
            empireId,
            phase,
            reachedAtRealSeconds:
              phases[phase as keyof typeof PHASE_LIMITS_SECONDS] ?? null,
            limit,
          })),
      ),
    );

    console.info(
      `COMPRESSED_PROGRESSION_MATRIX_SUMMARY=${JSON.stringify({
        cases: matrix.length,
        completeCases: matrix.filter((entry) => entry.complete).length,
        medianRealSeconds,
        maximumRealSeconds,
        phaseMaximums,
        phaseViolations,
      })}`,
    );

    expect(matrix).toHaveLength(15);
    expect(matrix.filter((entry) => !entry.complete)).toEqual([]);
    expect(maximumRealSeconds).toBeLessThanOrEqual(16 * 60 * 60);
    expect(medianRealSeconds).toBeLessThanOrEqual(15 * 60 * 60);
    expect(phaseViolations).toEqual([]);
  }, 300_000);
});
