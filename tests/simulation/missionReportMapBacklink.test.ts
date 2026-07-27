import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { createE2eFixtureState, E2E_REPORT_ID } from '../../src/runtime/e2eScenario';
import {
  createUnifiedMissionReports,
  resolveMissionReportCoordinate,
} from '../../src/simulation/reports/missionReports';

describe('mission report map backlink', () => {
  it('resolves report targets to stable SpaceCoordinates', () => {
    const state = createE2eFixtureState(createInitialGameState('report-backlink'));
    const report = createUnifiedMissionReports(state).find((entry) => entry.id === E2E_REPORT_ID);
    expect(report).toBeDefined();
    expect(report && resolveMissionReportCoordinate(state, report)).toEqual(
      state.planets.find((planet) => planet.ownerEmpireId === 'pirate-neutral')?.coordinate,
    );
  });
});
