import { describe, expect, it } from 'vitest';
import { advanceCampaignTime } from '../../src/simulation/campaign/time';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  applyFinalGateStabilization,
  getCampaignOutcomeForEmpire,
} from '../../src/simulation/endgame/campaignResult';
import { FINAL_GATE_STABILIZATION_SECONDS } from '../../src/simulation/endgame/finalGateVulnerability';
import type { FinalObjectProject } from '../../src/simulation/endgame/types';
import { getCompleteBuildingIds } from '../../src/simulation/planet/completeBuildingCatalog';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameCommand, GameState, ScheduledGameEvent } from '../../src/simulation/types';
import { createSaveEnvelope, parseSaveJson, serializeSave } from '../../src/storage/saveFormat';

const FULL = { metal: 100, crystal: 80, gas: 60 } as const;
const ZERO = { metal: 0, crystal: 0, gas: 0 } as const;

function vulnerableFixture(seed = 'terminal-campaign') {
  const initial = createInitialGameState(seed);
  const host = initial.planets.find((planet) => planet.ownerEmpireId === 'player');
  if (host === undefined || initial.endgameFinalObjects === undefined) {
    throw new Error('Terminal fixture host missing.');
  }
  const ids = getCompleteBuildingIds(host.factionId);
  const queueItemId = 'build-terminal-gate';
  const completesAt = initial.clock.elapsedSeconds + 5;
  const project: FinalObjectProject = {
    id: 'terminal-project-1',
    ownerEmpireId: 'player',
    ownerPlanetId: host.id,
    factionId: host.factionId,
    obeliskBuildingId: ids.galacticObelisk,
    gateBuildingId: ids.supremeGalacticGates,
    participationKind: 'solo',
    participationId: 'player',
    allianceId: null,
    eligibleEmpireIds: ['player'],
    qualification: { cycleId: 'cycle-terminal', cycleIndex: 1, resolvedAt: 0, score: 1 },
    phase: 'building',
    requiredResources: FULL,
    contributedResources: FULL,
    contributionByEmpire: [{ empireId: 'player', resources: FULL }],
    startedAt: 0,
    fundedAt: 0,
    gateQueueItemId: queueItemId,
    gateCompletesAt: completesAt,
  };
  const completion: ScheduledGameEvent = {
    id: `event-${initial.nextEventSequence}`,
    executeAt: completesAt,
    sequence: initial.nextEventSequence,
    payload: {
      type: 'BUILDING_COMPLETE',
      planetId: host.id,
      queueItemId,
      buildingId: ids.supremeGalacticGates,
      targetLevel: 1,
    },
  };
  const building: GameState = {
    ...initial,
    planets: initial.planets.map((planet) =>
      planet.id === host.id
        ? {
            ...planet,
            buildQueue: [{
              id: queueItemId,
              buildingId: ids.supremeGalacticGates,
              targetLevel: 1,
              startedAt: 0,
              completesAt,
              cost: ZERO,
            }],
          }
        : planet,
    ),
    endgameFinalObjects: {
      ...initial.endgameFinalObjects,
      activeProjects: [project],
      nextProjectSequence: 2,
    },
    pendingEvents: [completion],
    nextEventSequence: initial.nextEventSequence + 1,
  };
  const completed = executeCommand(building, { type: 'ADVANCE_TIME', seconds: 5 });
  if (!completed.ok) throw new Error(completed.message);
  const vulnerable = completed.value.endgameFinalObjects?.activeProjects[0];
  if (vulnerable?.phase !== 'vulnerable' || vulnerable.stabilizesAt === undefined) {
    throw new Error('Terminal fixture did not enter vulnerability.');
  }
  return { state: completed.value, project: vulnerable };
}

function stabilize(seed = 'terminal-stabilize') {
  const fixture = vulnerableFixture(seed);
  const remaining = fixture.project.stabilizesAt! - fixture.state.clock.elapsedSeconds;
  const result = advanceCampaignTime(fixture.state, remaining, {
    operationBudget: 50_000,
    botProfiles: [],
  });
  const terminal = result.state.campaignResult;
  if (terminal?.status !== 'terminal') throw new Error('Fixture did not terminate.');
  return { ...fixture, result, terminal, remaining };
}

function terminalCommands(): readonly GameCommand[] {
  const empireId = 'player';
  const planetId = 'missing-planet';
  const fleetId = 'missing-fleet';
  return [
    { type: 'ADVANCE_TIME', seconds: 1 },
    { type: 'SCHEDULE_EVENT', executeAt: 1, payload: { type: 'NOOP', label: 'terminal' } },
    { type: 'CREATE_ALLIANCE', empireId, name: 'Terminal Union' },
    { type: 'JOIN_ALLIANCE', empireId, allianceId: 'missing-alliance' },
    { type: 'LEAVE_ALLIANCE', empireId },
    { type: 'START_FINAL_OBJECT_PROJECT', empireId, planetId },
    { type: 'CONTRIBUTE_FINAL_OBJECT_PROJECT', empireId, projectId: 'missing-project', sourcePlanetId: planetId, resources: ZERO },
    { type: 'CANCEL_FINAL_OBJECT_PROJECT', empireId, projectId: 'missing-project' },
    { type: 'QUEUE_BUILDING', empireId, planetId, buildingId: 'missing-building' },
    { type: 'CANCEL_BUILDING', empireId, planetId, queueItemId: 'missing-queue' },
    { type: 'SET_PLANET_SPECIALIZATION', empireId, planetId, specializationId: 'missing' as never },
    { type: 'SET_PLANET_DEVELOPMENT_TEMPLATE', empireId, planetId, developmentTemplateId: 'missing' as never },
    { type: 'CREATE_LOGISTICS_ROUTE', empireId, originPlanetId: planetId, targetPlanetId: 'other', resourceId: 'metal', amountPerTrip: 1, originReserve: 0, intervalSeconds: 60, priority: 1 },
    { type: 'UPDATE_LOGISTICS_ROUTE', empireId, routeId: 'missing-route', amountPerTrip: 2 },
    { type: 'DELETE_LOGISTICS_ROUTE', empireId, routeId: 'missing-route' },
    { type: 'MARKET_SWAP', empireId, planetId, giveResourceId: 'metal', receiveResourceId: 'crystal', giveAmount: 1 },
    { type: 'QUEUE_RESEARCH', empireId, planetId, technologyId: 'missing-tech' },
    { type: 'CANCEL_RESEARCH', empireId, queueItemId: 'missing-queue' },
    { type: 'QUEUE_UNIT_BATCH', empireId, planetId, unitId: 'missing-unit', quantity: 1 },
    { type: 'CANCEL_UNIT_BATCH', empireId, planetId, queueItemId: 'missing-queue' },
    { type: 'QUEUE_DEFENSE_REPAIR', empireId, planetId, unitId: 'missing-unit', quantity: 1 },
    { type: 'CANCEL_DEFENSE_REPAIR', empireId, planetId, queueItemId: 'missing-queue' },
    { type: 'QUEUE_SHIP_UPGRADE', empireId, planetId, unitId: 'missing-unit', track: 'weapon' as never },
    { type: 'CANCEL_SHIP_UPGRADE', empireId, queueItemId: 'missing-queue' },
    { type: 'CREATE_FLEET', empireId, planetId, ships: {}, cargo: ZERO },
    { type: 'DISBAND_FLEET', empireId, fleetId },
    { type: 'SET_FLEET_COMBAT_DOCTRINE', empireId, fleetId, formation: 'balanced' as never, targetPriority: 'balanced' as never },
    { type: 'SET_COMMAND_DOCTRINE', empireId, doctrineId: 'balanced' as never },
    { type: 'ASSIGN_FLAGSHIP', empireId, fleetId },
    { type: 'SEND_FLEET', empireId, fleetId, targetPlanetId: planetId, mission: 'attack' as never },
    { type: 'START_EXPEDITION', empireId, fleetId, targetGalaxyPlanetId: planetId },
    { type: 'START_SPACE_OBJECT_MISSION', empireId, fleetId, objectId: 'missing-object' },
    { type: 'ENTER_ARENA_CHALLENGE', empireId, fleetId, challengeId: 'missing-challenge' },
    { type: 'WITHDRAW_ARENA_ENTRY', empireId, entryId: 'missing-entry' },
    { type: 'ENTER_SOLAR_WAR', empireId, fleetId },
    { type: 'RECALL_FLEET', empireId, fleetId },
  ];
}

describe('terminal campaign contract', () => {
  it('valid stabilization writes the immutable exact terminal result and cohort outcome once', () => {
    const { state, project, result, terminal } = stabilize('terminal-result');
    expect(result.complete).toBe(true);
    expect(state.clock.elapsedSeconds).toBe(terminal.terminalAt);
    expect(terminal).toEqual({
      status: 'terminal',
      winningParticipationKind: 'solo',
      winningParticipationId: 'player',
      winningEmpireIds: ['player'],
      ownerEmpireId: 'player',
      hostPlanetId: project.ownerPlanetId,
      terminalAt: project.stabilizesAt,
      reason: 'final-gate-stabilized',
    });
    expect(getCampaignOutcomeForEmpire(state, 'player')).toBe('victory');
    expect(getCampaignOutcomeForEmpire(state, 'aegis-bot')).toBe('defeat');

    const replayed = applyFinalGateStabilization(state, {
      id: 'replayed-stabilization',
      executeAt: terminal.terminalAt,
      sequence: state.nextEventSequence,
      payload: { type: 'FINAL_GATE_STABILIZE', projectId: project.id },
    });
    expect(replayed).toBe(state);
    expect(replayed.campaignResult).toBe(terminal);
  });

  it('keeps stale stabilization inert', () => {
    const fixture = vulnerableFixture('terminal-stale');
    const staleState: GameState = {
      ...fixture.state,
      endgameFinalObjects: {
        ...fixture.state.endgameFinalObjects!,
        activeProjects: [{
          ...fixture.project,
          phase: 'funding',
          vulnerabilityStartedAt: undefined,
          stabilizesAt: undefined,
        }],
      },
    };
    const remaining = fixture.project.stabilizesAt! - staleState.clock.elapsedSeconds;
    const result = advanceCampaignTime(staleState, remaining, {
      operationBudget: 50_000,
      botProfiles: [],
    });
    expect(result.state.campaignResult?.status).toBe('ongoing');
    expect(result.state.clock.elapsedSeconds).toBe(fixture.project.stabilizesAt);
    expect(result.state.pendingEvents.some((event) => event.payload.type === 'FINAL_GATE_STABILIZE')).toBe(false);
  });

  it('stops same-second processing immediately after stabilization and preserves later evidence', () => {
    const fixture = vulnerableFixture('terminal-order');
    const stabilization = fixture.state.pendingEvents.find((event) => event.payload.type === 'FINAL_GATE_STABILIZE');
    if (stabilization === undefined) throw new Error('Stabilization event missing.');
    const marker: ScheduledGameEvent = {
      id: 'terminal-same-second-marker',
      executeAt: stabilization.executeAt,
      sequence: fixture.state.nextEventSequence,
      payload: { type: 'MARKER', marker: 'must-remain-inert' },
    };
    const state: GameState = {
      ...fixture.state,
      pendingEvents: [...fixture.state.pendingEvents, marker],
      nextEventSequence: fixture.state.nextEventSequence + 1,
    };
    const result = advanceCampaignTime(
      state,
      stabilization.executeAt - state.clock.elapsedSeconds,
      { operationBudget: 50_000, botProfiles: [] },
    );
    expect(result.state.campaignResult?.status).toBe('terminal');
    expect(result.state.clock.elapsedSeconds).toBe(stabilization.executeAt);
    expect(result.state.pendingEvents).toContainEqual(marker);
    expect(result.state.eventLog.some((entry) => entry.event.id === marker.id)).toBe(false);
  });

  it('rejects every gameplay command family with CAMPAIGN_TERMINAL', () => {
    const { state } = stabilize('terminal-commands');
    for (const command of terminalCommands()) {
      const result = executeCommand(state, command);
      expect(result.ok, command.type).toBe(false);
      if (!result.ok) expect(result.code, command.type).toBe('CAMPAIGN_TERMINAL');
    }
  });

  it('zero-steps an already-terminal higher-level advance and leaves all future systems frozen', () => {
    const { state } = stabilize('terminal-zero-step');
    const result = advanceCampaignTime(state, 86_400, { operationBudget: 50_000 });
    expect(result.complete).toBe(true);
    expect(result.processedGameSeconds).toBe(0);
    expect(result.remainingGameSeconds).toBe(0);
    expect(result.operationsProcessed).toBe(0);
    expect(result.state).toBe(state);
    expect(result.state.clock).toBe(state.clock);
    expect(result.state.pendingEvents).toBe(state.pendingEvents);
    expect(result.state.logisticsRoutes).toBe(state.logisticsRoutes);
    expect(result.state.worldEvents).toBe(state.worldEvents);
    expect(result.state.botAutomation).toBe(state.botAutomation);
    expect(result.state.fleets).toBe(state.fleets);
  });

  it('freezes at the exact terminal second when stabilization lands midway through a request', () => {
    const fixture = vulnerableFixture('terminal-midway');
    const untilTerminal = fixture.project.stabilizesAt! - fixture.state.clock.elapsedSeconds;
    const result = advanceCampaignTime(fixture.state, untilTerminal + 1_000, {
      operationBudget: 50_000,
      botProfiles: [],
    });
    expect(result.state.campaignResult?.status).toBe('terminal');
    expect(result.state.clock.elapsedSeconds).toBe(fixture.project.stabilizesAt);
    expect(result.processedGameSeconds).toBe(untilTerminal);
    expect(result.remainingGameSeconds).toBe(1_000);
  });

  it('round-trips exact terminal state and preserves direct/chunk partition equality', () => {
    const fixture = vulnerableFixture('terminal-save-partition');
    const remaining = fixture.project.stabilizesAt! - fixture.state.clock.elapsedSeconds;
    const direct = advanceCampaignTime(fixture.state, remaining, {
      operationBudget: 50_000,
      botProfiles: [],
    });
    const firstSeconds = Math.floor(remaining / 2);
    const first = advanceCampaignTime(fixture.state, firstSeconds, {
      operationBudget: 50_000,
      botProfiles: [],
    });
    const second = advanceCampaignTime(first.state, remaining - first.processedGameSeconds, {
      operationBudget: 50_000,
      botProfiles: [],
    });
    expect(second.state).toEqual(direct.state);

    const envelope = createSaveEnvelope('terminal-save', direct.state, '2026-08-18T00:00:00.000Z');
    const parsed = parseSaveJson(serializeSave(envelope));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.state).toEqual(direct.state);
    expect(parsed.value.state.campaignResult).toEqual(direct.state.campaignResult);
  });

  it('uses the canonical 24-hour vulnerability duration without regressing #159', () => {
    const fixture = vulnerableFixture('terminal-vulnerability-regression');
    expect(fixture.project.stabilizesAt! - fixture.project.vulnerabilityStartedAt!).toBe(
      FINAL_GATE_STABILIZATION_SECONDS,
    );
    expect(FINAL_GATE_STABILIZATION_SECONDS).toBe(86_400);
  });
});
