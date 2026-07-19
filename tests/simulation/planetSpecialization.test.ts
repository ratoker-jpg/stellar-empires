import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeCommand } from '../../src/simulation/reducer';

function getPlayerPlanetId(seed: string): { readonly state: ReturnType<typeof createInitialGameState>; readonly planetId: string } {
  const state = createInitialGameState(seed);
  const planet = state.planets.find((candidate) => candidate.ownerEmpireId === 'player');
  if (planet === undefined) throw new Error('Player planet was not created.');
  return { state, planetId: planet.id };
}

describe('planet specializations', () => {
  it('applies resource specialization to production and persists the selected template', () => {
    const { state, planetId } = getPlayerPlanetId('planet-specialization');
    const specialization = executeCommand(state, {
      type: 'SET_PLANET_SPECIALIZATION',
      empireId: 'player',
      planetId,
      specializationId: 'resource',
    });
    expect(specialization.ok).toBe(true);
    if (!specialization.ok) return;

    const planet = specialization.value.planets.find((candidate) => candidate.id === planetId);
    expect(planet?.specializationId).toBe('resource');
    expect(planet?.economy.resources.metal.productionPerHour).toBe(168);

    const template = executeCommand(specialization.value, {
      type: 'SET_PLANET_DEVELOPMENT_TEMPLATE',
      empireId: 'player',
      planetId,
      developmentTemplateId: 'resource-hub',
    });
    expect(template.ok).toBe(true);
    if (template.ok) {
      expect(
        template.value.planets.find((candidate) => candidate.id === planetId)
          ?.developmentTemplateId,
      ).toBe('resource-hub');
    }
  });

  it('blocks specialization changes while a local queue is active', () => {
    const { state, planetId } = getPlayerPlanetId('planet-specialization-queue');
    const queued = executeCommand(state, {
      type: 'QUEUE_BUILDING',
      empireId: 'player',
      planetId,
      buildingId: 'building.aegis.command',
    });
    expect(queued.ok).toBe(true);
    if (!queued.ok) return;

    expect(
      executeCommand(queued.value, {
        type: 'SET_PLANET_SPECIALIZATION',
        empireId: 'player',
        planetId,
        specializationId: 'industry',
      }),
    ).toMatchObject({ ok: false, code: 'PLANET_SPECIALIZATION_BUSY' });
  });

  it('changes construction duration according to specialization', () => {
    const { state, planetId } = getPlayerPlanetId('planet-specialization-speed');
    const specialized = executeCommand(state, {
      type: 'SET_PLANET_SPECIALIZATION',
      empireId: 'player',
      planetId,
      specializationId: 'industry',
    });
    expect(specialized.ok).toBe(true);
    if (!specialized.ok) return;

    const queued = executeCommand(specialized.value, {
      type: 'QUEUE_BUILDING',
      empireId: 'player',
      planetId,
      buildingId: 'building.aegis.command',
    });
    expect(queued.ok).toBe(true);
    if (!queued.ok) return;

    const item = queued.value.planets.find((candidate) => candidate.id === planetId)?.buildQueue[0];
    expect(item).toBeDefined();
    if (item !== undefined) {
      expect(item.completesAt - item.startedAt).toBeLessThan(120);
    }
  });
});
