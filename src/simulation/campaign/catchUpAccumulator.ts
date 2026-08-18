import { getCampaignOutcomeForEmpire } from '../endgame/campaignResult';
import type { ResourceCost, ResourceId } from '../economy/types';
import type { LogisticsDepartureReceipt } from '../logistics/types';
import type { ExecutedGameEvent, GameState } from '../types';
import type { CampaignCatchUpSummary } from './catchUpSummary';

const RESOURCE_IDS: readonly ResourceId[] = ['metal', 'crystal', 'gas'];

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

type MutableSummary = {
  resources: {
    producedByPlanetAndResource: Record<string, ResourceCost>;
    lostByPlanetAndResource: Record<string, ResourceCost>;
  };
  completions: Mutable<CampaignCatchUpSummary['completions']>;
  fleets: Mutable<CampaignCatchUpSummary['fleets']>;
  combat: Mutable<CampaignCatchUpSummary['combat']>;
  bots: Mutable<CampaignCatchUpSummary['bots']>;
  world: Mutable<CampaignCatchUpSummary['world']>;
  result: Mutable<CampaignCatchUpSummary['result']>;
};

function addResource(
  target: Record<string, ResourceCost>,
  planetId: string,
  resourceId: ResourceId,
  amount: number,
): void {
  if (amount <= 0) return;
  const existing = target[planetId] ?? { metal: 0, crystal: 0, gas: 0 };
  target[planetId] = {
    ...existing,
    [resourceId]: existing[resourceId] + amount,
  };
}

function accumulatePlanetDelta(
  target: MutableSummary,
  planetId: string,
  before: GameState['planets'][number] | undefined,
  after: GameState['planets'][number] | undefined,
): void {
  for (const resourceId of RESOURCE_IDS) {
    const beforeAmount = before?.economy.resources[resourceId].amount ?? 0;
    const afterAmount = after?.economy.resources[resourceId].amount ?? 0;
    const delta = afterAmount - beforeAmount;
    if (delta > 0) {
      addResource(target.resources.producedByPlanetAndResource, planetId, resourceId, delta);
    } else if (delta < 0) {
      addResource(target.resources.lostByPlanetAndResource, planetId, resourceId, -delta);
    }
  }
}

function accumulatePlayerResources(
  target: MutableSummary,
  before: GameState,
  after: GameState,
): void {
  const seen = new Set<string>();
  for (const beforePlanet of before.planets) {
    if (beforePlanet.ownerEmpireId !== 'player') continue;
    seen.add(beforePlanet.id);
    const afterPlanet = after.planets.find((planet) => planet.id === beforePlanet.id);
    accumulatePlanetDelta(target, beforePlanet.id, beforePlanet, afterPlanet);
  }
  for (const afterPlanet of after.planets) {
    if (afterPlanet.ownerEmpireId !== 'player' || seen.has(afterPlanet.id)) continue;
    accumulatePlanetDelta(target, afterPlanet.id, undefined, afterPlanet);
  }
}

function accumulateEvents(
  target: MutableSummary,
  before: GameState,
  after: GameState,
  events: readonly ExecutedGameEvent[],
): void {
  if (events.length === 0) return;

  let playerPlanetIds: Set<string> | undefined;
  let playerFleetIds: Set<string> | undefined;
  const isPlayerPlanet = (planetId: string): boolean => {
    if (playerPlanetIds === undefined) {
      playerPlanetIds = new Set<string>();
      for (const planet of before.planets) {
        if (planet.ownerEmpireId === 'player') playerPlanetIds.add(planet.id);
      }
      for (const planet of after.planets) {
        if (planet.ownerEmpireId === 'player') playerPlanetIds.add(planet.id);
      }
    }
    return playerPlanetIds.has(planetId);
  };
  const isPlayerFleet = (fleetId: string): boolean => {
    if (playerFleetIds === undefined) {
      playerFleetIds = new Set<string>();
      for (const fleet of before.fleets) {
        if (fleet.empireId === 'player') playerFleetIds.add(fleet.id);
      }
      for (const fleet of after.fleets) {
        if (fleet.empireId === 'player') playerFleetIds.add(fleet.id);
      }
    }
    return playerFleetIds.has(fleetId);
  };

  for (const entry of events) {
    const payload = entry.event.payload;
    if (payload.type === 'BUILDING_COMPLETE' && isPlayerPlanet(payload.planetId)) {
      target.completions.buildings += 1;
    }
    if (payload.type === 'RESEARCH_COMPLETE' && payload.empireId === 'player') {
      target.completions.research += 1;
    }
    if (payload.type === 'UNIT_PRODUCTION_COMPLETE' && isPlayerPlanet(payload.planetId)) {
      if (payload.kind === 'ship') target.completions.ships += payload.quantity;
      else target.completions.defenses += payload.quantity;
    }
    if (payload.type === 'DEFENSE_REPAIR_COMPLETE' && isPlayerPlanet(payload.planetId)) {
      target.completions.repairs += payload.quantity;
    }
    if (payload.type === 'SHIP_UPGRADE_COMPLETE' && payload.empireId === 'player') {
      target.completions.upgrades += 1;
    }
    if (payload.type === 'FLEET_ARRIVE' && isPlayerFleet(payload.fleetId)) {
      target.fleets.arrivals += 1;
    }
    if (payload.type === 'FLEET_RETURN' && isPlayerFleet(payload.fleetId)) {
      target.fleets.returns += 1;
    }
    if (payload.type === 'EXPEDITION_RESOLVE' && payload.report.empireId === 'player') {
      target.world.expeditions += 1;
    }
    if (payload.type === 'SPACE_OBJECT_MISSION_RESOLVE' && payload.report.empireId === 'player') {
      target.world.spaceObjects += 1;
    }
    if (payload.type === 'WORLD_EVENT_START') {
      target.world.worldEvents += 1;
    }
    if (payload.type === 'BATTLE_REPORT') {
      const report = payload.report;
      const playerInvolved = report.attackerEmpireId === 'player' || report.defenderEmpireId === 'player';
      if (!playerInvolved) continue;
      target.combat.battles += 1;
      if (report.defenderEmpireId === 'player') target.combat.attacksOnPlayer += 1;
      const playerWon =
        (report.attackerEmpireId === 'player' && report.winner === 'attacker') ||
        (report.defenderEmpireId === 'player' && report.winner === 'defender');
      const playerLost =
        (report.attackerEmpireId === 'player' && report.winner === 'defender') ||
        (report.defenderEmpireId === 'player' && report.winner === 'attacker');
      if (playerWon) target.combat.victories += 1;
      if (playerLost) target.combat.defeats += 1;
      if (
        report.defenderEmpireId === 'player' &&
        (report.destruction?.planetDestroyed === true ||
          report.demolition?.rolls.some((roll) => roll.demolished) === true)
      ) {
        target.combat.colonyDamageOrLoss += 1;
      }
    }
  }
}

function accumulateLogistics(
  target: MutableSummary,
  receipts: readonly LogisticsDepartureReceipt[],
): void {
  for (const receipt of receipts) {
    if (receipt.empireId === 'player' && receipt.resultCode === 'transferred') {
      target.world.logisticsTransfers += 1;
    }
  }
}

export function accumulateCampaignTransition(
  summary: CampaignCatchUpSummary,
  before: GameState,
  after: GameState,
  events: readonly ExecutedGameEvent[],
  logisticsReceipts: readonly LogisticsDepartureReceipt[] = [],
): void {
  const target = summary as unknown as MutableSummary;
  accumulatePlayerResources(target, before, after);
  accumulateEvents(target, before, after, events);
  accumulateLogistics(target, logisticsReceipts);
  target.result.status = getCampaignOutcomeForEmpire(after, 'player');
}
