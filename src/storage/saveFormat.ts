import { createStateChecksum } from '../simulation/checksum';
import {
  isPlanetDevelopmentTemplateId,
  isPlanetSpecializationId,
} from '../simulation/planet/specialization';
import { PLANET_ZONE_IDS } from '../simulation/planet/zones';
import type { GameState } from '../simulation/types';
import { migrateGameState } from './migrateGameState';
import {
  SAVE_FORMAT_VERSION,
  type SaveEnvelope,
  type SaveParseResult,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}
function isPositiveInteger(value: unknown): value is number {
  return isNonNegativeInteger(value) && value > 0;
}
function isResourceId(value: unknown): boolean {
  return value === 'metal' || value === 'crystal' || value === 'gas';
}
function isResourceCost(value: unknown): boolean {
  return isRecord(value) && isNonNegativeInteger(value.metal) && isNonNegativeInteger(value.crystal) && isNonNegativeInteger(value.gas);
}
function isStateShell(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(value.schemaVersion as number) &&
    typeof value.seed === 'number' && Number.isInteger(value.seed) && isRecord(value.clock) &&
    typeof value.clock.startedAt === 'string' && isNonNegativeInteger(value.clock.elapsedSeconds) &&
    Array.isArray(value.empires) && value.empires.every((item) => typeof item === 'string') &&
    isRecord(value.galaxy) && Array.isArray(value.galaxy.systems) && Array.isArray(value.planets) &&
    isNonNegativeInteger(value.nextEventSequence) && Array.isArray(value.pendingEvents) &&
    Array.isArray(value.commandLog) && Array.isArray(value.eventLog);
}
function isProductionQueueItem(value: unknown): boolean {
  return isRecord(value) && typeof value.id === 'string' && typeof value.unitId === 'string' &&
    (value.kind === 'ship' || value.kind === 'defense') && isPositiveInteger(value.quantity) &&
    isNonNegativeInteger(value.startedAt) && isNonNegativeInteger(value.completesAt) && isResourceCost(value.cost);
}
function isPlanet(value: unknown): boolean {
  if (!isRecord(value) || !isPlanetSpecializationId(value.specializationId) ||
    !isPlanetDevelopmentTemplateId(value.developmentTemplateId) || !isRecord(value.zones) ||
    !Array.isArray(value.buildings) || !Array.isArray(value.buildQueue) || !isRecord(value.economy) ||
    !isRecord(value.inventory) || !isRecord(value.productionQueues)) return false;
  const zones = value.zones;
  const validZones = Object.keys(zones).sort().join('|') === [...PLANET_ZONE_IDS].sort().join('|') &&
    PLANET_ZONE_IDS.every((zoneId) => {
      const zone = zones[zoneId];
      return isRecord(zone) && zone.id === zoneId && isNonNegativeInteger(zone.fieldLimit) &&
        isNonNegativeInteger(zone.usedFields) && zone.usedFields <= zone.fieldLimit;
    });
  return validZones && isRecord(value.inventory.ships) && Object.values(value.inventory.ships).every(isNonNegativeInteger) &&
    isRecord(value.inventory.defenses) && Object.values(value.inventory.defenses).every(isNonNegativeInteger) &&
    Array.isArray(value.productionQueues.shipyard) && value.productionQueues.shipyard.every(isProductionQueueItem) &&
    Array.isArray(value.productionQueues.defense) && value.productionQueues.defense.every(isProductionQueueItem);
}
function isResearchState(value: unknown): boolean {
  return isRecord(value) && typeof value.empireId === 'string' && isRecord(value.levels) &&
    Object.values(value.levels).every(isNonNegativeInteger) && Array.isArray(value.queue);
}
function isFleetLocation(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (value.type === 'planet') return typeof value.planetId === 'string';
  return value.type === 'transit' && typeof value.fromPlanetId === 'string' &&
    typeof value.toPlanetId === 'string' && isNonNegativeInteger(value.departedAt) &&
    isNonNegativeInteger(value.arrivesAt) && value.arrivesAt >= value.departedAt;
}
function isFleet(value: unknown): boolean {
  const validMission = value !== null && isRecord(value) && (value.mission === null ||
    (isRecord(value.mission) &&
      (value.mission.kind === 'deploy' || value.mission.kind === 'transport' || value.mission.kind === 'scout' ||
        value.mission.kind === 'attack' || value.mission.kind === 'recycle' || value.mission.kind === 'colonize') &&
      typeof value.mission.targetPlanetId === 'string'));
  return validMission && typeof value.id === 'string' && typeof value.empireId === 'string' &&
    typeof value.originPlanetId === 'string' && ['stationed', 'outbound', 'holding', 'returning'].includes(value.status as string) &&
    isFleetLocation(value.location) && isRecord(value.ships) && Object.keys(value.ships).length > 0 &&
    Object.values(value.ships).every(isPositiveInteger) && isResourceCost(value.cargo) &&
    isPositiveInteger(value.speed) && isNonNegativeInteger(value.cargoCapacity);
}
function isObservation(value: unknown): boolean {
  return isRecord(value) && typeof value.id === 'string' && typeof value.observerEmpireId === 'string' &&
    typeof value.targetPlanetId === 'string' && isNonNegativeInteger(value.observedAt) &&
    isNonNegativeInteger(value.expiresAt) && value.expiresAt > value.observedAt && typeof value.detected === 'boolean' &&
    isRecord(value.snapshot) && typeof value.snapshot.planetId === 'string' && typeof value.snapshot.name === 'string' &&
    typeof value.snapshot.ownerEmpireId === 'string' && (value.snapshot.level === 1 || value.snapshot.level === 2 || value.snapshot.level === 3);
}
function isIntelligenceAlert(value: unknown): boolean {
  return isRecord(value) && typeof value.id === 'string' && typeof value.empireId === 'string' &&
    (value.sourceEmpireId === null || typeof value.sourceEmpireId === 'string') && typeof value.targetPlanetId === 'string' &&
    isNonNegativeInteger(value.detectedAt) && (value.confidence === 'low' || value.confidence === 'medium' || value.confidence === 'high');
}
function isIntelligenceState(value: unknown): boolean {
  return isRecord(value) && typeof value.empireId === 'string' && Array.isArray(value.observations) &&
    value.observations.every(isObservation) && Array.isArray(value.alerts) && value.alerts.every(isIntelligenceAlert);
}
function isDebrisField(value: unknown): boolean {
  return isRecord(value) && typeof value.id === 'string' && typeof value.planetId === 'string' &&
    isNonNegativeInteger(value.metal) && isNonNegativeInteger(value.crystal) && isNonNegativeInteger(value.createdAt) &&
    (value.metal > 0 || value.crystal > 0);
}
function isLogisticsResult(value: unknown): boolean {
  return value === null || (isRecord(value) && isNonNegativeInteger(value.executedAt) &&
    ['transferred', 'origin-reserve', 'target-full', 'origin-missing', 'target-missing'].includes(value.code as string) &&
    isNonNegativeInteger(value.amount));
}
function isLogisticsRoute(value: unknown): boolean {
  return isRecord(value) && typeof value.id === 'string' && typeof value.empireId === 'string' &&
    typeof value.originPlanetId === 'string' && typeof value.targetPlanetId === 'string' &&
    value.originPlanetId !== value.targetPlanetId && isResourceId(value.resourceId) &&
    isPositiveInteger(value.amountPerTrip) && isNonNegativeInteger(value.originReserve) &&
    isPositiveInteger(value.intervalSeconds) && (value.priority === 1 || value.priority === 2 || value.priority === 3) &&
    (value.status === 'active' || value.status === 'paused') && isNonNegativeInteger(value.nextDepartureAt) &&
    isNonNegativeInteger(value.consecutiveMisses) && isLogisticsResult(value.lastResult);
}
function isMarketTrade(value: unknown): boolean {
  return isRecord(value) && typeof value.id === 'string' && typeof value.empireId === 'string' &&
    typeof value.planetId === 'string' && isResourceId(value.giveResourceId) && isResourceId(value.receiveResourceId) &&
    value.giveResourceId !== value.receiveResourceId && isPositiveInteger(value.giveAmount) &&
    isPositiveInteger(value.receiveAmount) && isNonNegativeInteger(value.feeAmount) &&
    isNonNegativeInteger(value.priceImpactPermille) && isNonNegativeInteger(value.executedAt);
}
function isMarket(value: unknown): boolean {
  return isRecord(value) && isRecord(value.reserves) && isPositiveInteger(value.reserves.metal) &&
    isPositiveInteger(value.reserves.crystal) && isPositiveInteger(value.reserves.gas) &&
    isNonNegativeInteger(value.feePermille) && isNonNegativeInteger(value.maxPriceImpactPermille) &&
    isNonNegativeInteger(value.nextTradeSequence) && Array.isArray(value.trades) && value.trades.every(isMarketTrade);
}
function isGameState(value: unknown): value is GameState {
  return isStateShell(value) && value.schemaVersion === 12 && Array.isArray(value.empires) &&
    Array.isArray(value.planets) && value.planets.every(isPlanet) && Array.isArray(value.research) &&
    value.research.every(isResearchState) && Array.isArray(value.fleets) && value.fleets.every(isFleet) &&
    Array.isArray(value.intelligence) && value.intelligence.every(isIntelligenceState) &&
    value.intelligence.length === value.empires.length && Array.isArray(value.debrisFields) &&
    value.debrisFields.every(isDebrisField) && Array.isArray(value.logisticsRoutes) &&
    value.logisticsRoutes.every(isLogisticsRoute) && isMarket(value.market);
}

export function createSaveEnvelope(slotId: string, state: GameState, savedAt: string): SaveEnvelope {
  if (slotId.trim().length === 0) throw new Error('Save slot id must not be empty.');
  return { formatVersion: SAVE_FORMAT_VERSION, slotId, savedAt, checksum: createStateChecksum(state), state };
}
export function serializeSave(save: SaveEnvelope): string { return JSON.stringify(save); }
export function parseSaveJson(json: string): SaveParseResult {
  let parsed: unknown;
  try { parsed = JSON.parse(json) as unknown; } catch (error: unknown) {
    return { ok: false, code: 'INVALID_JSON', message: 'Save data is not valid JSON.', details: error instanceof Error ? error.message : error };
  }
  if (!isRecord(parsed) || (parsed.formatVersion !== 1 && parsed.formatVersion !== SAVE_FORMAT_VERSION) ||
    typeof parsed.slotId !== 'string' || parsed.slotId.trim().length === 0 || typeof parsed.savedAt !== 'string' ||
    typeof parsed.checksum !== 'string' || !isStateShell(parsed.state)) {
    return { ok: false, code: 'INVALID_SAVE_SHAPE', message: 'Save data is missing required fields or contains invalid values.' };
  }
  const actualChecksum = createStateChecksum(parsed.state);
  if (actualChecksum !== parsed.checksum) return { ok: false, code: 'CHECKSUM_MISMATCH', message: 'Save data checksum does not match its state.' };
  const state = migrateGameState(parsed.state);
  if (!isGameState(state)) return { ok: false, code: 'SAVE_MIGRATION_FAILED', message: 'Save data could not be migrated to the current schema.' };
  return { ok: true, value: { formatVersion: SAVE_FORMAT_VERSION, slotId: parsed.slotId, savedAt: parsed.savedAt, checksum: createStateChecksum(state), state } };
}
