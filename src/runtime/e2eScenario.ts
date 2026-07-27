import { createStateChecksum } from '../simulation/checksum';
import type { BattleReport } from '../simulation/combat/types';
import type { FleetState } from '../simulation/fleets/types';
import type { IntelObservation } from '../simulation/intelligence/types';
import type { GameState } from '../simulation/types';

export const E2E_RUNTIME_ENABLED = import.meta.env.VITE_E2E === '1';
export const E2E_FLEET_ID = 'fleet-e2e-player';
export const E2E_REPORT_ID = 'report-e2e-map-backlink';
const E2E_BOT_IDLE_SECONDS = 86_400;

function requireScenarioPlanets(state: GameState) {
  const origin = state.planets.find((planet) => planet.ownerEmpireId === 'player');
  const target = state.planets.find((planet) => planet.ownerEmpireId === 'pirate-neutral')
    ?? state.planets.find((planet) => planet.ownerEmpireId !== 'player');
  if (origin === undefined || target === undefined) {
    throw new Error('E2E scenario requires one player colony and one foreign colony.');
  }
  return { origin, target };
}

export function createE2eFixtureState(state: GameState): GameState {
  const { origin, target } = requireScenarioPlanets(state);
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
  const fleet: FleetState = {
    id: E2E_FLEET_ID,
    empireId: 'player',
    originPlanetId: origin.id,
    location: { type: 'planet', planetId: origin.id },
    status: 'stationed',
    ships: {
      'ship.aegis.spy-probe': 1,
      'ship.aegis.fighter': 3,
    },
    cargo: { metal: 0, crystal: 0, gas: 0 },
    speed: 1_000,
    cargoCapacity: 100,
    mission: null,
  };
  const observation: IntelObservation = {
    id: 'intel-e2e-target',
    observerEmpireId: 'player',
    targetPlanetId: target.id,
    coordinate: target.coordinate,
    observedAt: state.clock.elapsedSeconds,
    expiresAt: state.clock.elapsedSeconds + 86_400,
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
    seed: state.seed,
    resolvedAt: state.clock.elapsedSeconds,
    targetPlanetId: target.id,
    attackerEmpireId: 'player',
    defenderEmpireId: target.ownerEmpireId ?? 'pirate-neutral',
    winner: 'attacker',
    rounds: [],
    attackerInitial: { 'ship.aegis.fighter': 3 },
    defenderInitial: { 'ship.aegis.fighter': 1 },
    attackerRemaining: { 'ship.aegis.fighter': 3 },
    defenderRemaining: {},
    mode: 'pve',
    threatMultiplierPermille: 1_000,
    rewardMultiplierPermille: 1_000,
  };
  const playerIntel = state.intelligence.find((entry) => entry.empireId === 'player');
  const stableBotDecisionAt = state.clock.elapsedSeconds + E2E_BOT_IDLE_SECONDS;
  return {
    ...state,
    planets: state.planets.map((planet) => planet.id === origin.id ? originWithFuel : planet),
    fleets: state.fleets.some((entry) => entry.id === E2E_FLEET_ID)
      ? state.fleets
      : [...state.fleets, fleet],
    intelligence: state.intelligence.map((entry) =>
      entry.empireId !== 'player' || entry.observations.some((item) => item.id === observation.id)
        ? entry
        : { ...entry, observations: [...entry.observations, observation] },
    ),
    eventLog: state.eventLog.some((entry) =>
      entry.event.payload.type === 'BATTLE_REPORT' && entry.event.payload.report.id === E2E_REPORT_ID)
      ? state.eventLog
      : [
          ...state.eventLog,
          {
            event: {
              id: 'event-e2e-report',
              executeAt: state.clock.elapsedSeconds,
              sequence: state.nextEventSequence + 10_000,
              payload: { type: 'BATTLE_REPORT', report },
            },
            executedAt: state.clock.elapsedSeconds,
          },
        ],
    botAutomation: {
      nextDecisionAtByEmpire: Object.fromEntries(
        Object.entries(state.botAutomation.nextDecisionAtByEmpire).map(
          ([empireId, nextDecisionAt]) => [
            empireId,
            Math.max(nextDecisionAt, stableBotDecisionAt),
          ],
        ),
      ),
    },
    ...(playerIntel === undefined ? {} : {}),
  };
}

export function prepareE2eState(state: GameState): GameState {
  return E2E_RUNTIME_ENABLED ? createE2eFixtureState(state) : state;
}

export function updateE2eRuntimeDiagnostics(state: GameState): void {
  if (!E2E_RUNTIME_ENABLED) return;
  const { target } = requireScenarioPlanets(state);
  document.documentElement.dataset.e2e = 'true';
  document.documentElement.dataset.e2eTargetId = target.id;
  document.documentElement.dataset.e2eTargetGalaxy = String(target.coordinate.galaxy);
  document.documentElement.dataset.e2eTargetSystem = String(target.coordinate.solarSystem);
  document.documentElement.dataset.e2eTargetPosition = String(target.coordinate.position);
  document.documentElement.dataset.stateChecksum = createStateChecksum(state);
  document.documentElement.dataset.sendFleetCommandCount = String(
    state.commandLog.filter((entry) => entry.command.type === 'SEND_FLEET').length,
  );
}
