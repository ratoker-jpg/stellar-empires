import { describe, expect, it } from 'vitest';
import type { BotProfile } from '../../src/simulation/bots/profiles';
import {
  createEmptyCatchUpSummary,
  mergeCatchUpSummaries,
} from '../../src/simulation/campaign/catchUpSummary';
import { advanceCampaignTime } from '../../src/simulation/campaign/time';
import { updateGalaxyPlanetOwner } from '../../src/simulation/colonization/colonization';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { refreshPlanetEconomy } from '../../src/simulation/economy/planetEconomy';
import type { ResourceId } from '../../src/simulation/economy/types';
import { getResearchEffectsForEmpire } from '../../src/simulation/factions/factionResearchEffects';
import type { FactionId } from '../../src/simulation/planet/types';
import type { GameState } from '../../src/simulation/types';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

const DAY_SECONDS = 86_400;
const HALF_DAY_SECONDS = DAY_SECONDS / 2;
const CHUNK_SECONDS = 21_600;
const SAVE_TIME = '2026-07-31T18:00:00.000Z';

const CASES = [
  { factionId: 'aegis', empireId: 'bot-aegis' },
  { factionId: 'synod', empireId: 'bot-synod' },
  { factionId: 'veyra', empireId: 'bot-veyra' },
] as const satisfies readonly { factionId: FactionId; empireId: string }[];

function setAmountAtFill(
  state: GameState,
  planetId: string,
  resourceId: ResourceId,
  fillPermille: number,
): GameState {
  return {
    ...state,
    planets: state.planets.map((planet) => {
      if (planet.id !== planetId) return planet;
      const resource = planet.economy.resources[resourceId];
      return {
        ...planet,
        economy: {
          ...planet.economy,
          resources: {
            ...planet.economy.resources,
            [resourceId]: {
              ...resource,
              amount: Math.floor((resource.capacity * fillPermille) / 1_000),
              productionRemainder: 0,
            },
          },
        },
      };
    }),
  };
}

function createCanonicalTwoColonyState(
  seed: string,
  factionId: FactionId,
  empireId: string,
): {
  readonly state: GameState;
  readonly donorId: string;
  readonly receiverId: string;
} {
  const initial = createInitialGameState(seed, factionId);
  const botHome = initial.planets.find((planet) => planet.ownerEmpireId === empireId);
  const playerHome = initial.planets.find((planet) => planet.ownerEmpireId === 'player');
  if (botHome === undefined || playerHome === undefined) {
    throw new Error('Expected bot and player home colonies.');
  }
  const energyOutputPercent = getResearchEffectsForEmpire(initial, empireId).energyOutputPercent;
  const first = {
    ...botHome,
    specializationId: 'industry' as const,
    developmentTemplateId: 'industrial-hub' as const,
    buildQueue: [],
    productionQueues: { shipyard: [], defense: [] },
  };
  const second = {
    ...playerHome,
    ownerEmpireId: empireId,
    name: `${factionId} logistics receiver`,
    specializationId: 'resource' as const,
    developmentTemplateId: 'resource-hub' as const,
    buildQueue: [],
    productionQueues: { shipyard: [], defense: [] },
  };
  const refreshedFirst = {
    ...first,
    economy: refreshPlanetEconomy(
      initial.campaignSettings.progressionProfile,
      first.economy,
      first.buildings,
      energyOutputPercent,
      first.specializationId,
    ),
  };
  const refreshedSecond = {
    ...second,
    economy: refreshPlanetEconomy(
      initial.campaignSettings.progressionProfile,
      second.economy,
      second.buildings,
      energyOutputPercent,
      second.specializationId,
    ),
  };
  let state: GameState = {
    ...initial,
    galaxy: updateGalaxyPlanetOwner(initial.galaxy, playerHome.galaxyPlanetId, empireId),
    planets: initial.planets.map((planet) =>
      planet.id === botHome.id
        ? refreshedFirst
        : planet.id === playerHome.id
          ? refreshedSecond
          : planet),
    fleets: initial.fleets.filter((fleet) =>
      fleet.originPlanetId !== playerHome.id &&
      !(fleet.location.type === 'planet' && fleet.location.planetId === playerHome.id)),
    botAutomation: {
      nextDecisionAtByEmpire: {
        ...initial.botAutomation.nextDecisionAtByEmpire,
        [empireId]: 0,
      },
    },
  };
  for (const resourceId of ['metal', 'crystal', 'gas'] as const) {
    state = setAmountAtFill(state, refreshedFirst.id, resourceId, 500);
    state = setAmountAtFill(state, refreshedSecond.id, resourceId, 500);
  }
  state = setAmountAtFill(state, refreshedFirst.id, 'metal', 800);
  state = setAmountAtFill(state, refreshedSecond.id, 'metal', 100);
  return { state, donorId: refreshedFirst.id, receiverId: refreshedSecond.id };
}

function profile(empireId: string): BotProfile {
  return {
    id: `audit-logistics-${empireId}`,
    empireId,
    personality: 'industrial',
    decisionIntervalSeconds: 100_000,
    maxCommandsPerDecision: 1,
  };
}

function runChunked(
  initial: GameState,
  botProfile: BotProfile,
): ReturnType<typeof advanceCampaignTime> {
  let state = initial;
  let summary = createEmptyCatchUpSummary();
  let operationsProcessed = 0;
  for (let elapsed = 0; elapsed < DAY_SECONDS; elapsed += CHUNK_SECONDS) {
    const result = advanceCampaignTime(state, CHUNK_SECONDS, { botProfiles: [botProfile] });
    expect(result.complete).toBe(true);
    state = result.state;
    summary = mergeCatchUpSummaries(summary, result.summaryDelta);
    operationsProcessed += result.operationsProcessed;
  }
  return {
    state,
    requestedGameSeconds: DAY_SECONDS,
    processedGameSeconds: DAY_SECONDS,
    remainingGameSeconds: 0,
    operationsProcessed,
    complete: true,
    summaryDelta: summary,
    botAudit: [],
    botDiagnostics: [],
  };
}

function runSaveLoaded(
  initial: GameState,
  botProfile: BotProfile,
  slotId: string,
): ReturnType<typeof advanceCampaignTime> {
  const first = advanceCampaignTime(initial, HALF_DAY_SECONDS, { botProfiles: [botProfile] });
  expect(first.complete).toBe(true);
  const parsed = parseSaveJson(serializeSave(createSaveEnvelope(slotId, first.state, SAVE_TIME)));
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) throw new Error(parsed.message);
  const second = advanceCampaignTime(parsed.value.state, HALF_DAY_SECONDS, {
    botProfiles: [botProfile],
  });
  expect(second.complete).toBe(true);
  return {
    ...second,
    requestedGameSeconds: DAY_SECONDS,
    processedGameSeconds: DAY_SECONDS,
    operationsProcessed: first.operationsProcessed + second.operationsProcessed,
    summaryDelta: mergeCatchUpSummaries(first.summaryDelta, second.summaryDelta),
  };
}

function routeKeys(state: GameState): readonly string[] {
  return state.logisticsRoutes.map((route) =>
    [route.empireId, route.originPlanetId, route.targetPlanetId, route.resourceId].join('|'));
}

describe('M5 multi-colony economy and logistics gate', () => {
  for (const { factionId, empireId } of CASES) {
    it(`${factionId} bot sustains canonical roles and deterministic logistics for 24 campaign hours`, () => {
      const fixture = createCanonicalTwoColonyState(
        `m5-logistics-${factionId}`,
        factionId,
        empireId,
      );
      const botProfile = profile(empireId);
      const direct = advanceCampaignTime(fixture.state, DAY_SECONDS, {
        botProfiles: [botProfile],
      });
      const chunked = runChunked(fixture.state, botProfile);
      const saveLoaded = runSaveLoaded(
        fixture.state,
        botProfile,
        `m5-logistics-${factionId}`,
      );

      expect(direct.complete).toBe(true);
      expect(chunked.state).toEqual(direct.state);
      expect(saveLoaded.state).toEqual(direct.state);
      expect(chunked.summaryDelta).toEqual(direct.summaryDelta);
      expect(saveLoaded.summaryDelta).toEqual(direct.summaryDelta);

      const colonies = direct.state.planets
        .filter((planet) => planet.ownerEmpireId === empireId)
        .sort((left, right) =>
          left.systemId.localeCompare(right.systemId) ||
          left.position - right.position ||
          left.id.localeCompare(right.id));
      expect(colonies[0]).toMatchObject({
        id: fixture.donorId,
        specializationId: 'industry',
        developmentTemplateId: 'industrial-hub',
      });
      expect(colonies[1]).toMatchObject({
        id: fixture.receiverId,
        specializationId: 'resource',
        developmentTemplateId: 'resource-hub',
      });

      const routes = direct.state.logisticsRoutes.filter((route) => route.empireId === empireId);
      expect(routes).toHaveLength(1);
      expect(routes[0]).toMatchObject({
        originPlanetId: fixture.donorId,
        targetPlanetId: fixture.receiverId,
        resourceId: 'metal',
        status: 'active',
        consecutiveMisses: 0,
        lastResult: { code: 'transferred' },
      });
      expect(new Set(routeKeys(direct.state)).size).toBe(direct.state.logisticsRoutes.length);
      expect(
        direct.state.commandLog.filter((entry) =>
          entry.command.type === 'CREATE_LOGISTICS_ROUTE' &&
          entry.command.empireId === empireId),
      ).toHaveLength(1);
      expect(direct.state.commandLog.length).toBeLessThanOrEqual(20);
    });
  }
});
