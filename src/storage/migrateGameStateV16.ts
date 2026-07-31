import {
  createCampaignSettings,
  isCampaignSettings,
  LEGACY_PROGRESSION_PROFILE_ID,
  type CampaignSettings,
} from '../simulation/campaign/settings';
import { refreshPlanetEconomy } from '../simulation/economy/planetEconomy';
import type { ResourceId } from '../simulation/economy/types';
import { getResearchEffectsForEmpire } from '../simulation/factions/factionResearchEffects';
import { compactGameStateHistory } from '../simulation/history/stateHistory';
import { reconcileWorldEventSchedule } from '../simulation/pve/worldEvents';
import type { GameState } from '../simulation/types';
import { migrateLegacySynodAliases } from './migrateLegacySynodAliases';
import { migrateLegacyVeyraAliases } from './migrateLegacyVeyraAliases';
import {
  migrateGameStateV15,
  type LegacyCampaignSettingsV15,
} from './migrateGameStateV15';

interface SavedResourceProgress {
  readonly amount: number;
  readonly productionRemainder: number;
}

type SavedPlanetResourceProgress = Readonly<Record<ResourceId, SavedResourceProgress>>;

const RESOURCE_IDS: readonly ResourceId[] = ['metal', 'crystal', 'gas'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function readSavedResourceProgress(
  value: Record<string, unknown>,
): ReadonlyMap<string, SavedPlanetResourceProgress> {
  const saved = new Map<string, SavedPlanetResourceProgress>();
  if (!Array.isArray(value.planets)) return saved;

  for (const planetValue of value.planets) {
    if (!isRecord(planetValue) || typeof planetValue.id !== 'string') continue;
    const economy = planetValue.economy;
    if (!isRecord(economy) || !isRecord(economy.resources)) continue;

    const resources = {} as Record<ResourceId, SavedResourceProgress>;
    let complete = true;
    for (const resourceId of RESOURCE_IDS) {
      const stock = economy.resources[resourceId];
      if (
        !isRecord(stock) ||
        !isNonNegativeInteger(stock.amount) ||
        !isNonNegativeInteger(stock.productionRemainder)
      ) {
        complete = false;
        break;
      }
      resources[resourceId] = {
        amount: stock.amount,
        productionRemainder: stock.productionRemainder,
      };
    }
    if (complete) saved.set(planetValue.id, resources);
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

function restoreProfileEconomy(
  state: GameState,
  savedProgress: ReadonlyMap<string, SavedPlanetResourceProgress> = new Map(),
): GameState {
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

      const economy = refreshPlanetEconomy(
        state.campaignSettings.progressionProfile,
        planet.economy,
        planet.buildings,
        getResearchEffectsForEmpire(state, planet.ownerEmpireId).energyOutputPercent,
        planet.specializationId,
      );
      const progress = savedProgress.get(planet.id);
      if (progress === undefined) return { ...planet, economy };

      return {
        ...planet,
        economy: {
          ...economy,
          resources: Object.fromEntries(
            RESOURCE_IDS.map((resourceId) => {
              const stock = economy.resources[resourceId];
              return [
                resourceId,
                {
                  ...stock,
                  amount: Math.min(progress[resourceId].amount, stock.capacity),
                  productionRemainder: progress[resourceId].productionRemainder,
                },
              ];
            }),
          ) as GameState['planets'][number]['economy']['resources'],
        },
      };
    }),
  };
}

function finalizeCurrentState(
  state: GameState,
  savedProgress: ReadonlyMap<string, SavedPlanetResourceProgress> = new Map(),
): GameState {
  const aliases = migrateLegacyVeyraAliases(migrateLegacySynodAliases(state));
  const scheduled = reconcileWorldEventSchedule(aliases);
  return restoreProfileEconomy(compactGameStateHistory(scheduled), savedProgress);
}

export function migrateGameStateV16(
  value: unknown,
  legacySavedAt: string,
): GameState | undefined {
  if (isRecord(value) && value.schemaVersion === 16) {
    if (!isCampaignSettings(value.campaignSettings)) return undefined;
    const campaignSettings = value.campaignSettings;
    const savedProgress = readSavedResourceProgress(value);
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

    return finalizeCurrentState(
      {
        ...reconciled,
        schemaVersion: 16,
        campaignSettings,
      },
      savedProgress,
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

  return finalizeCurrentState({
    ...legacy,
    schemaVersion: 16,
    campaignSettings,
  });
}
