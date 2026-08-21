import { describe, expect, it } from 'vitest';
import { getBotPhaseProductionTargets } from '../../src/simulation/bots/progressionPriorities';
import { createCampaignSettings } from '../../src/simulation/campaign/settings';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import { runOrganicTerminalScenario } from '../../src/simulation/progression/scenarioRunner';

const runtimeEnvironment = (
  globalThis as typeof globalThis & {
    readonly process?: { readonly env?: Readonly<Record<string, string | undefined>> };
  }
).process?.env;
const scenarioIt = runtimeEnvironment?.RUN_ORGANIC_TERMINAL_SCENARIO === '1' ? it : it.skip;
const ORGANIC_INPUT = {
  seed: 'stellar-empires-m1',
  playerFaction: 'aegis',
  worldSpeed: 2,
  decisionStepGameSeconds: 3_600,
} as const;

// The accepted seed reaches the winning Gate's stabilization boundary just past day 14.
// Fifteen real campaign days stays bounded while covering the organic terminal event.
const TERMINAL_HORIZON_REAL_SECONDS = 15 * 24 * 60 * 60;

describe('POST-1.0-PR1 organic late-game closure', () => {
  it('requires compressed late-game production to request the canonical Planet Destroyer', () => {
    const state = createInitialGameState('post-1.0-pr1-production-regression', {
      campaignSettings: createCampaignSettings({
        scenarioPreset: 'campaign',
        worldSpeed: 2,
        progressionProfile: 'compressed-v1',
        createdAtReal: '2026-08-21T00:00:00.000Z',
      }),
    });
    const planetDestroyerId = getFactionMechanicalRoles('aegis').ships.dreadnought;

    expect(
      getBotPhaseProductionTargets(state, 'aegis-bot', 'heavy-fleet', false),
    ).toContainEqual({
      unitId: planetDestroyerId,
      quantity: 1,
      desiredTotal: 1,
    });
  });

  scenarioIt('reaches terminal state organically with physical Planet Destroyers and positive Solar War', () => {
    const result = runOrganicTerminalScenario({
      ...ORGANIC_INPUT,
      maximumRealSeconds: TERMINAL_HORIZON_REAL_SECONDS,
    });
    const summary = {
      complete: result.complete,
      elapsedRealSeconds: result.elapsedRealSeconds,
      campaignResult: result.state.campaignResult,
      empireEvidence: result.empireEvidence,
      finalProjects: result.state.endgameFinalObjects?.activeProjects ?? [],
    };
    console.info(`ORGANIC_TERMINAL_EVIDENCE=${JSON.stringify(summary)}`);

    expect(result.complete).toBe(true);
    const campaignResult = result.state.campaignResult;
    expect(campaignResult?.status).toBe('terminal');
    expect(
      Object.values(result.empireEvidence).filter(
        (evidence) => evidence.firstPhysicalPlanetDestroyerAtRealSeconds === null,
      ),
    ).toEqual([]);

    if (campaignResult?.status !== 'terminal') {
      throw new Error('Organic terminal scenario did not produce a terminal campaign result.');
    }
    const winnerEvidence = result.empireEvidence[campaignResult.ownerEmpireId];
    expect(winnerEvidence?.maximumSolarWarScore ?? 0).toBeGreaterThan(0);
    expect(winnerEvidence?.positiveSolarWarResults ?? 0).toBeGreaterThan(0);

    const winningProject = result.state.endgameFinalObjects?.activeProjects.find(
      (project) => project.ownerEmpireId === campaignResult.ownerEmpireId,
    );
    expect(winningProject).toMatchObject({
      phase: 'vulnerable',
      qualification: { score: expect.any(Number) },
      stabilizesAt: campaignResult.terminalAt,
    });
    expect(winningProject?.qualification.score ?? 0).toBeGreaterThan(0);
    expect(winningProject?.contributedResources).toEqual(winningProject?.requiredResources);
  }, 300_000);
});
