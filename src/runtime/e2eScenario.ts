import { DEFAULT_BOT_PROFILES } from '../simulation/bots/profiles';
import { createStateChecksum } from '../simulation/checksum';
import type { BattleReport } from '../simulation/combat/types';
import type { FinalObjectProject } from '../simulation/endgame/types';
import type { FleetState } from '../simulation/fleets/types';
import type { IntelObservation } from '../simulation/intelligence/types';
import { getCompleteBuildingIds } from '../simulation/planet/completeBuildingCatalog';
import { executeCommand } from '../simulation/reducer';
import type { GameState } from '../simulation/types';
import {
  runOrdinaryMissionIntelligenceGate,
  type OrdinaryMissionIntelligenceGateResult,
} from '../testing/e2eRuntime';

export const E2E_RUNTIME_ENABLED = import.meta.env.VITE_E2E === '1';
export const E2E_FLEET_ID = 'fleet-e2e-player';
export const E2E_SOLAR_WAR_FLEET_ID = 'fleet-e2e-solar-war';
export const E2E_INCOMING_FLEET_ID = 'fleet-e2e-incoming';
export const E2E_REPORT_ID = 'report-e2e-map-backlink';
export const E2E_SECONDARY_PLANET_ID = 'planet-e2e-secondary';
const E2E_BOT_IDLE_SECONDS = 86_400;
const E2E_SCOUT_COOLDOWN_CEILING_SECONDS = 7_200;
const E2E_BOT_GATE_DELAY_MILLISECONDS = 250;
const E2E_TERMINAL_QUERY = 'terminalGate';

let botGateResult: OrdinaryMissionIntelligenceGateResult | undefined;
let botGateScheduled = false;

function isBotGateRequested(): boolean {
  return E2E_RUNTIME_ENABLED &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('botGate') === '1';
}

function isTerminalFixtureRequested(): boolean {
  return E2E_RUNTIME_ENABLED &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get(E2E_TERMINAL_QUERY) === '1';
}

function getBotGateResult(): OrdinaryMissionIntelligenceGateResult {
  if (botGateResult === undefined) {
    const first = runOrdinaryMissionIntelligenceGate('e2e-ordinary-mission-intelligence');
    const second = runOrdinaryMissionIntelligenceGate('e2e-ordinary-mission-intelligence');
    if (JSON.stringify(first) !== JSON.stringify(second)) {
      throw new Error('Ordinary mission intelligence gate is not deterministic.');
    }
    botGateResult = first;
  }
  return botGateResult;
}

function writeBotGateDiagnostics(): void {
  const botGate = getBotGateResult();
  document.documentElement.dataset.e2eBotGateScoutReason = botGate.scoutReasonCode;
  document.documentElement.dataset.e2eBotGateAttackReason = botGate.attackReasonCode;
  document.documentElement.dataset.e2eBotGateObservationLevel = String(botGate.observationLevel);
  document.documentElement.dataset.e2eBotGateSchemaVersion = String(botGate.schemaVersion);
  document.documentElement.dataset.e2eBotGateDeterministic = 'true';
  document.documentElement.dataset.e2eBotGateChecksum = botGate.finalChecksum;
}

function scheduleBotGateDiagnostics(): void {
  if (!isBotGateRequested() || botGateScheduled) return;
  botGateScheduled = true;
  window.setTimeout(() => {
    try {
      writeBotGateDiagnostics();
    } catch (error: unknown) {
      document.documentElement.dataset.e2eBotGateError =
        error instanceof Error ? error.message : 'Unknown bot gate error';
      console.error('[stellar-empires] E2E bot gate failed', error);
    }
  }, E2E_BOT_GATE_DELAY_MILLISECONDS);
}

function requireScenarioPlanets(state: GameState) {
  const origin = state.planets.find(
    (planet) => planet.ownerEmpireId === 'player' && planet.id !== E2E_SECONDARY_PLANET_ID,
  ) ?? state.planets.find((planet) => planet.ownerEmpireId === 'player');
  const target = state.planets.find((planet) => planet.ownerEmpireId === 'pirate-neutral')
    ?? state.planets.find((planet) => planet.ownerEmpireId !== 'player');
  if (origin === undefined || target === undefined) {
    throw new Error('E2E scenario requires one player colony and one foreign colony.');
  }
  return { origin, target };
}

function advanceFixtureState(state: GameState, targetElapsedSeconds: number): GameState {
  const seconds = targetElapsedSeconds - state.clock.elapsedSeconds;
  if (seconds <= 0) return state;
  const advanced = executeCommand(state, { type: 'ADVANCE_TIME', seconds });
  if (!advanced.ok) {
    throw new Error(`E2E scenario time advance failed: ${advanced.code}`);
  }
  return {
    ...advanced.value,
    commandLog: state.commandLog,
  };
}

function createSecondaryPlayerPlanet(state: GameState, origin: GameState['planets'][number]) {
  const existing = state.planets.find((planet) => planet.id === E2E_SECONDARY_PLANET_ID);
  if (existing !== undefined) return existing;

  const occupied = new Set(state.planets.map((planet) => planet.galaxyPlanetId));
  const freeSlot = state.galaxy.systems
    .flatMap((system) => system.planets.map((planet) => ({ system, planet })))
    .find(({ planet }) => !occupied.has(planet.id));
  if (freeSlot === undefined) {
    throw new Error('E2E scenario requires one free galaxy position for a secondary player colony.');
  }

  return {
    ...origin,
    id: E2E_SECONDARY_PLANET_ID,
    galaxyPlanetId: freeSlot.planet.id,
    systemId: freeSlot.system.id,
    position: freeSlot.planet.position,
    coordinate: freeSlot.planet.coordinate,
    name: 'Вторая колония E2E',
    buildQueue: [],
    productionQueues: {
      shipyard: [],
      defense: [],
    },
  };
}

function canonicalizeFixtureState(state: GameState): GameState {
  const serialized = JSON.stringify(state);
  if (serialized === undefined) {
    throw new Error('E2E scenario state is not JSON serializable.');
  }
  return JSON.parse(serialized) as GameState;
}

function createE2eTerminalState(state: GameState): GameState {
  if (state.campaignResult?.status === 'terminal') return canonicalizeFixtureState(state);
  const host = state.planets.find((planet) => planet.ownerEmpireId === 'player');
  if (host === undefined || state.endgameFinalObjects === undefined) {
    throw new Error('E2E terminal scenario requires a player host and final-object state.');
  }
  const ids = getCompleteBuildingIds(host.factionId);
  const terminalAt = state.clock.elapsedSeconds;
  const resources = { metal: 1_000, crystal: 750, gas: 500 } as const;
  const project: FinalObjectProject = {
    id: 'final-project-1',
    ownerEmpireId: 'player',
    ownerPlanetId: host.id,
    factionId: host.factionId,
    obeliskBuildingId: ids.galacticObelisk,
    gateBuildingId: ids.supremeGalacticGates,
    participationKind: 'solo',
    participationId: 'player',
    allianceId: null,
    eligibleEmpireIds: ['player'],
    qualification: {
      cycleId: 'e2e-terminal-cycle',
      cycleIndex: 1,
      resolvedAt: Math.max(0, terminalAt - 60),
      score: 1_000,
    },
    phase: 'vulnerable',
    requiredResources: resources,
    contributedResources: resources,
    contributionByEmpire: [{ empireId: 'player', resources }],
    startedAt: Math.max(0, terminalAt - 86_500),
    fundedAt: Math.max(0, terminalAt - 86_450),
    gateQueueItemId: 'e2e-terminal-gate-queue',
    gateCompletesAt: Math.max(0, terminalAt - 86_400),
    vulnerabilityStartedAt: Math.max(0, terminalAt - 86_400),
    stabilizesAt: terminalAt,
  };
  const terminalState: GameState = {
    ...state,
    planets: state.planets.map((planet) =>
      planet.id === host.id
        ? {
            ...planet,
            buildings: [
              ...planet.buildings.filter((building) => building.buildingId !== ids.supremeGalacticGates),
              { buildingId: ids.supremeGalacticGates, level: 1 },
            ],
          }
        : planet,
    ),
    endgameFinalObjects: {
      ...state.endgameFinalObjects,
      activeProjects: [project],
      nextProjectSequence: Math.max(2, state.endgameFinalObjects.nextProjectSequence),
    },
    campaignResult: {
      status: 'terminal',
      winningParticipationKind: 'solo',
      winningParticipationId: 'player',
      winningEmpireIds: ['player'],
      ownerEmpireId: 'player',
      hostPlanetId: host.id,
      terminalAt,
      reason: 'final-gate-stabilized',
    },
  };
  return canonicalizeFixtureState(terminalState);
}

export function createE2eFixtureState(state: GameState): GameState {
  const fixtureElapsedSeconds = Math.max(
    state.clock.elapsedSeconds,
    E2E_SCOUT_COOLDOWN_CEILING_SECONDS,
  );
  const fixtureState = advanceFixtureState(state, fixtureElapsedSeconds);
  const { origin, target } = requireScenarioPlanets(fixtureState);
  const originWithFuel = {
    ...origin,
    economy: {
      ...origin.economy,
      resources: {
        ...origin.economy.resources,
        gas: {
          ...origin.economy.resources.gas,
          amount: Math.max(origin.economy.resources.gas.amount, 1_000_000),
          capacity: Math.max(origin.economy.resources.gas.capacity, 1_000_000),
        },
      },
    },
  };
  const secondaryPlayerPlanet = createSecondaryPlayerPlanet(fixtureState, originWithFuel);
  const fleet: FleetState = {
    id: E2E_FLEET_ID,
    empireId: 'player',
    originPlanetId: origin.id,
    location: { type: 'planet', planetId: origin.id },
    status: 'stationed',
    ships: { 'ship.aegis.spy-probe': 1 },
    cargo: { metal: 0, crystal: 0, gas: 0 },
    speed: 1_000,
    cargoCapacity: 100,
    mission: null,
  };
  const solarWarFleet: FleetState = {
    id: E2E_SOLAR_WAR_FLEET_ID,
    empireId: 'player',
    originPlanetId: origin.id,
    location: { type: 'planet', planetId: origin.id },
    status: 'stationed',
    ships: { 'ship.aegis.fighter': 24 },
    cargo: { metal: 0, crystal: 0, gas: 0 },
    speed: 12,
    cargoCapacity: 2_000,
    mission: null,
  };
  const incomingFleet: FleetState = {
    id: E2E_INCOMING_FLEET_ID,
    empireId: target.ownerEmpireId,
    originPlanetId: target.id,
    location: {
      type: 'transit',
      fromPlanetId: target.id,
      toPlanetId: origin.id,
      departedAt: fixtureElapsedSeconds,
      arrivesAt: fixtureElapsedSeconds + 3_600,
    },
    status: 'outbound',
    ships: { 'ship.aegis.fighter': 3 },
    cargo: { metal: 321, crystal: 654, gas: 987 },
    speed: 12,
    cargoCapacity: 2_000,
    mission: { kind: 'attack', targetPlanetId: origin.id },
  };
  const observation: IntelObservation = {
    id: 'intel-e2e-target',
    observerEmpireId: 'player',
    targetPlanetId: target.id,
    coordinate: target.coordinate,
    observedAt: fixtureElapsedSeconds - E2E_SCOUT_COOLDOWN_CEILING_SECONDS,
    expiresAt: fixtureElapsedSeconds + 86_400,
    detected: false,
    snapshot: {
      planetId: target.id,
      coordinate: target.coordinate,
      name: target.name,
      ownerEmpireId: target.ownerEmpireId ?? 'unknown',
      factionId: target.factionId,
      level: 2,
      resources: {
        metal: target.economy.resources.metal.amount,
        crystal: target.economy.resources.crystal.amount,
        gas: target.economy.resources.gas.amount,
        energyProduced: target.economy.energy.produced,
        energyConsumed: target.economy.energy.consumed,
      },
      defenses: target.inventory.defenses,
      stationedFleets: [],
    },
  };
  const report: BattleReport = {
    id: E2E_REPORT_ID,
    seed: fixtureState.seed,
    resolvedAt: fixtureElapsedSeconds,
    targetPlanetId: target.id,
    targetGalaxyPlanetId: target.galaxyPlanetId,
    targetCoordinate: target.coordinate,
    attackerEmpireId: 'player',
    defenderEmpireId: target.ownerEmpireId ?? 'pirate-neutral',
    winner: 'attacker',
    rounds: [],
    attackerInitial: { 'ship.aegis.death-star': 1 },
    defenderInitial: { 'ship.aegis.fighter': 1 },
    attackerRemaining: { 'ship.aegis.death-star': 1 },
    defenderRemaining: {},
    destruction: {
      attackerContributions: [
        {
          unitId: 'ship.aegis.death-star',
          factionId: 'aegis',
          count: 1,
          weaponLevel: 10,
          chanceBasisPointsPerShip: 300,
          totalChanceBasisPoints: 300,
        },
      ],
      defenderContributions: [],
      defensePopulation: 0,
      rawChanceBasisPoints: 300,
      defenseReductionBasisPoints: 0,
      defenderPlanetDestroyerReductionBasisPoints: 0,
      poliasReductionBasisPoints: 0,
      finalChanceBasisPoints: 300,
      rollBasisPoints: 125,
      blockedReason: null,
      planetDestroyed: true,
    },
    mode: 'pve',
    threatMultiplierPermille: 1_000,
    rewardMultiplierPermille: 1_000,
  };
  const stableBotDecisionAt = fixtureElapsedSeconds + E2E_BOT_IDLE_SECONDS;
  const fleets = [...fixtureState.fleets];
  if (!fleets.some((entry) => entry.id === E2E_FLEET_ID)) fleets.push(fleet);
  if (!fleets.some((entry) => entry.id === E2E_SOLAR_WAR_FLEET_ID)) fleets.push(solarWarFleet);
  if (!fleets.some((entry) => entry.id === E2E_INCOMING_FLEET_ID)) fleets.push(incomingFleet);
  const planetsWithFuel = fixtureState.planets.map(
    (planet) => planet.id === origin.id ? originWithFuel : planet,
  );
  const planets = planetsWithFuel.some((planet) => planet.id === E2E_SECONDARY_PLANET_ID)
    ? planetsWithFuel
    : [...planetsWithFuel, secondaryPlayerPlanet];
  const activeEmpires = new Set(fixtureState.empires);
  const fixture: GameState = {
    ...fixtureState,
    planets,
    fleets,
    intelligence: fixtureState.intelligence.map((entry) =>
      entry.empireId !== 'player' || entry.observations.some((item) => item.id === observation.id)
        ? entry
        : { ...entry, observations: [...entry.observations, observation] },
    ),
    eventLog: fixtureState.eventLog.some((entry) =>
      entry.event.payload.type === 'BATTLE_REPORT' && entry.event.payload.report.id === E2E_REPORT_ID)
      ? fixtureState.eventLog
      : [
          ...fixtureState.eventLog,
          {
            event: {
              id: 'event-e2e-report',
              executeAt: fixtureElapsedSeconds,
              sequence: fixtureState.nextEventSequence + 10_000,
              payload: { type: 'BATTLE_REPORT', report },
            },
            executedAt: fixtureElapsedSeconds,
          },
        ],
    botAutomation: {
      nextDecisionAtByEmpire: Object.fromEntries(
        DEFAULT_BOT_PROFILES
          .filter((profile) => activeEmpires.has(profile.empireId))
          .map((profile) => [
            profile.empireId,
            Math.max(
              fixtureState.botAutomation.nextDecisionAtByEmpire[profile.empireId] ?? 0,
              stableBotDecisionAt,
            ),
          ]),
      ),
    },
  };
  return canonicalizeFixtureState(fixture);
}

export function prepareE2eState(state: GameState): GameState {
  if (!E2E_RUNTIME_ENABLED) return state;
  if (isTerminalFixtureRequested()) {
    const fixture = state.campaignResult?.status === 'terminal'
      ? state
      : createE2eFixtureState(state);
    return createE2eTerminalState(fixture);
  }
  return createE2eFixtureState(state);
}

export function updateE2eRuntimeDiagnostics(state: GameState): void {
  if (!E2E_RUNTIME_ENABLED) return;
  const { target } = requireScenarioPlanets(state);
  document.documentElement.dataset.e2e = 'true';
  document.documentElement.dataset.e2eTargetId = target.id;
  document.documentElement.dataset.e2eTargetGalaxy = String(target.coordinate.galaxy);
  document.documentElement.dataset.e2eTargetSystem = String(target.coordinate.solarSystem);
  document.documentElement.dataset.e2eTargetPosition = String(target.coordinate.position);
  document.documentElement.dataset.e2eSecondaryPlanetId = E2E_SECONDARY_PLANET_ID;
  document.documentElement.dataset.e2eSolarWarFleetId = E2E_SOLAR_WAR_FLEET_ID;
  document.documentElement.dataset.stateChecksum = createStateChecksum(state);
  document.documentElement.dataset.sendFleetCommandCount = String(
    state.commandLog.filter((entry) => entry.command.type === 'SEND_FLEET').length,
  );
  scheduleBotGateDiagnostics();
}
