import { describe, expect, it } from 'vitest';
import type { BotProfile } from '../../src/simulation/bots/profiles';
import {
  POST_ENDGAME_BOT_DECISION_INTERVAL_SECONDS,
  runBotScheduler,
} from '../../src/simulation/bots/scheduler';
import { getBotProgressionPhase } from '../../src/simulation/bots/progressionPhase';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import { getBuildingCatalogForFaction } from '../../src/simulation/factions/factionMechanicalCatalogRegistry';

describe('post-endgame bot cadence', () => {
  it('reduces compressed bot decision frequency after endgame preparation is reached', () => {
    const empireId = 'aegis-bot';
    const initial = createInitialGameState('bot-post-endgame-cadence');
    const roles = getFactionMechanicalRoles('aegis').ships;
    const endgameShips: Readonly<Record<string, number>> = Object.fromEntries(
      [
        roles.scout,
        roles.fighter,
        roles.colonizer,
        roles.frigate,
        roles.dreadnought,
      ].map((unitId) => [unitId, 1]),
    );
    const state = {
      ...initial,
      planets: initial.planets.map((planet) =>
        planet.ownerEmpireId === empireId
          ? {
              ...planet,
              buildings: getBuildingCatalogForFaction('aegis').map((definition) => ({
                buildingId: definition.id,
                level: definition.maxLevel,
              })),
              inventory: {
                ...planet.inventory,
                ships: endgameShips,
              },
            }
          : planet,
      ),
      botAutomation: {
        nextDecisionAtByEmpire: {
          ...initial.botAutomation.nextDecisionAtByEmpire,
          [empireId]: 0,
        },
      },
    };
    const profile: BotProfile = {
      id: 'test.post-endgame-aegis',
      empireId,
      personality: 'industrial',
      difficulty: 'normal',
      decisionIntervalSeconds: 300,
      earlyDecisionIntervalSeconds: 240,
      maxCommandsPerDecision: 1,
    };

    expect(getBotProgressionPhase(state, empireId)).toBe('endgame-preparation');

    const result = runBotScheduler(state, [profile], 1);

    expect(result.processedDecisions).toBe(1);
    expect(result.state.botAutomation.nextDecisionAtByEmpire[empireId]).toBe(
      POST_ENDGAME_BOT_DECISION_INTERVAL_SECONDS,
    );
  });
});
