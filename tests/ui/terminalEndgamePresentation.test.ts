import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import type { FinalObjectProject } from '../../src/simulation/endgame/types';
import { getCompleteBuildingIds } from '../../src/simulation/planet/completeBuildingCatalog';
import type { GameState } from '../../src/simulation/types';
import { createEndgamePanelSummary } from '../../src/ui/endgameOperationsPanel';
import { createEndgameOperationsViewModel } from '../../src/ui/endgameOperationsViewModel';
import {
  createCampaignTerminalPresentation,
  createFinalProjectPresentations,
} from '../../src/ui/endgameTerminalPresentation';
import { createGlobalHudViewModel } from '../../src/ui/globalHudViewModel';
import { createSaveEnvelope, parseSaveJson, serializeSave } from '../../src/storage/saveFormat';

const FULL = { metal: 100, crystal: 80, gas: 60 } as const;

function terminalViewState(seed = 'terminal-ui'): GameState {
  const state = createInitialGameState(seed);
  const host = state.planets.find((planet) => planet.ownerEmpireId === 'player');
  if (host === undefined || state.endgameFinalObjects === undefined) {
    throw new Error('Terminal UI host missing.');
  }
  const ids = getCompleteBuildingIds(host.factionId);
  const project: FinalObjectProject = {
    id: 'ui-final-project',
    ownerEmpireId: 'player',
    ownerPlanetId: host.id,
    factionId: host.factionId,
    obeliskBuildingId: ids.galacticObelisk,
    gateBuildingId: ids.supremeGalacticGates,
    participationKind: 'solo',
    participationId: 'player',
    allianceId: null,
    eligibleEmpireIds: ['player'],
    qualification: { cycleId: 'cycle-ui', cycleIndex: 2, resolvedAt: 0, score: 10 },
    phase: 'vulnerable',
    requiredResources: FULL,
    contributedResources: FULL,
    contributionByEmpire: [{ empireId: 'player', resources: FULL }],
    startedAt: 0,
    fundedAt: 10,
    gateCompletesAt: 20,
    vulnerabilityStartedAt: 20,
    stabilizesAt: 100,
  };
  return {
    ...state,
    clock: { ...state.clock, elapsedSeconds: 100 },
    endgameFinalObjects: {
      ...state.endgameFinalObjects,
      activeProjects: [project],
      nextProjectSequence: 2,
    },
    campaignResult: {
      status: 'terminal',
      winningParticipationKind: 'solo',
      winningParticipationId: 'player',
      winningEmpireIds: ['player'],
      ownerEmpireId: 'player',
      hostPlanetId: host.id,
      terminalAt: 100,
      reason: 'final-gate-stabilized',
    },
  };
}

describe('terminal endgame presentation', () => {
  it('shows project identity, host, funding, deadline and terminal victory without offering gameplay actions', () => {
    const state = terminalViewState();
    const terminal = state.campaignResult;
    if (terminal?.status !== 'terminal') throw new Error('Terminal UI result missing.');
    const host = state.planets.find((planet) => planet.id === terminal.hostPlanetId);
    if (host === undefined) throw new Error('Terminal UI host planet missing.');
    const operations = createEndgameOperationsViewModel(state);
    const project = operations.finalProjects[0];

    expect(operations.terminal).toMatchObject({
      outcome: 'victory',
      outcomeLabel: 'Победа',
      terminalAt: 100,
      ownerEmpireId: 'player',
    });
    expect(project).toMatchObject({
      id: 'ui-final-project',
      hostPlanetId: terminal.hostPlanetId,
      phase: 'vulnerable',
      phaseLabel: 'Уязвимость Врат',
      fundingPercent: 100,
      vulnerabilityDeadline: 100,
      vulnerabilityRemainingSeconds: 0,
      viewerEligible: true,
      terminalWinner: true,
    });
    expect(project?.hostLabel).toContain(host.name);
    expect(operations.canCreateAlliance).toBe(false);
    expect(operations.canLeaveAlliance).toBe(false);
    expect(operations.eligibleFleets).toEqual([]);
    expect(createEndgamePanelSummary(operations, 'solar-war').primaryAction).toBeNull();
    expect(createGlobalHudViewModel(state, terminal.hostPlanetId).terminal?.outcome).toBe('victory');
  });

  it('shows defeat strictly from persisted winningEmpireIds', () => {
    const initial = createInitialGameState('terminal-ui-defeat');
    const winnerHost = initial.planets.find((planet) => planet.ownerEmpireId === 'aegis-bot');
    const playerHost = initial.planets.find((planet) => planet.ownerEmpireId === 'player');
    if (winnerHost === undefined || playerHost === undefined) throw new Error('Terminal UI fixture host missing.');
    const state: GameState = {
      ...initial,
      campaignResult: {
        status: 'terminal',
        winningParticipationKind: 'solo',
        winningParticipationId: 'aegis-bot',
        winningEmpireIds: ['aegis-bot'],
        ownerEmpireId: 'aegis-bot',
        hostPlanetId: winnerHost.id,
        terminalAt: 42,
        reason: 'final-gate-stabilized',
      },
    };
    expect(createCampaignTerminalPresentation(state)?.outcome).toBe('defeat');
    expect(createGlobalHudViewModel(state, playerHost.id).terminal?.outcomeLabel).toBe('Поражение');
  });

  it('reconstructs identical terminal presentation after save/load', () => {
    const state = terminalViewState('terminal-ui-reload');
    const beforeTerminal = createCampaignTerminalPresentation(state);
    const beforeProjects = createFinalProjectPresentations(state);
    const parsed = parseSaveJson(serializeSave(
      createSaveEnvelope('terminal-ui-reload', state, '2026-08-18T00:00:00.000Z'),
    ));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(createCampaignTerminalPresentation(parsed.value.state)).toEqual(beforeTerminal);
    expect(createFinalProjectPresentations(parsed.value.state)).toEqual(beforeProjects);
  });
});
