import { createInitialBotAutomationState } from './bots/state';
import {
  createCampaignSettings,
  type CampaignSettings,
} from './campaign/settings';
import { createInitialCommandStates } from './command/commandDoctrine';
import { createInitialEndgameParticipationState } from './endgame/participation';
import { createInitialIntelligenceStates } from './intelligence/intelligenceState';
import { createInitialMarketState } from './market/market';
import { createInitialPlanetStates } from './planet/createInitialPlanetStates';
import type { FactionId } from './planet/types';
import { createInitialNeutralForces } from './pve/neutralForces';
import {
  createInitialSpaceObjects,
  createInitialStrategicResources,
} from './pve/spaceObjects';
import { createInitialWorldEventState } from './pve/worldEvents';
import { createInitialPveMetaState } from './pveMeta/reputation';
import { createInitialResearchStates } from './research/researchState';
import { normalizeSeed } from './seed';
import type { GameState } from './types';
import {
  createUniverseModel,
  materializeGalaxy,
  type UniverseTopologyPresetId,
} from './universe/model';
import { createInitialShipUpgradeStates } from './upgrades/shipUpgrades';

export interface InitialGameConfiguration {
  readonly playerFaction?: FactionId;
  readonly campaignSettings?: CampaignSettings;
}

export function createInitialGameState(
  seedSource: string,
  playerFaction?: FactionId,
  topologyPreset?: UniverseTopologyPresetId,
): GameState;
export function createInitialGameState(
  seedSource: string,
  configuration?: InitialGameConfiguration,
): GameState;
export function createInitialGameState(
  seedSource: string,
  factionOrConfiguration: FactionId | InitialGameConfiguration = 'aegis',
  legacyTopologyPreset: UniverseTopologyPresetId = 'campaign',
): GameState {
  const legacySignature = typeof factionOrConfiguration === 'string';
  const playerFaction = legacySignature
    ? factionOrConfiguration
    : (factionOrConfiguration.playerFaction ?? 'aegis');
  const campaignSettings = legacySignature
    ? createCampaignSettings({ scenarioPreset: legacyTopologyPreset })
    : createCampaignSettings(factionOrConfiguration.campaignSettings);
  const seed = normalizeSeed(seedSource);
  const universe = createUniverseModel(seed, campaignSettings.scenarioPreset);
  const galaxy = materializeGalaxy(universe, 1);
  const empires = ['player', 'aegis-bot', 'synod-bot', 'veyra-bot'] as const;
  const colonies = createInitialPlanetStates(
    galaxy,
    playerFaction,
    campaignSettings.progressionProfile,
  );
  const neutralForces = createInitialNeutralForces(galaxy, seed);
  return {
    schemaVersion: 18,
    seed,
    campaignSettings,
    clock: {
      startedAt: campaignSettings.createdAtReal,
      elapsedSeconds: 0,
    },
    empires,
    universe,
    galaxy,
    planets: [...colonies, ...neutralForces.planets],
    research: createInitialResearchStates(empires),
    shipUpgrades: createInitialShipUpgradeStates(empires),
    commanders: createInitialCommandStates(empires),
    fleets: neutralForces.fleets,
    intelligence: createInitialIntelligenceStates(empires),
    debrisFields: [],
    logisticsRoutes: [],
    market: createInitialMarketState(),
    spaceObjects: createInitialSpaceObjects(galaxy, seed),
    strategicResources: createInitialStrategicResources(empires),
    worldEvents: createInitialWorldEventState(),
    pveMeta: createInitialPveMetaState(empires),
    endgameParticipation: createInitialEndgameParticipationState(empires),
    botAutomation: createInitialBotAutomationState(empires, 0),
    nextEventSequence: 0,
    pendingEvents: [],
    commandLog: [],
    eventLog: [],
  };
}
