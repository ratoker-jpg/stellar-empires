import { describe, expect, it } from 'vitest';
import type {
  FleetFormation,
  FleetTargetPriority,
} from '../../src/simulation/combat/fleetDoctrine';
import { resolveAttackMission } from '../../src/simulation/combat/resolveAttackMission';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import type { FleetState } from '../../src/simulation/fleets/types';
import type { GameState } from '../../src/simulation/types';

const EVENT_SEQUENCE = 41;

function createFleet(
  id: string,
  empireId: string,
  planetId: string,
  ships: Readonly<Record<string, number>>,
  formation: FleetFormation,
  targetPriority: FleetTargetPriority,
): FleetState {
  return {
    id,
    empireId,
    originPlanetId: planetId,
    location: { type: 'planet', planetId },
    status: 'stationed',
    ships,
    cargo: { metal: 0, crystal: 0, gas: 0 },
    speed: 12,
    cargoCapacity: 0,
    formation,
    targetPriority,
    mission: null,
  };
}

function prepareCombatState(
  attackerFleetId: string,
  defenderOrder: readonly ('a' | 'b')[] = ['a', 'b'],
): {
  readonly state: GameState;
  readonly attacker: FleetState;
  readonly targetPlanetId: string;
} {
  const initial = createInitialGameState('post-1.0-pr2-combat-regression');
  const origin = initial.planets.find((planet) => planet.ownerEmpireId === 'player');
  const target = initial.planets.find((planet) => planet.ownerEmpireId === 'aegis-bot');
  if (origin === undefined || target === undefined) {
    throw new Error('Combat regression planets are missing.');
  }

  const attacker = createFleet(
    attackerFleetId,
    'player',
    origin.id,
    { 'ship.aegis.fighter': 10, 'ship.aegis.frigate': 4 },
    'line',
    'balanced',
  );
  const defenderA = createFleet(
    'defender-a',
    target.ownerEmpireId,
    target.id,
    {
      'commander.shared.executor': 1,
      'ship.aegis.frigate': 4,
    },
    'wedge',
    'capitals',
  );
  const defenderB = createFleet(
    'defender-b',
    target.ownerEmpireId,
    target.id,
    { 'ship.aegis.fighter': 7 },
    'screen',
    'interceptors',
  );
  const defenders = { a: defenderA, b: defenderB } as const;

  return {
    attacker,
    targetPlanetId: target.id,
    state: {
      ...initial,
      planets: initial.planets.map((planet) =>
        planet.id === target.id
          ? {
              ...planet,
              inventory: {
                ...planet.inventory,
                defenses: { 'defense.aegis.gun-battery': 3 },
              },
            }
          : planet,
      ),
      fleets: [attacker, ...defenderOrder.map((key) => defenders[key])],
      commanders: initial.commanders.map((command) =>
        command.empireId === target.ownerEmpireId
          ? {
              ...command,
              experience: 1_500,
              level: 5,
              flagshipFleetId: defenderA.id,
            }
          : command,
      ),
    },
  };
}

function resolvePrepared(input: ReturnType<typeof prepareCombatState>) {
  const target = input.state.planets.find((planet) => planet.id === input.targetPlanetId);
  if (target === undefined) throw new Error('Combat regression target is missing.');
  return resolveAttackMission(input.state, input.attacker, target, EVENT_SEQUENCE);
}

describe('POST-1.0-PR2 combat identity and defender doctrine regressions', () => {
  it('uses deterministic full attacker fleet identity entropy in the battle seed', () => {
    const firstId = 'attack-id-a';
    const secondId = 'attack-id-b';
    expect(firstId).toHaveLength(secondId.length);

    const first = resolvePrepared(prepareCombatState(firstId));
    const replay = resolvePrepared(prepareCombatState(firstId));
    const equalLengthOther = resolvePrepared(prepareCombatState(secondId));

    expect(replay.report.seed).toBe(first.report.seed);
    expect(equalLengthOther.report.seed).not.toBe(first.report.seed);
  });

  it('selects one stable primary defender independent of state.fleets array order', () => {
    const bThenA = resolvePrepared(prepareCombatState('stable-attack', ['b', 'a']));
    const aThenB = resolvePrepared(prepareCombatState('stable-attack', ['a', 'b']));

    for (const result of [bThenA, aThenB]) {
      expect(result.report.defenderFormation).toBe('wedge');
      expect(result.report.defenderTargetPriority).toBe('capitals');
      expect(result.report.defenderCommanderId).toBe('commander.shared.executor');
    }

    expect(bThenA.report).toEqual(aThenB.report);
  });
});
