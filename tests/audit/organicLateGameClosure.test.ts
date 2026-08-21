import { describe, expect, it } from 'vitest';
import { planBotEndgameFinalObjects } from '../../src/simulation/bots/endgameFinalObjectPlanner';
import { DEFAULT_BOT_PROFILES } from '../../src/simulation/bots/profiles';
import { getBotPhaseProductionTargets } from '../../src/simulation/bots/progressionPriorities';
import { createCampaignSettings } from '../../src/simulation/campaign/settings';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import { getBuildingDefinition } from '../../src/simulation/planet/buildingCatalog';
import { getCompleteBuildingIds } from '../../src/simulation/planet/completeBuildingCatalog';
import {
  calculateBuildingCost,
  findMissingRequirements,
  getBuildingLevel,
} from '../../src/simulation/planet/buildingProgression';
import {
  continueOrganicTerminalScenario,
  runOrganicTerminalScenario,
} from '../../src/simulation/progression/scenarioRunner';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameCommand, GameState } from '../../src/simulation/types';

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
const DIAGNOSTIC_STEP_REAL_SECONDS = 30 * 60;
const DIAGNOSTIC_MAX_REAL_SECONDS = 3 * 24 * 60 * 60;

function endgameBlockerEvidence(state: GameState) {
  return DEFAULT_BOT_PROFILES.flatMap((profile) => {
    const plan = planBotEndgameFinalObjects(state, profile);
    if (plan.reasonCode !== 'final-object-no-legal-action') return [];

    const planets = state.planets
      .filter((planet) => planet.ownerEmpireId === profile.empireId)
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((planet) => {
        const ids = getCompleteBuildingIds(planet.factionId);
        const obelisk = getBuildingDefinition(ids.galacticObelisk);
        if (obelisk === undefined) {
          throw new Error(`Missing Galactic Obelisk definition for ${planet.factionId}.`);
        }
        const command: Extract<GameCommand, { readonly type: 'QUEUE_BUILDING' }> = {
          type: 'QUEUE_BUILDING',
          empireId: profile.empireId,
          planetId: planet.id,
          buildingId: ids.galacticObelisk,
        };
        const queueAttempt = executeCommand(state, command);
        return {
          planetId: planet.id,
          resources: {
            metal: {
              amount: planet.economy.resources.metal.amount,
              capacity: planet.economy.resources.metal.capacity,
            },
            crystal: {
              amount: planet.economy.resources.crystal.amount,
              capacity: planet.economy.resources.crystal.capacity,
            },
            gas: {
              amount: planet.economy.resources.gas.amount,
              capacity: planet.economy.resources.gas.capacity,
            },
          },
          storageLevels: {
            metal: getBuildingLevel(planet.buildings, ids.metalStorage),
            crystal: getBuildingLevel(planet.buildings, ids.crystalStorage),
            gas: getBuildingLevel(planet.buildings, ids.gasStorage),
          },
          resolvedObeliskCost: calculateBuildingCost(
            obelisk,
            getBuildingLevel(planet.buildings, ids.galacticObelisk) + 1,
            state.campaignSettings.progressionProfile,
          ),
          buildQueue: planet.buildQueue.map((item) => ({
            id: item.id,
            buildingId: item.buildingId,
            targetLevel: item.targetLevel,
            startedAt: item.startedAt,
            completesAt: item.completesAt,
          })),
          missingRequirements: findMissingRequirements(
            planet,
            obelisk.requirements,
            state.campaignSettings.progressionProfile,
          ),
          queueAttempt: queueAttempt.ok
            ? { ok: true, code: null }
            : { ok: false, code: queueAttempt.code },
        };
      });

    return [{
      empireId: profile.empireId,
      plannerReasonCode: plan.reasonCode,
      elapsedRealSeconds: state.clock.elapsedSeconds / state.campaignSettings.worldSpeed,
      planets,
    }];
  });
}

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

  scenarioIt('captures the first organic final-object-no-legal-action evidence without state injection', () => {
    let horizonRealSeconds = DIAGNOSTIC_STEP_REAL_SECONDS;
    let result = runOrganicTerminalScenario({
      ...ORGANIC_INPUT,
      maximumRealSeconds: horizonRealSeconds,
    });
    const evidenceByEmpire = new Map<string, ReturnType<typeof endgameBlockerEvidence>[number]>();

    while (horizonRealSeconds <= DIAGNOSTIC_MAX_REAL_SECONDS) {
      for (const evidence of endgameBlockerEvidence(result.state)) {
        if (!evidenceByEmpire.has(evidence.empireId)) {
          evidenceByEmpire.set(evidence.empireId, evidence);
        }
      }
      if (evidenceByEmpire.size === DEFAULT_BOT_PROFILES.length || result.complete) break;
      horizonRealSeconds += DIAGNOSTIC_STEP_REAL_SECONDS;
      result = continueOrganicTerminalScenario(result.state, {
        ...ORGANIC_INPUT,
        maximumRealSeconds: horizonRealSeconds,
      });
    }

    const evidence = [...evidenceByEmpire.values()];
    console.info(`ORGANIC_ENDGAME_BLOCKER_EVIDENCE=${JSON.stringify(evidence)}`);
    expect(evidence.length).toBeGreaterThan(0);
  }, 180_000);

  scenarioIt('reaches terminal state organically with physical Planet Destroyers and positive Solar War', () => {
    const result = runOrganicTerminalScenario({
      ...ORGANIC_INPUT,
      maximumRealSeconds: 14 * 24 * 60 * 60,
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
