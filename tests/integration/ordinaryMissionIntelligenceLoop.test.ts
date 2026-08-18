import { describe, expect, it } from 'vitest';
import {
  createOrdinaryMissionIntelligenceGateFixture,
  runOrdinaryMissionIntelligenceGate,
} from '../../src/testing/e2eRuntime';
import { planBotFleetMission } from '../../src/simulation/bots/fleetMissionPlanner';

const SEED = 'ordinary-mission-intelligence-loop';

describe('ordinary mission intelligence integration gate', () => {
  it('runs a deterministic scout to saved full intelligence to attack loop', () => {
    const first = runOrdinaryMissionIntelligenceGate(SEED);
    const second = runOrdinaryMissionIntelligenceGate(SEED);
    expect(first).toEqual(second);
    expect(first).toMatchObject({
      scoutReasonCode: 'mission-scout-selected',
      scoutAvailabilityCode: null,
      attackReasonCode: 'mission-attack-selected',
      attackAvailabilityCode: null,
      observationLevel: 3,
      schemaVersion: 19,
    });
    expect(first.finalChecksum).toMatch(/^[0-9a-f]{8}$/);
  });

  it('does not change the initial bot decision when hidden target resources change', () => {
    const state = createOrdinaryMissionIntelligenceGateFixture(`${SEED}-hidden`);
    const target = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    const changed = {
      ...state,
      planets: state.planets.map((planet) =>
        planet.id === target.id
          ? {
              ...planet,
              economy: {
                ...planet.economy,
                resources: {
                  ...planet.economy.resources,
                  metal: { ...planet.economy.resources.metal, amount: 999_999 },
                },
              },
            }
          : planet,
      ),
    };
    expect(planBotFleetMission(changed, 'aegis-bot')).toEqual(
      planBotFleetMission(state, 'aegis-bot'),
    );
  });
});
