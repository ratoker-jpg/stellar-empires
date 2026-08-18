import { describe, expect, it } from 'vitest';
import { createBotEndgamePerception } from '../../src/simulation/bots/endgamePerception';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import type { FinalObjectProject } from '../../src/simulation/endgame/types';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';

function createEndgameFixture() {
  const state = createInitialGameState('bot-endgame-perception');
  const playerPlanet = state.planets.find((planet) => planet.ownerEmpireId === 'player');
  expect(playerPlanet).toBeDefined();
  if (playerPlanet === undefined) throw new Error('Expected player planet.');

  const roles = getFactionMechanicalRoles(playerPlanet.factionId);
  const project: FinalObjectProject = {
    id: 'final-project-public',
    ownerEmpireId: 'player',
    ownerPlanetId: playerPlanet.id,
    factionId: playerPlanet.factionId,
    obeliskBuildingId: roles.buildings.complete.galacticObelisk,
    gateBuildingId: roles.buildings.complete.supremeGalacticGates,
    participationKind: 'alliance',
    participationId: 'alliance-1',
    allianceId: 'alliance-1',
    eligibleEmpireIds: ['player', 'synod-bot'],
    qualification: {
      cycleId: 'solar-war-cycle-1',
      cycleIndex: 1,
      resolvedAt: 100,
      score: 1,
    },
    phase: 'vulnerable',
    requiredResources: { metal: 100, crystal: 80, gas: 60 },
    contributedResources: { metal: 100, crystal: 80, gas: 60 },
    contributionByEmpire: [
      {
        empireId: 'player',
        resources: { metal: 60, crystal: 50, gas: 40 },
      },
      {
        empireId: 'synod-bot',
        resources: { metal: 40, crystal: 30, gas: 20 },
      },
    ],
    startedAt: 110,
    fundedAt: 120,
    gateCompletesAt: 130,
    vulnerabilityStartedAt: 130,
    stabilizesAt: 86_530,
  };

  const endgameParticipation = state.endgameParticipation;
  const endgameFinalObjects = state.endgameFinalObjects;
  expect(endgameParticipation).toBeDefined();
  expect(endgameFinalObjects).toBeDefined();
  if (endgameParticipation === undefined || endgameFinalObjects === undefined) {
    throw new Error('Expected migrated endgame state.');
  }

  return {
    playerPlanet,
    state: {
      ...state,
      endgameParticipation: {
        ...endgameParticipation,
        alliances: [{
          id: 'alliance-1',
          name: 'Public Alliance',
          founderEmpireId: 'player',
          createdAt: 90,
        }],
        participants: endgameParticipation.participants.map((participant) =>
          participant.empireId === 'player' || participant.empireId === 'synod-bot'
            ? { ...participant, allianceId: 'alliance-1', joinedAt: 90 }
            : participant,
        ),
      },
      endgameFinalObjects: {
        ...endgameFinalObjects,
        activeProjects: [project],
      },
    },
  };
}

describe('bot endgame perception', () => {
  it('keeps public project facts separate from cohort-only funding detail', () => {
    const { state } = createEndgameFixture();

    const allied = createBotEndgamePerception(state, 'synod-bot');
    const outsider = createBotEndgamePerception(state, 'veyra-bot');

    expect(allied.publicAlliances).toEqual([{
      id: 'alliance-1',
      name: 'Public Alliance',
      founderEmpireId: 'player',
      createdAt: 90,
      memberEmpireIds: ['player', 'synod-bot'],
    }]);
    expect(allied.ownParticipation).toMatchObject({
      empireId: 'synod-bot',
      allianceId: 'alliance-1',
    });

    expect(allied.publicFinalProjects).toEqual([{
      id: 'final-project-public',
      ownerEmpireId: 'player',
      ownerPlanetId: expect.any(String),
      factionId: expect.any(String),
      participationKind: 'alliance',
      participationId: 'alliance-1',
      allianceId: 'alliance-1',
      phase: 'vulnerable',
      startedAt: 110,
      vulnerabilityStartedAt: 130,
      stabilizesAt: 86_530,
    }]);
    expect(allied.publicFinalProjects[0]).not.toHaveProperty('requiredResources');
    expect(allied.publicFinalProjects[0]).not.toHaveProperty('contributionByEmpire');

    expect(allied.eligibleFinalProjects).toHaveLength(1);
    expect(allied.eligibleFinalProjects[0]).toMatchObject({
      requiredResources: { metal: 100, crystal: 80, gas: 60 },
      contributedResources: { metal: 100, crystal: 80, gas: 60 },
      eligibleEmpireIds: ['player', 'synod-bot'],
    });
    expect(outsider.publicFinalProjects).toEqual(allied.publicFinalProjects);
    expect(outsider.eligibleFinalProjects).toEqual([]);
  });

  it('is invariant to hidden foreign economy and inventory changes', () => {
    const { state, playerPlanet } = createEndgameFixture();
    const before = createBotEndgamePerception(state, 'veyra-bot');
    const changed = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.id === playerPlanet.id
          ? {
              ...planet,
              economy: {
                ...planet.economy,
                resources: {
                  ...planet.economy.resources,
                  metal: { ...planet.economy.resources.metal, amount: 999_999 },
                  crystal: { ...planet.economy.resources.crystal, amount: 888_888 },
                },
              },
              inventory: {
                ships: { ...planet.inventory.ships, 'ship.aegis.fighter': 999 },
                defenses: { ...planet.inventory.defenses, 'defense.aegis.rocket-turret': 999 },
              },
            }
          : planet,
      ),
    };

    expect(createBotEndgamePerception(changed, 'veyra-bot')).toEqual(before);
  });

  it('exposes the persisted terminal result as a public endgame fact', () => {
    const { state, playerPlanet } = createEndgameFixture();
    const terminal = {
      ...state,
      campaignResult: {
        status: 'terminal' as const,
        winningParticipationKind: 'alliance' as const,
        winningParticipationId: 'alliance-1',
        winningEmpireIds: ['player', 'synod-bot'],
        ownerEmpireId: 'player',
        hostPlanetId: playerPlanet.id,
        terminalAt: 86_530,
        reason: 'final-gate-stabilized' as const,
      },
    };

    expect(createBotEndgamePerception(terminal, 'veyra-bot').campaignResult).toEqual(
      terminal.campaignResult,
    );
  });
});
