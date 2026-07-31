import {
  createCampaignSettings,
  isCampaignSettings,
  LEGACY_PROGRESSION_PROFILE_ID,
  type CampaignSettings,
} from '../simulation/campaign/settings';
import { refreshPlanetEconomy } from '../simulation/economy/planetEconomy';
import { getResearchEffectsForEmpire } from '../simulation/factions/factionResearchEffects';
import type { GameState } from '../simulation/types';
import { migrateGameStateV15 } from './migrateGameStateV15';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function restoreProfileEconomy(state: GameState): GameState {
  const managedEmpireIds = new Set(state.empires);
  return {
    ...state,
    planets: state.planets.map((planet) => {
      if (
        planet.ownerEmpireId === null ||
        !managedEmpireIds.has(planet.ownerEmpireId)
      ) {
        return planet;
      }
      return {
        ...planet,
        economy: refreshPlanetEconomy(
          state.campaignSettings.progressionProfile,
          planet.economy,
          planet.buildings,
          getResearchEffectsForEmpire(state, planet.ownerEmpireId).energyOutputPercent,
          planet.specializationId,
        ),
      };
    }),
  };
}

export function migrateGameStateV16(
  value: unknown,
  legacySavedAt: string,
): GameState | undefined {
  if (isRecord(value) && value.schemaVersion === 16) {
    if (!isCampaignSettings(value.campaignSettings)) return undefined;
    return value as unknown as GameState;
  }

  const legacy = migrateGameStateV15(value, legacySavedAt);
  if (legacy === undefined) return undefined;

  let campaignSettings: CampaignSettings;
  try {
    campaignSettings = createCampaignSettings({
      scenarioPreset: legacy.campaignSettings.scenarioPreset,
      worldSpeed: legacy.campaignSettings.worldSpeed,
      progressionProfile: LEGACY_PROGRESSION_PROFILE_ID,
      createdAtReal: legacy.campaignSettings.createdAtReal,
    });
  } catch {
    return undefined;
  }

  return restoreProfileEconomy({
    ...legacy,
    schemaVersion: 16,
    campaignSettings,
  });
}
