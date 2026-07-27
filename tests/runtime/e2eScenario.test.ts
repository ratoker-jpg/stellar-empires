import { describe, expect, it } from 'vitest';
import { createE2eFixtureState } from '../../src/runtime/e2eScenario';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';

describe('E2E scenario fixture', () => {
  it('defers every bot decision so app readiness starts from a stable checksum', () => {
    const state = createInitialGameState('e2e-stable-bots');
    const fixture = createE2eFixtureState(state);

    expect(Object.keys(fixture.botAutomation.nextDecisionAtByEmpire)).toEqual(
      Object.keys(state.botAutomation.nextDecisionAtByEmpire),
    );
    expect(
      Object.values(fixture.botAutomation.nextDecisionAtByEmpire).every(
        (nextDecisionAt) => nextDecisionAt > fixture.clock.elapsedSeconds,
      ),
    ).toBe(true);
  });

  it('does not move an already later bot decision backward', () => {
    const state = createInitialGameState('e2e-later-bots');
    const later = state.clock.elapsedSeconds + 200_000;
    const advancedSchedule = {
      ...state,
      botAutomation: {
        nextDecisionAtByEmpire: Object.fromEntries(
          Object.keys(state.botAutomation.nextDecisionAtByEmpire).map(
            (empireId) => [empireId, later],
          ),
        ),
      },
    };

    const fixture = createE2eFixtureState(advancedSchedule);
    expect(Object.values(fixture.botAutomation.nextDecisionAtByEmpire)).toEqual(
      Object.values(advancedSchedule.botAutomation.nextDecisionAtByEmpire),
    );
  });
});
