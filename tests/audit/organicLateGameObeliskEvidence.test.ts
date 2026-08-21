import { describe, expect, it } from 'vitest';
import { DEFAULT_BOT_PROFILES } from '../../src/simulation/bots/profiles';
import { getCompleteBuildingIds } from '../../src/simulation/planet/completeBuildingCatalog';
import { getBuildingLevel } from '../../src/simulation/planet/buildingProgression';
import {
  continueOrganicTerminalScenario,
  runOrganicTerminalScenario,
} from '../../src/simulation/progression/scenarioRunner';
import type { GameState } from '../../src/simulation/types';

const runtimeEnvironment = (
  globalThis as typeof globalThis & {
    readonly process?: { readonly env?: Readonly<Record<string, string | undefined>> };
  }
).process?.env;
const scenarioIt = runtimeEnvironment?.RUN_ORGANIC_OBELISK_EVIDENCE === '1' ? it : it.skip;

const INPUT = {
  seed: 'stellar-empires-m1',
  playerFaction: 'aegis',
  worldSpeed: 2,
  decisionStepGameSeconds: 3_600,
} as const;
const SAMPLE_STEP_REAL_SECONDS = 30 * 60;
const MAX_EVIDENCE_REAL_SECONDS = 6 * 24 * 60 * 60;

interface ObeliskQueueEvidence {
  readonly empireId: string;
  readonly planetId: string;
  readonly queuedAtRealSeconds: number;
  readonly completesAtRealSeconds: number;
  readonly storageLevels: {
    readonly metal: number;
    readonly crystal: number;
    readonly gas: number;
  };
  readonly capacities: {
    readonly metal: number;
    readonly crystal: number;
    readonly gas: number;
  };
  readonly amountsAfterSpend: {
    readonly metal: number;
    readonly crystal: number;
    readonly gas: number;
  };
  readonly resolvedCost: {
    readonly metal: number;
    readonly crystal: number;
    readonly gas: number;
  };
}

function recordObeliskQueues(
  state: GameState,
  evidenceByEmpire: Map<string, ObeliskQueueEvidence>,
): void {
  for (const profile of DEFAULT_BOT_PROFILES) {
    if (evidenceByEmpire.has(profile.empireId)) continue;
    const planets = state.planets
      .filter((planet) => planet.ownerEmpireId === profile.empireId)
      .sort((left, right) => left.id.localeCompare(right.id));
    for (const planet of planets) {
      const ids = getCompleteBuildingIds(planet.factionId);
      const queueItem = planet.buildQueue.find((item) => item.buildingId === ids.galacticObelisk);
      if (queueItem === undefined) continue;
      evidenceByEmpire.set(profile.empireId, {
        empireId: profile.empireId,
        planetId: planet.id,
        queuedAtRealSeconds: queueItem.startedAt / state.campaignSettings.worldSpeed,
        completesAtRealSeconds: queueItem.completesAt / state.campaignSettings.worldSpeed,
        storageLevels: {
          metal: getBuildingLevel(planet.buildings, ids.metalStorage),
          crystal: getBuildingLevel(planet.buildings, ids.crystalStorage),
          gas: getBuildingLevel(planet.buildings, ids.gasStorage),
        },
        capacities: {
          metal: planet.economy.resources.metal.capacity,
          crystal: planet.economy.resources.crystal.capacity,
          gas: planet.economy.resources.gas.capacity,
        },
        amountsAfterSpend: {
          metal: planet.economy.resources.metal.amount,
          crystal: planet.economy.resources.crystal.amount,
          gas: planet.economy.resources.gas.amount,
        },
        resolvedCost: queueItem.cost,
      });
      break;
    }
  }
}

describe('POST-1.0-PR1 organic Obelisk evidence', () => {
  scenarioIt('records real storage preparation and Obelisk queue/completion boundaries without state injection', () => {
    let horizonRealSeconds = SAMPLE_STEP_REAL_SECONDS;
    let result = runOrganicTerminalScenario({
      ...INPUT,
      maximumRealSeconds: horizonRealSeconds,
    });
    const evidenceByEmpire = new Map<string, ObeliskQueueEvidence>();
    recordObeliskQueues(result.state, evidenceByEmpire);

    while (horizonRealSeconds < MAX_EVIDENCE_REAL_SECONDS && evidenceByEmpire.size < 2) {
      horizonRealSeconds += SAMPLE_STEP_REAL_SECONDS;
      result = continueOrganicTerminalScenario(result.state, {
        ...INPUT,
        maximumRealSeconds: horizonRealSeconds,
      });
      recordObeliskQueues(result.state, evidenceByEmpire);
    }

    const evidence = [...evidenceByEmpire.values()]
      .sort((left, right) => left.empireId.localeCompare(right.empireId));
    console.info(`ORGANIC_OBELISK_EVIDENCE=${JSON.stringify(evidence)}`);

    const synod = evidenceByEmpire.get('synod-bot');
    const veyra = evidenceByEmpire.get('veyra-bot');
    expect(synod).toBeDefined();
    expect(veyra).toBeDefined();
    for (const candidate of [synod, veyra]) {
      if (candidate === undefined) continue;
      expect(candidate.storageLevels.metal).toBeGreaterThan(0);
      expect(candidate.storageLevels.crystal).toBeGreaterThan(0);
      expect(candidate.capacities.metal).toBeGreaterThanOrEqual(candidate.resolvedCost.metal);
      expect(candidate.capacities.crystal).toBeGreaterThanOrEqual(candidate.resolvedCost.crystal);
      expect(candidate.completesAtRealSeconds).toBeGreaterThan(candidate.queuedAtRealSeconds);
    }
  }, 180_000);
});
