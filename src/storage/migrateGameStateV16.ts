import {
  createCampaignSettings,
  isCampaignSettings,
  LEGACY_PROGRESSION_PROFILE_ID,
  type CampaignSettings,
} from '../simulation/campaign/settings';
import { refreshPlanetEconomy } from '../simulation/economy/planetEconomy';
import type { PlanetEconomyState } from '../simulation/economy/types';
import { getResearchEffectsForEmpire } from '../simulation/factions/factionResearchEffects';
import type { GameState } from '../simulation/types';
import {
  migrateGameStateV15,
  type LegacyCampaignSettingsV15,
} from './migrateGameStateV15';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readSavedPlanetEconomies(
  value: Record<string, unknown>,
): ReadonlyMap<string, PlanetEconomyState> {
  const saved = new Map<string, PlanetEconomyState>();
  if (!Array.isArray(value.planets)) return saved;

  for (const planetValue of value.planets) {
    if (
      !isRecord(planetValue) ||
      typeof planetValue.id !== 'string' ||
      !isRecord(planetValue.economy)
    ) {
      continue;
    }
    saved.set(planetValue.id, planetValue.economy as unknown as PlanetEconomyState);
  }
  return saved;
}

function legacySettingsFromCurrent(settings: CampaignSettings): LegacyCampaignSettingsV15 {
  return {
    scenarioPreset: settings.scenarioPreset,
    worldSpeed: settings.worldSpeed,
    offlineProgression: true,
    createdAtReal: settings.createdAtReal,
  };
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

function restoreSavedPlanetEconomies(
  state: GameState,
  savedEconomies: ReadonlyMap<string, PlanetEconomyState>,
): GameState {
  return {
    ...state,
    planets: state.planets.map((planet) => {
      const economy = savedEconomies.get(planet.id);
      return economy === undefined ? planet : { ...planet, economy };
    }),
  };
}

export function migrateGameStateV16(
  value: unknown,
  legacySavedAt: string,
): GameState | undefined {
  if (isRecord(value) && value.schemaVersion === 16) {
    if (!isCampaignSettings(value.campaignSettings)) return undefined;
    const campaignSettings = value.campaignSettings;
    const savedEconomies = readSavedPlanetEconomies(value);
    const { campaignSettings: _ignored, ...stateWithoutCampaignSettings } = value;
    const reconciled = migrateGameStateV15(
      {
        ...stateWithoutCampaignSettings,
        schemaVersion: 15,
        campaignSettings: legacySettingsFromCurrent(campaignSettings),
      },
      legacySavedAt,
    );
    if (reconciled === undefined) return undefined;
    return restoreSavedPlanetEconomies(
      {
        ...reconciled,
        schemaVersion: 16,
        campaignSettings,
      },
      savedEconomies,
    );
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
