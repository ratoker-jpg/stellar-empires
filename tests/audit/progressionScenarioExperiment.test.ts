import { describe, expect, it } from 'vitest';
import { runProgressionScenario } from '../../src/simulation/progression/scenarioRunner';

const scenarioIt = process.env.RUN_PROGRESSION_SCENARIO === '1' ? it : it.skip;

describe('compressed progression scenario experiment', () => {
  scenarioIt('drives the accepted baseline seed through ordinary player and bot commands', () => {
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
