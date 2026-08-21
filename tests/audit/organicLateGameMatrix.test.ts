import { describe, expect, it } from 'vitest';
import { runOrganicTerminalScenario } from '../../src/simulation/progression/scenarioRunner';
import type { FactionId } from '../../src/simulation/planet/types';

const runtimeEnvironment = (
  globalThis as typeof globalThis & {
    readonly process?: { readonly env?: Readonly<Record<string, string | undefined>> };
  }
).process?.env;
const scenarioIt = runtimeEnvironment?.RUN_ORGANIC_TERMINAL_MATRIX === '1' ? it : it.skip;

const CASES: readonly { readonly seed: string; readonly playerFaction: FactionId }[] = [
  { seed: 'progression-synod-01', playerFaction: 'synod' },
  { seed: 'progression-veyra-01', playerFaction: 'veyra' },
];
const TERMINAL_HORIZON_REAL_SECONDS = 16 * 24 * 60 * 60;

describe('POST-1.0-PR1 bounded organic terminal matrix', () => {
  scenarioIt.each(CASES)(
    '$seed / $playerFaction reaches a legal terminal result without state injection',
    ({ seed, playerFaction }) => {
      const result = runOrganicTerminalScenario({
        seed,
        playerFaction,
        worldSpeed: 2,
        maximumRealSeconds: TERMINAL_HORIZON_REAL_SECONDS,
        decisionStepGameSeconds: 3_600,
      });

      expect(result.complete).toBe(true);
      expect(result.state.campaignResult?.status).toBe('terminal');
      expect(
        Object.values(result.empireEvidence).every(
          (evidence) => evidence.firstPhysicalPlanetDestroyerAtRealSeconds !== null,
        ),
      ).toBe(true);
      if (result.state.campaignResult?.status !== 'terminal') {
        throw new Error(`Organic matrix case ${seed}/${playerFaction} did not reach terminal.`);
      }
      const winnerEvidence = result.empireEvidence[result.state.campaignResult.ownerEmpireId];
      expect(winnerEvidence?.positiveSolarWarResults ?? 0).toBeGreaterThan(0);

      console.info(`ORGANIC_TERMINAL_MATRIX_EVIDENCE=${JSON.stringify({
        seed,
        playerFaction,
        elapsedRealSeconds: result.elapsedRealSeconds,
        campaignResult: result.state.campaignResult,
        empireEvidence: result.empireEvidence,
      })}`);
    },
    480_000,
  );
});
