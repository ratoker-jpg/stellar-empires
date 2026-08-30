import { createInitialBotAutomationState } from './bots/state';
import {
  buildBotEmpireIds,
  createBotProfilesForEmpires,
  PLAYER_EMPIRE_ID,
} from './bots/profiles';
import {
  createCampaignSettings,
  type CampaignSettings,
} from './campaign/settings';
import { createInitialCommandStates } from './command/commandDoctrine';
import {
  createInitialCampaignResult,
  createInitialEndgameFinalObjectState,
} from './endgame/finalObjects';
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
import { resolveSeed } from './seed';
import type { GameState } from './types';
import {
  createUniverseModel,
  getUniverseTopologyPreset,
  materializeGalaxy,
  type UniverseTopologyPresetId,
} from './universe/model';
import { createInitialShipUpgradeStates } from './upgrades/shipUpgrades';

export interface InitialGameConfiguration {
  readonly playerFaction?: FactionId;
  readonly campaignSettings?: CampaignSettings;
}

export type InitialGameSeedSource = string | number;

export function createInitialGameState(
  seedSource: InitialGameSeedSource,
  playerFaction?: FactionId,
  topologyPreset?: UniverseTopologyPresetId,
): GameState;
export function createInitialGameState(
  seedSource: InitialGameSeedSource,
  configuration?: InitialGameConfiguration,
): GameState;
export function createInitialGameState(
  seedSource: InitialGameSeedSource,
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
  const seed = resolveSeed(seedSource);
  const empires = [PLAYER_EMPIRE_ID, ...buildBotEmpireIds(campaignSettings.botEmpireCount)];
  const preset = getUniverseTopologyPreset(campaignSettings.scenarioPreset);
  if (empires.length > preset.galaxyCount * preset.systemsPerGalaxy) {
    throw new Error(
      `Universe preset ${campaignSettings.scenarioPreset} cannot host ${empires.length} empires (one home per system).`,
    );
  }
  const universe = createUniverseModel(seed, campaignSettings.scenarioPreset, empires);
  const galaxy = materializeGalaxy(universe, 1);
  const colonies = createInitialPlanetStates(
    universe,
    galaxy,
    playerFaction,
    campaignSettings.progressionProfile,
    seed,
  );
  const neutralForces = createInitialNeutralForces(galaxy, seed);
  const botProfiles = createBotProfilesForEmpires(seed, empires);
  return {
    schemaVersion: 20,
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
    endgameFinalObjects: createInitialEndgameFinalObjectState(),
    campaignResult: createInitialCampaignResult(),
    botAutomation: createInitialBotAutomationState(empires, 0, botProfiles),
    nextEventSequence: 0,
    pendingEvents: [],
    commandLog: [],
    eventLog: [],
  };
}
