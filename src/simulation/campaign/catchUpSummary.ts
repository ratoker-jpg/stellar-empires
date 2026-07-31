import type { BotSchedulerAuditEntry } from '../bots/scheduler';
import type { ResourceCost, ResourceId } from '../economy/types';
import type { LogisticsDepartureReceipt } from '../logistics/types';
import type { ExecutedGameEvent, GameState } from '../types';

const RESOURCE_IDS: readonly ResourceId[] = ['metal', 'crystal', 'gas'];

export interface CampaignCatchUpSummary {
  readonly absence: {
    readonly realDurationSeconds: number;
    readonly gameDurationSeconds: number;
  };
  readonly resources: {
    readonly producedByPlanetAndResource: Readonly<Record<string, ResourceCost>>;
    readonly lostByPlanetAndResource: Readonly<Record<string, ResourceCost>>;
  };
  readonly completions: {
    readonly buildings: number;
    readonly research: number;
    readonly ships: number;
    readonly defenses: number;
    readonly repairs: number;
    readonly upgrades: number;
  };
  readonly fleets: {
    readonly departures: number;
    readonly arrivals: number;
    readonly returns: number;
  };
  readonly combat: {
    readonly battles: number;
    readonly attacksOnPlayer: number;
    readonly victories: number;
    readonly defeats: number;
    readonly colonyDamageOrLoss: number;
  };
  readonly bots: {
    readonly decisions: number;
    readonly acceptedCommands: number;
  };
  readonly world: {
    readonly expeditions: number;
    readonly spaceObjects: number;
    readonly logisticsTransfers: number;
    readonly worldEvents: number;
  };
  readonly result: {
    readonly status: 'unknown' | 'ongoing' | 'victory' | 'defeat';
  };
}

function emptyResourceCost(): ResourceCost {
  return { metal: 0, crystal: 0, gas: 0 };
}

function addResourceCost(left: ResourceCost, right: ResourceCost): ResourceCost {
  return {
    metal: left.metal + right.metal,
    crystal: left.crystal + right.crystal,
    gas: left.gas + right.gas,
  };
}

function mergeResourceMaps(
  left: Readonly<Record<string, ResourceCost>>,
  right: Readonly<Record<string, ResourceCost>>,
): Readonly<Record<string, ResourceCost>> {
  const result: Record<string, ResourceCost> = { ...left };
  for (const [planetId, resources] of Object.entries(right)) {
    result[planetId] = addResourceCost(result[planetId] ?? emptyResourceCost(), resources);
  }
  return result;
}

export function createEmptyCatchUpSummary(): CampaignCatchUpSummary {
  return {
    absence: { realDurationSeconds: 0, gameDurationSeconds: 0 },
    resources: {
      producedByPlanetAndResource: {},
      lostByPlanetAndResource: {},
    },
    completions: {
      buildings: 0,
      research: 0,
      ships: 0,
      defenses: 0,
      repairs: 0,
      upgrades: 0,
    },
    fleets: { departures: 0, arrivals: 0, returns: 0 },
    combat: {
      battles: 0,
      attacksOnPlayer: 0,
      victories: 0,
      defeats: 0,
      colonyDamageOrLoss: 0,
    },
    bots: { decisions: 0, acceptedCommands: 0 },
    world: {
      expeditions: 0,
      spaceObjects: 0,
      logisticsTransfers: 0,
      worldEvents: 0,
    },
    result: { status: 'unknown' },
  };
}

export function mergeCatchUpSummaries(
  left: CampaignCatchUpSummary,
  right: CampaignCatchUpSummary,
): CampaignCatchUpSummary {
  const resultStatus = right.result.status === 'unknown' ? left.result.status : right.result.status;
  return {
    absence: {
      realDurationSeconds: left.absence.realDurationSeconds + right.absence.realDurationSeconds,
      gameDurationSeconds: left.absence.gameDurationSeconds + right.absence.gameDurationSeconds,
    },
    resources: {
      producedByPlanetAndResource: mergeResourceMaps(
        left.resources.producedByPlanetAndResource,
        right.resources.producedByPlanetAndResource,
      ),
      lostByPlanetAndResource: mergeResourceMaps(
        left.resources.lostByPlanetAndResource,
        right.resources.lostByPlanetAndResource,
      ),
    },
    completions: {
      buildings: left.completions.buildings + right.completions.buildings,
      research: left.completions.research + right.completions.research,
      ships: left.completions.ships + right.completions.ships,
      defenses: left.completions.defenses + right.completions.defenses,
      repairs: left.completions.repairs + right.completions.repairs,
      upgrades: left.completions.upgrades + right.completions.upgrades,
    },
    fleets: {
      departures: left.fleets.departures + right.fleets.departures,
      arrivals: left.fleets.arrivals + right.fleets.arrivals,
      returns: left.fleets.returns + right.fleets.returns,
    },
    combat: {
      battles: left.combat.battles + right.combat.battles,
      attacksOnPlayer: left.combat.attacksOnPlayer + right.combat.attacksOnPlayer,
      victories: left.combat.victories + right.combat.victories,
      defeats: left.combat.defeats + right.combat.defeats,
      colonyDamageOrLoss: left.combat.colonyDamageOrLoss + right.combat.colonyDamageOrLoss,
    },
    bots: {
      decisions: left.bots.decisions + right.bots.decisions,
      acceptedCommands: left.bots.acceptedCommands + right.bots.acceptedCommands,
    },
    world: {
      expeditions: left.world.expeditions + right.world.expeditions,
      spaceObjects: left.world.spaceObjects + right.world.spaceObjects,
      logisticsTransfers: left.world.logisticsTransfers + right.world.logisticsTransfers,
      worldEvents: left.world.worldEvents + right.world.worldEvents,
    },
    result: { status: resultStatus },
  };
}

function summarizePlayerResourceDelta(
  before: GameState,
  after: GameState,
): Pick<CampaignCatchUpSummary, 'resources'> {
  const produced: Record<string, ResourceCost> = {};
  const lost: Record<string, ResourceCost> = {};
  const planetIds = new Set([
    ...before.planets.filter((planet) => planet.ownerEmpireId === 'player').map((planet) => planet.id),
    ...after.planets.filter((planet) => planet.ownerEmpireId === 'player').map((planet) => planet.id),
  ]);

  for (const planetId of planetIds) {
    const beforePlanet = before.planets.find((planet) => planet.id === planetId);
    const afterPlanet = after.planets.find((planet) => planet.id === planetId);
    const producedCost: Record<ResourceId, number> = { metal: 0, crystal: 0, gas: 0 };
    const lostCost: Record<ResourceId, number> = { metal: 0, crystal: 0, gas: 0 };
    for (const resourceId of RESOURCE_IDS) {
      const beforeAmount = beforePlanet?.economy.resources[resourceId].amount ?? 0;
      const afterAmount = afterPlanet?.economy.resources[resourceId].amount ?? 0;
      const delta = afterAmount - beforeAmount;
      if (delta > 0) producedCost[resourceId] = delta;
      if (delta < 0) lostCost[resourceId] = -delta;
    }
    if (RESOURCE_IDS.some((resourceId) => producedCost[resourceId] > 0)) {
      produced[planetId] = producedCost;
    }
    if (RESOURCE_IDS.some((resourceId) => lostCost[resourceId] > 0)) {
      lost[planetId] = lostCost;
    }
  }

  return {
    resources: {
      producedByPlanetAndResource: produced,
      lostByPlanetAndResource: lost,
    },
  };
}

function isPlayerPlanetEvent(
  before: GameState,
  after: GameState,
  planetId: string,
): boolean {
  return before.planets.some((planet) => planet.id === planetId && planet.ownerEmpireId === 'player') ||
    after.planets.some((planet) => planet.id === planetId && planet.ownerEmpireId === 'player');
}

function isPlayerFleetEvent(
  before: GameState,
  after: GameState,
  fleetId: string,
): boolean {
  return before.fleets.some((fleet) => fleet.id === fleetId && fleet.empireId === 'player') ||
    after.fleets.some((fleet) => fleet.id === fleetId && fleet.empireId === 'player');
}

function summarizeEvents(
  before: GameState,
  after: GameState,
  events: readonly ExecutedGameEvent[],
): CampaignCatchUpSummary {
  const summary = createEmptyCatchUpSummary();
  let buildings = 0;
  let research = 0;
  let ships = 0;
  let defenses = 0;
  let repairs = 0;
  let upgrades = 0;
  let arrivals = 0;
  let returns = 0;
  let battles = 0;
  let attacksOnPlayer = 0;
  let victories = 0;
  let defeats = 0;
  let colonyDamageOrLoss = 0;
  let expeditions = 0;
  let spaceObjects = 0;
  let worldEvents = 0;

  for (const entry of events) {
    const payload = entry.event.payload;
    if (payload.type === 'BUILDING_COMPLETE' && isPlayerPlanetEvent(before, after, payload.planetId)) buildings += 1;
    if (payload.type === 'RESEARCH_COMPLETE' && payload.empireId === 'player') research += 1;
    if (payload.type === 'UNIT_PRODUCTION_COMPLETE' && isPlayerPlanetEvent(before, after, payload.planetId)) {
      if (payload.kind === 'ship') ships += payload.quantity;
      else defenses += payload.quantity;
    }
    if (payload.type === 'DEFENSE_REPAIR_COMPLETE' && isPlayerPlanetEvent(before, after, payload.planetId)) repairs += payload.quantity;
    if (payload.type === 'SHIP_UPGRADE_COMPLETE' && payload.empireId === 'player') upgrades += 1;
    if (payload.type === 'FLEET_ARRIVE' && isPlayerFleetEvent(before, after, payload.fleetId)) arrivals += 1;
    if (payload.type === 'FLEET_RETURN' && isPlayerFleetEvent(before, after, payload.fleetId)) returns += 1;
    if (payload.type === 'EXPEDITION_RESOLVE') {
      const report = payload.report as { readonly empireId?: string };
      if (report.empireId === 'player') expeditions += 1;
    }
    if (payload.type === 'SPACE_OBJECT_MISSION_RESOLVE') {
      const report = payload.report as { readonly empireId?: string };
      if (report.empireId === 'player') spaceObjects += 1;
    }
    if (payload.type === 'WORLD_EVENT_START') worldEvents += 1;
    if (payload.type === 'BATTLE_REPORT') {
      const report = payload.report;
      const playerInvolved = report.attackerEmpireId === 'player' || report.defenderEmpireId === 'player';
      if (!playerInvolved) continue;
      battles += 1;
      if (report.defenderEmpireId === 'player') attacksOnPlayer += 1;
      const playerWon =
        (report.attackerEmpireId === 'player' && report.winner === 'attacker') ||
        (report.defenderEmpireId === 'player' && report.winner === 'defender');
      const playerLost =
        (report.attackerEmpireId === 'player' && report.winner === 'defender') ||
        (report.defenderEmpireId === 'player' && report.winner === 'attacker');
      if (playerWon) victories += 1;
      if (playerLost) defeats += 1;
      if (
        report.defenderEmpireId === 'player' &&
        (report.destruction?.planetDestroyed === true ||
          report.demolition?.rolls.some((roll) => roll.demolished) === true)
      ) {
        colonyDamageOrLoss += 1;
      }
    }
  }

  return {
    ...summary,
    completions: { buildings, research, ships, defenses, repairs, upgrades },
    fleets: { ...summary.fleets, arrivals, returns },
    combat: { battles, attacksOnPlayer, victories, defeats, colonyDamageOrLoss },
    world: { ...summary.world, expeditions, spaceObjects, worldEvents },
  };
}

export function summarizeCampaignTransition(
  before: GameState,
  after: GameState,
  events: readonly ExecutedGameEvent[],
  _botAudit: readonly BotSchedulerAuditEntry[] = [],
  logisticsReceipts: readonly LogisticsDepartureReceipt[] = [],
): CampaignCatchUpSummary {
  const resources = summarizePlayerResourceDelta(before, after);
  const eventSummary = summarizeEvents(before, after, events);
  const logisticsTransfers = logisticsReceipts.filter(
    (receipt) => receipt.empireId === 'player' && receipt.resultCode === 'transferred',
  ).length;
  return {
    ...eventSummary,
    ...resources,
    bots: eventSummary.bots,
    world: {
      ...eventSummary.world,
      logisticsTransfers,
    },
    result: {
      status: after.empires.includes('player') ? 'ongoing' : 'defeat',
    },
  };
}
