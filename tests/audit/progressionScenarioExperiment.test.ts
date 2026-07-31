import { describe, expect, it } from 'vitest';
import { planBotEconomy } from '../../src/simulation/bots/economyPlanner';
import { getBotProgressionPhase } from '../../src/simulation/bots/progressionPhase';
import { planBotResearchAndProduction } from '../../src/simulation/bots/researchProductionPlanner';
import {
  ACCEPTED_PROGRESSION_SEEDS,
  runProgressionScenario,
} from '../../src/simulation/progression/scenarioRunner';
import type { FactionId } from '../../src/simulation/planet/types';
import type { GameState } from '../../src/simulation/types';

const runtimeEnvironment = (
  globalThis as typeof globalThis & {
    readonly process?: { readonly env?: Readonly<Record<string, string | undefined>> };
  }
).process?.env;
const scenarioIt = runtimeEnvironment?.RUN_PROGRESSION_SCENARIO === '1' ? it : it.skip;
const PLAYER_FACTIONS: readonly FactionId[] = ['aegis', 'synod', 'veyra'];

function diagnosticsForState(state: GameState): Readonly<Record<string, unknown>> {
  return Object.fromEntries(
    state.empires.map((empireId) => {
      const planet = state.planets.find(
        (candidate) => candidate.ownerEmpireId === empireId,
      );
      const research = state.research.find(
        (candidate) => candidate.empireId === empireId,
      );
      return [
        empireId,
        {
          phase: getBotProgressionPhase(state, empireId),
          economyPlan: planBotEconomy(state, empireId),
          researchProductionPlan: planBotResearchAndProduction(state, empireId),
          resources: planet?.economy.resources,
          specialization: planet?.specializationId,
          buildings: planet?.buildings,
          buildQueue: planet?.buildQueue,
          productionQueues: planet?.productionQueues,
          ships: planet?.inventory.ships,
          researchLevels: research?.levels,
          researchQueue: research?.queue,
        },
      ];
    }),
  );
}

describe('compressed progression scenario experiment', () => {
  scenarioIt('drives the accepted baseline seed through ordinary player and bot commands', () => {
    const reconnaissanceBoundary = runProgressionScenario({
      seed: 'stellar-empires-m1',
      playerFaction: 'aegis',
      worldSpeed: 2,
      maximumRealSeconds: 45 * 60,
    });
    console.info(
      `COMPRESSED_RECONNAISSANCE_BOUNDARY=${JSON.stringify({
        phases: reconnaissanceBoundary.phaseReachedAtRealSeconds,
        diagnostics: diagnosticsForState(reconnaissanceBoundary.state),
      })}`,
    );

    const colonizationBoundary = runProgressionScenario({
      seed: 'stellar-empires-m1',
      playerFaction: 'aegis',
      worldSpeed: 2,
      maximumRealSeconds: 3 * 60 * 60,
    });
    console.info(
      `COMPRESSED_COLONIZATION_BOUNDARY=${JSON.stringify({
        phases: colonizationBoundary.phaseReachedAtRealSeconds,
        diagnostics: diagnosticsForState(colonizationBoundary.state),
      })}`,
    );

    const result = runProgressionScenario({
      seed: 'stellar-empires-m1',
      playerFaction: 'aegis',
      worldSpeed: 2,
    });
    console.info(
      `COMPRESSED_PROGRESSION_SCENARIO=${JSON.stringify({
        complete: result.complete,
        elapsedRealSeconds: result.elapsedRealSeconds,
        phases: result.phaseReachedAtRealSeconds,
        acceptedPlayerCommands: result.acceptedPlayerCommands,
        rejectedPlayerCommands: result.rejectedPlayerCommands,
        diagnostics: diagnosticsForState(result.state),
      })}`,
    );

    expect(result.complete).toBe(true);
    expect(result.elapsedRealSeconds).toBeLessThanOrEqual(16 * 60 * 60);
    for (const empireId of result.state.empires) {
      const phases = result.phaseReachedAtRealSeconds[empireId];
      expect(phases?.reconnaissance).toBeLessThanOrEqual(45 * 60);
      expect(phases?.colonization).toBeLessThanOrEqual(180 * 60);
      expect(phases?.['heavy-fleet']).toBeLessThanOrEqual(480 * 60);
      expect(phases?.['endgame-preparation']).toBeLessThanOrEqual(720 * 60);
    }
  }, 120_000);

  scenarioIt('measures every accepted seed and player faction through ordinary commands', () => {
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
    console.info(`COMPRESSED_PROGRESSION_MATRIX=${JSON.stringify(matrix)}`);

    expect(matrix.filter((entry) => !entry.complete)).toEqual([]);
    expect(Math.max(...matrix.map((entry) => entry.elapsedRealSeconds)))
      .toBeLessThanOrEqual(16 * 60 * 60);
  }, 300_000);
});
