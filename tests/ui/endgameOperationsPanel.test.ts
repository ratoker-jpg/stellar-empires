import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import type { FleetState } from '../../src/simulation/fleets/types';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState } from '../../src/simulation/types';
import { createEndgamePanelSummary } from '../../src/ui/endgameOperationsPanel';
import { createEndgameOperationsViewModel } from '../../src/ui/endgameOperationsViewModel';

function addCombatFleet(state: GameState): GameState {
  const origin = state.planets.find((planet) => planet.ownerEmpireId === 'player');
  if (origin === undefined) throw new Error('Player origin is missing.');
  const fleet: FleetState = {
    id: 'fleet-panel-summary',
    empireId: 'player',
    originPlanetId: origin.id,
    location: { type: 'planet', planetId: origin.id },
    status: 'stationed',
    ships: { 'ship.aegis.fighter': 4 },
    cargo: { metal: 0, crystal: 0, gas: 0 },
    speed: 12,
    cargoCapacity: 1_000,
    mission: null,
  };
  return { ...state, fleets: [...state.fleets, fleet] };
}

describe('endgame Operations panel summary', () => {
  it('describes the legal solo alliance action', () => {
    const state = createInitialGameState('endgame-panel-solo', 'aegis');
    const summary = createEndgamePanelSummary(
      createEndgameOperationsViewModel(state),
      'alliances',
    );
    expect(summary).toEqual({
      title: 'Альянсы и одиночное участие',
      status: 'Империя участвует самостоятельно.',
      primaryAction: 'Создать альянс',
    });
  });

  it('describes an active Solar War entry without offering a duplicate action', () => {
    const ready = addCombatFleet(createInitialGameState('endgame-panel-entry', 'aegis'));
    const entered = executeCommand(ready, {
      type: 'ENTER_SOLAR_WAR',
      empireId: 'player',
      fleetId: 'fleet-panel-summary',
    });
    expect(entered.ok).toBe(true);
    if (!entered.ok) throw new Error(entered.message);
    const summary = createEndgamePanelSummary(
      createEndgameOperationsViewModel(entered.value),
      'solar-war',
    );
    expect(summary.title).toBe('Солнечная война');
    expect(summary.status).toContain('fleet-panel-summary');
    expect(summary.primaryAction).toBeNull();
  });
});
