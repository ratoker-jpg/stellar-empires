import { createStateChecksum } from '../simulation/checksum';
import { createInitialGameState } from '../simulation/createInitialGameState';
import { getFactionMechanicalRoles } from '../simulation/factions/factionMechanicalRoles';
import type { MissionAvailabilityCode } from '../simulation/fleets/missionRules';
import type { FleetState } from '../simulation/fleets/types';
import { getEmpireIntelligence } from '../simulation/intelligence/intelligenceState';
import { executeCommand } from '../simulation/reducer';
import type { GameCommand, GameState } from '../simulation/types';
import { planBotFleetMission, type BotFleetReasonCode } from '../simulation/bots/fleetMissionPlanner';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../storage/saveFormat';

export const BOT_GATE_EMPIRE_ID = 'aegis-bot';
export const BOT_GATE_SCOUT_FLEET_ID = 'fleet-e2e-bot-scout';
export const BOT_GATE_STRIKE_FLEET_ID = 'fleet-e2e-bot-strike';
const FIXED_SAVE_TIME = '2026-07-27T20:00:00.000Z';
const ZERO_CARGO = { metal: 0, crystal: 0, gas: 0 } as const;

export interface OrdinaryMissionIntelligenceGateResult {
  readonly scoutReasonCode: BotFleetReasonCode;
  readonly scoutAvailabilityCode: MissionAvailabilityCode | null;
  readonly attackReasonCode: BotFleetReasonCode;
  readonly attackAvailabilityCode: MissionAvailabilityCode | null;
  readonly observationLevel: 1 | 2 | 3;
  readonly observationDetected: boolean;
  readonly schemaVersion: number;
  readonly finalChecksum: string;
}

function requireCommand(
  state: GameState,
  command: GameCommand | null,
  phase: string,
): GameState {
  if (command === null) throw new Error(`${phase} did not produce a command.`);
  const result = executeCommand(state, command);
  if (!result.ok) throw new Error(`${phase} was rejected: ${result.code} ${result.message}`);
  return result.value;
}

function advanceToFleetEvent(
  state: GameState,
  fleetId: string,
  type: 'FLEET_ARRIVE' | 'FLEET_RETURN',
): GameState {
  const event = state.pendingEvents.find(
    (candidate) =>
      candidate.payload.type === type && candidate.payload.fleetId === fleetId,
  );
  if (event === undefined) return state;
  const seconds = Math.max(0, event.executeAt - state.clock.elapsedSeconds);
  return requireCommand(state, { type: 'ADVANCE_TIME', seconds }, `advance ${type}`);
}

export function createOrdinaryMissionIntelligenceGateFixture(seedSource: string): GameState {
  const state = createInitialGameState(seedSource, 'aegis', 'test');
  const origin = state.planets.find((planet) => planet.ownerEmpireId === BOT_GATE_EMPIRE_ID);
  const target = state.planets.find((planet) => planet.ownerEmpireId === 'player');
  if (origin === undefined || target === undefined) {
    throw new Error('Bot gate fixture requires Aegis bot and player colonies.');
  }
  const roles = getFactionMechanicalRoles('aegis');
  const richOrigin = {
    ...origin,
    economy: {
      ...origin.economy,
      resources: {
        ...origin.economy.resources,
        gas: {
          ...origin.economy.resources.gas,
          amount: 10_000_000,
          capacity: 10_000_000,
        },
      },
    },
    inventory: { ships: {}, defenses: {} },
  };
  const emptyTarget = {
    ...target,
    buildings: target.buildings.filter(
      (building) => building.buildingId !== getFactionMechanicalRoles(target.factionId).buildings.sensorGrid,
    ),
    inventory: { ships: {}, defenses: {} },
  };
  const scout: FleetState = {
    id: BOT_GATE_SCOUT_FLEET_ID,
    empireId: BOT_GATE_EMPIRE_ID,
    originPlanetId: origin.id,
    location: { type: 'planet', planetId: origin.id },
    status: 'stationed',
    ships: { [roles.ships.scout]: 1 },
    cargo: ZERO_CARGO,
    speed: 1_000,
    cargoCapacity: 100,
    mission: null,
  };
  const strike: FleetState = {
    id: BOT_GATE_STRIKE_FLEET_ID,
    empireId: BOT_GATE_EMPIRE_ID,
    originPlanetId: origin.id,
    location: { type: 'planet', planetId: origin.id },
    status: 'stationed',
    ships: { [roles.ships.fighter]: 20 },
    cargo: ZERO_CARGO,
    speed: 1_000,
    cargoCapacity: 600,
    mission: null,
  };

  return {
    ...state,
    planets: [richOrigin, emptyTarget],
    fleets: [scout, strike],
    research: state.research.map((research) => {
      if (research.empireId === BOT_GATE_EMPIRE_ID) {
        return {
          ...research,
          levels: { ...research.levels, [roles.research.sensors]: 10 },
          queue: [],
        };
      }
      if (research.empireId === 'player') {
        const playerRoles = getFactionMechanicalRoles(target.factionId);
        return {
          ...research,
          levels: { ...research.levels, [playerRoles.research.sensors]: 0 },
          queue: [],
        };
      }
      return { ...research, queue: [] };
    }),
    intelligence: state.intelligence.map((entry) => ({
      ...entry,
      observations: [],
      alerts: [],
    })),
    debrisFields: [],
    logisticsRoutes: [],
    pendingEvents: [],
    commandLog: [],
    eventLog: [],
    worldEvents: { ...state.worldEvents, active: [], history: [] },
    nextEventSequence: 0,
  };
}

export function runOrdinaryMissionIntelligenceGate(
  seedSource: string,
): OrdinaryMissionIntelligenceGateResult {
  let state = createOrdinaryMissionIntelligenceGateFixture(seedSource);
  const scoutPlan = planBotFleetMission(state, BOT_GATE_EMPIRE_ID);
  if (scoutPlan.reasonCode !== 'mission-scout-selected') {
    throw new Error(`Expected scout plan, received ${scoutPlan.reasonCode}.`);
  }
  state = requireCommand(state, scoutPlan.command, 'scout dispatch');
  state = advanceToFleetEvent(state, BOT_GATE_SCOUT_FLEET_ID, 'FLEET_ARRIVE');
  state = advanceToFleetEvent(state, BOT_GATE_SCOUT_FLEET_ID, 'FLEET_RETURN');

  const targetId = state.planets.find((planet) => planet.ownerEmpireId === 'player')?.id;
  const observation = getEmpireIntelligence(state.intelligence, BOT_GATE_EMPIRE_ID)
    ?.observations.find((candidate) => candidate.targetPlanetId === targetId);
  if (observation === undefined) throw new Error('Scout observation was not recorded.');
  if (observation.snapshot.level !== 3) {
    throw new Error(`Expected level-three intelligence, received ${observation.snapshot.level}.`);
  }

  const saved = createSaveEnvelope('bot-gate', state, FIXED_SAVE_TIME);
  const parsed = parseSaveJson(serializeSave(saved));
  if (!parsed.ok) throw new Error(`Bot gate save failed: ${parsed.code}.`);
  state = parsed.value.state;

  const attackPlan = planBotFleetMission(state, BOT_GATE_EMPIRE_ID);
  if (attackPlan.reasonCode !== 'mission-attack-selected') {
    throw new Error(`Expected attack plan, received ${attackPlan.reasonCode}.`);
  }
  state = requireCommand(state, attackPlan.command, 'attack dispatch');

  return {
    scoutReasonCode: scoutPlan.reasonCode,
    scoutAvailabilityCode: scoutPlan.availabilityCode,
    attackReasonCode: attackPlan.reasonCode,
    attackAvailabilityCode: attackPlan.availabilityCode,
    observationLevel: observation.snapshot.level,
    observationDetected: observation.detected,
    schemaVersion: state.schemaVersion,
    finalChecksum: createStateChecksum(state),
  };
}
