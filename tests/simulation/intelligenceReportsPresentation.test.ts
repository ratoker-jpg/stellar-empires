import { describe, expect, it } from 'vitest';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { getFactionMechanicalRoles } from '../../src/simulation/factions/factionMechanicalRoles';
import { getResearchEffectsForEmpire } from '../../src/simulation/factions/factionResearchEffects';
import { createIncomingFlightContacts } from '../../src/simulation/intelligence/incomingFlights';
import {
  createUnifiedMissionReports,
  resolveMissionReportCoordinate,
} from '../../src/simulation/reports/missionReports';
import type { GameState } from '../../src/simulation/types';
import { isMissionReportVisibleToEmpire } from '../../src/ui/reportsWorkspace';

function withIncomingFleet(state: GameState): GameState {
  const target = state.planets.find((planet) => planet.ownerEmpireId === 'player')!;
  const source = state.planets.find((planet) => planet.ownerEmpireId !== 'player')!;
  return {
    ...state,
    fleets: [
      ...state.fleets,
      {
        id: 'incoming-test-fleet',
        empireId: source.ownerEmpireId,
        originPlanetId: source.id,
        location: {
          type: 'transit' as const,
          fromPlanetId: source.id,
          toPlanetId: target.id,
          departedAt: state.clock.elapsedSeconds,
          arrivesAt: state.clock.elapsedSeconds + 600,
        },
        status: 'outbound' as const,
        ships: { 'ship.aegis.fighter': 3 },
        cargo: { metal: 999, crystal: 888, gas: 777 },
        speed: 12,
        cargoCapacity: 3_000,
        mission: { kind: 'attack' as const, targetPlanetId: target.id },
      },
    ],
  };
}

function withPlayerSensorStrength(state: GameState, minimum: number): GameState {
  const factionId = state.planets.find((planet) => planet.ownerEmpireId === 'player')!.factionId;
  const technologyId = getFactionMechanicalRoles(factionId).research.sensors;
  for (let level = 0; level <= 30; level += 1) {
    const candidate = {
      ...state,
      research: state.research.map((research) =>
        research.empireId === 'player'
          ? { ...research, levels: { ...research.levels, [technologyId]: level } }
          : research,
      ),
    };
    if (getResearchEffectsForEmpire(candidate, 'player').sensorStrength >= minimum) {
      return candidate;
    }
  }
  throw new Error(`Unable to reach sensor strength ${minimum}.`);
}

function withCurrentFullSourceIntel(state: GameState): GameState {
  const source = state.planets.find((planet) => planet.ownerEmpireId !== 'player')!;
  return {
    ...state,
    intelligence: state.intelligence.map((entry) =>
      entry.empireId === 'player'
        ? {
            ...entry,
            observations: [
              ...entry.observations,
              {
                id: 'source-full-intel',
                observerEmpireId: 'player',
                targetPlanetId: source.id,
                coordinate: source.coordinate,
                observedAt: state.clock.elapsedSeconds,
                expiresAt: state.clock.elapsedSeconds + 10_000,
                detected: false,
                snapshot: {
                  planetId: source.id,
                  coordinate: source.coordinate,
                  name: source.name,
                  ownerEmpireId: source.ownerEmpireId,
                  factionId: source.factionId,
                  level: 3 as const,
                  defenses: {},
                  stationedFleets: [],
                },
              },
            ],
          }
        : entry,
    ),
  };
}

describe('incoming flight intelligence presentation', () => {
  it('shows only a generic contact, owned target and ETA below sensor strength five', () => {
    const state = withIncomingFleet(createInitialGameState('incoming-contact'));
    const [contact] = createIncomingFlightContacts(state, 'player');
    expect(contact).toMatchObject({
      visibility: 'contact',
      sourceEmpireId: null,
      missionKind: null,
      ships: null,
      etaSeconds: 600,
    });
    expect(contact?.targetPlanetId).toBe(
      state.planets.find((planet) => planet.ownerEmpireId === 'player')?.id,
    );
    expect(contact).not.toHaveProperty('cargo');
  });

  it('reveals source at medium sensors and mission/composition at high sensors', () => {
    const base = withIncomingFleet(createInitialGameState('incoming-thresholds'));
    const medium = withPlayerSensorStrength(base, 5);
    const [sourceContact] = createIncomingFlightContacts(medium, 'player');
    expect(getResearchEffectsForEmpire(medium, 'player').sensorStrength).toBeLessThan(10);
    expect(sourceContact).toMatchObject({ visibility: 'source', missionKind: null, ships: null });
    expect(sourceContact?.sourceEmpireId).not.toBeNull();

    const high = withPlayerSensorStrength(base, 10);
    expect(createIncomingFlightContacts(high, 'player')[0]).toMatchObject({
      visibility: 'full',
      missionKind: 'attack',
      ships: { 'ship.aegis.fighter': 3 },
    });
  });

  it('promotes an incoming source to full visibility with current level-three intelligence', () => {
    const state = withCurrentFullSourceIntel(
      withIncomingFleet(createInitialGameState('incoming-promoted')),
    );
    expect(createIncomingFlightContacts(state, 'player')[0]).toMatchObject({
      visibility: 'full',
      missionKind: 'attack',
    });
  });
});

describe('derived intelligence reports', () => {
  it('derives observer and defender reports with exact coordinates and no saved report state', () => {
    const base = createInitialGameState('derived-intelligence-reports');
    const player = base.planets.find((planet) => planet.ownerEmpireId === 'player')!;
    const foreign = base.planets.find((planet) => planet.ownerEmpireId !== 'player')!;
    const state: GameState = {
      ...base,
      intelligence: base.intelligence.map((entry) => {
        if (entry.empireId === 'player') {
          return {
            ...entry,
            observations: [
              {
                id: 'player-observation',
                observerEmpireId: 'player',
                targetPlanetId: foreign.id,
                coordinate: foreign.coordinate,
                observedAt: 100,
                expiresAt: 200,
                detected: true,
                snapshot: {
                  planetId: foreign.id,
                  coordinate: foreign.coordinate,
                  name: foreign.name,
                  ownerEmpireId: foreign.ownerEmpireId,
                  factionId: foreign.factionId,
                  level: 2,
                },
              },
            ],
            alerts: [
              {
                id: 'player-alert',
                empireId: 'player',
                sourceEmpireId: null,
                targetPlanetId: player.id,
                coordinate: player.coordinate,
                detectedAt: 120,
                confidence: 'low',
              },
            ],
          };
        }
        return {
          ...entry,
          observations: [
            {
              id: 'private-bot-observation',
              observerEmpireId: entry.empireId,
              targetPlanetId: player.id,
              coordinate: player.coordinate,
              observedAt: 130,
              expiresAt: 230,
              detected: false,
              snapshot: {
                planetId: player.id,
                coordinate: player.coordinate,
                name: player.name,
                ownerEmpireId: 'player',
                factionId: player.factionId,
                level: 1,
              },
            },
          ],
        };
      }),
      clock: { ...base.clock, elapsedSeconds: 150 },
    };
    const checksum = createStateChecksum(state);
    const reports = createUnifiedMissionReports(state);
    const observer = reports.find((report) => report.id === 'intelligence-observation-player-observation');
    const defender = reports.find((report) => report.id === 'intelligence-alert-player-alert');
    const privateBot = reports.find((report) => report.id === 'intelligence-observation-private-bot-observation');

    expect(observer).toMatchObject({
      kind: 'intelligence',
      primaryEmpireId: 'player',
      outcome: 'failure',
      coordinate: foreign.coordinate,
    });
    expect(defender).toMatchObject({
      kind: 'intelligence',
      primaryEmpireId: 'player',
      secondaryEmpireId: null,
      outcome: 'recovered',
      coordinate: player.coordinate,
    });
    expect(resolveMissionReportCoordinate(state, observer!)).toEqual(foreign.coordinate);
    expect(isMissionReportVisibleToEmpire(observer!, 'player')).toBe(true);
    expect(isMissionReportVisibleToEmpire(defender!, 'player')).toBe(true);
    expect(isMissionReportVisibleToEmpire(privateBot!, 'player')).toBe(false);
    expect(createStateChecksum(state)).toBe(checksum);
    expect(state.eventLog.some((entry) => entry.event.payload.type === 'BATTLE_REPORT')).toBe(false);
  });
});
