import { getEmpireIntelligence } from '../intelligence/intelligenceState';
import type { GameState } from '../types';

export type BotMemoryEntry =
  | {
      readonly id: string;
      readonly kind: 'observation';
      readonly recordedAt: number;
      readonly subjectId: string;
      readonly summary: string;
      readonly current: boolean;
    }
  | {
      readonly id: string;
      readonly kind: 'alert';
      readonly recordedAt: number;
      readonly subjectId: string;
      readonly summary: string;
      readonly current: true;
    };

export interface BotMemorySummary {
  readonly empireId: string;
  readonly totalEntries: number;
  readonly currentObservations: number;
  readonly staleObservations: number;
  readonly alerts: number;
  readonly latestEntryAt: number | null;
}

export function createBotMemoryTimeline(
  state: GameState,
  empireId: string,
  limit = 50,
): readonly BotMemoryEntry[] {
  const intelligence = getEmpireIntelligence(state.intelligence, empireId);
  if (intelligence === undefined) return [];

  const observations: BotMemoryEntry[] = intelligence.observations.map((observation) => ({
    id: observation.id,
    kind: 'observation',
    recordedAt: observation.observedAt,
    subjectId: observation.targetPlanetId,
    summary: `${observation.snapshot.name} · разведданные уровня ${observation.snapshot.level}`,
    current: observation.expiresAt > state.clock.elapsedSeconds,
  }));
  const alerts: BotMemoryEntry[] = intelligence.alerts.map((alert) => ({
    id: alert.id,
    kind: 'alert',
    recordedAt: alert.detectedAt,
    subjectId: alert.targetPlanetId,
    summary: `Обнаружена разведывательная активность · уверенность ${alert.confidence}`,
    current: true,
  }));

  return [...observations, ...alerts]
    .sort((left, right) => right.recordedAt - left.recordedAt || left.id.localeCompare(right.id))
    .slice(0, Math.max(0, limit));
}

export function summarizeBotMemory(
  state: GameState,
  empireId: string,
): BotMemorySummary {
  const timeline = createBotMemoryTimeline(state, empireId, Number.MAX_SAFE_INTEGER);
  const observationEntries = timeline.filter((entry) => entry.kind === 'observation');
  return {
    empireId,
    totalEntries: timeline.length,
    currentObservations: observationEntries.filter((entry) => entry.current).length,
    staleObservations: observationEntries.filter((entry) => !entry.current).length,
    alerts: timeline.filter((entry) => entry.kind === 'alert').length,
    latestEntryAt: timeline[0]?.recordedAt ?? null,
  };
}
