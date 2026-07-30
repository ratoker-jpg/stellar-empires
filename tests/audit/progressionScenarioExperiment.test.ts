import { describe, expect, it } from 'vitest';
import { planBotEconomy } from '../../src/simulation/bots/economyPlanner';
import { getBotProgressionPhase } from '../../src/simulation/bots/progressionPhase';
import { planBotResearchAndProduction } from '../../src/simulation/bots/researchProductionPlanner';
import { runProgressionScenario } from '../../src/simulation/progression/scenarioRunner';

const runtimeEnvironment = (
  globalThis as typeof globalThis & {
    readonly process?: { readonly env?: Readonly<Record<string, string | undefined>> };
  }
).process?.env;
const scenarioIt = runtimeEnvironment?.RUN_PROGRESSION_SCENARIO === '1' ? it : it.skip;

describe('compressed progression scenario experiment', () => {
  scenarioIt('drives the accepted baseline seed through ordinary player and bot commands', () => {
    const result = runProgressionScenario({
      seed: 'stellar-empires-m1',
      playerFaction: 'aegis',
      worldSpeed: 2,
    });
    const diagnostics = Object.fromEntries(
      result.state.empires.map((empireId) => {
        const planet = result.state.planets.find(
          (candidate) => candidate.ownerEmpireId === empireId,
        );
        const research = result.state.research.find(
          (candidate) => candidate.empireId === empireId,
        );
        return [
          empireId,
          {
            phase: getBotProgressionPhase(result.state, empireId),
            economyPlan: planBotEconomy(result.state, empireId),
            researchProductionPlan: planBotResearchAndProduction(result.state, empireId),
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
    console.info(
      `COMPRESSED_PROGRESSION_SCENARIO=${JSON.stringify({
        complete: result.complete,
        elapsedRealSeconds: result.elapsedRealSeconds,
        phases: result.phaseReachedAtRealSeconds,
        acceptedPlayerCommands: result.acceptedPlayerCommands,
        rejectedPlayerCommands: result.rejectedPlayerCommands,
        diagnostics,
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
});
