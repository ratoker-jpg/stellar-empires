import { createBotProfilesForEmpires } from '../simulation/bots/profiles';
import { normalizeBotAutomationState } from '../simulation/bots/state';
import type { GameState } from '../simulation/types';
import {
  assignHomeWorlds,
  type UniverseModel,
} from '../simulation/universe/model';
import { migrateGameStateV19 } from './migrateGameStateV19';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Rebuilds the stored universe with the canonical v20 home assignment while
 * preserving every other universe field (preset, slots, galaxy seeds).
 */
function withHomePlanets(state: GameState): UniverseModel {
  const universe = state.universe;
  return {
    ...universe,
    homePlanets: assignHomeWorlds(state.seed, universe.presetId, state.empires),
  };
}

/**
 * Stamps the schema-v20 additions onto a fully migrated state:
 * `campaignSettings.botEmpireCount`, the deterministic bot profile set and the
 * canonical home-world assignment (docs/30 D-1/D-7). The stamping is
 * idempotent: recomputing it over an already-v20 state yields the same values.
 */
export function applySchemaV20(state: GameState): GameState | undefined {
  try {
    const universe = withHomePlanets(state);
    const botEmpireCount = Math.max(0, state.empires.length - 1);
    const profiles = createBotProfilesForEmpires(state.seed, state.empires);
    const botAutomation = normalizeBotAutomationState(
      { ...(state.botAutomation ?? {}), profiles },
      state.empires,
      state.clock.elapsedSeconds,
    );
    if (botAutomation === undefined) return undefined;
    return {
      ...state,
      schemaVersion: 20,
      campaignSettings: {
        ...state.campaignSettings,
        botEmpireCount,
      },
      universe,
      botAutomation,
    };
  } catch {
    return undefined;
  }
}

export function migrateGameStateV20(
  value: unknown,
  legacySavedAt: string,
): GameState | undefined {
  // Every parse re-runs the full repair chain (schema v20 fields are rebuilt
  // deterministically afterwards), preserving the additive self-healing
  // semantics the migration chain has always provided.
  const sourceVersion = isRecord(value) ? value.schemaVersion : undefined;
  const throughChain = migrateGameStateV19(
    isRecord(value) && sourceVersion === 20
      ? { ...value, schemaVersion: 19 }
      : value,
    legacySavedAt,
  );
  if (throughChain === undefined) return undefined;
  return applySchemaV20(throughChain);
}
