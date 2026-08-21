import { describe, expect, it } from 'vitest';
import { getBotPhaseProductionTargets } from '../../src/simulation/bots/progressionPriorities';
import { createCampaignSettings } from '../../src/simulation/campaign/settings';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';

describe('POST-1.0-PR1 organic late-game closure', () => {
  it('requires compressed late-game production to request the canonical Planet Destroyer', () => {
    const state = createInitialGameState('post-1.0-pr1-production-regression', {
      campaignSettings: createCampaignSettings({
        scenarioPreset: 'campaign',
        worldSpeed: 2,
        progressionProfile: 'compressed-v1',
        createdAtReal: '2026-08-21T00:00:00.000Z',
      }),
    });
    const planetDestroyerId = getFactionMechanicalRoles('aegis').ships.dreadnought;

    expect(
      getBotPhaseProductionTargets(state, 'aegis-bot', 'heavy-fleet', false),
    ).toContainEqual({
      unitId: planetDestroyerId,
      quantity: 1,
      desiredTotal: 1,
    });
  });
});
