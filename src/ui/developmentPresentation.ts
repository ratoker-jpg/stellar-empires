import '../styles/developmentPresentation.css';
import {
  getBuildingSheetUrl,
  getZoneTerrainUrl,
} from '../assets/planetIndustryRuntimeAssets';
import { getFactionMechanicalRoles } from '../simulation/factions/factionMechanicalRoles';
import type { GameState } from '../simulation/types';

export interface DevelopmentPresentationOptions {
  readonly getState: () => GameState;
  readonly getActivePlanetId: () => string;
}

export interface DevelopmentPresentationMount {
  refresh(): void;
  dispose(): void;
}

function applyPlanetPresentation(state: GameState, planetId: string): void {
  const planet = state.planets.find((candidate) => candidate.id === planetId);
  if (planet === undefined) return;
  const zoneStage = document.querySelector<HTMLElement>('#planet-zone-stage:not([hidden])');
  const zoneId = zoneStage?.dataset.zone;
  if (
    zoneStage !== null &&
    zoneId !== undefined &&
    (zoneId === 'resource' || zoneId === 'industry' || zoneId === 'military')
  ) {
    zoneStage.style.setProperty('--planet-zone-terrain', `url("${getZoneTerrainUrl(zoneId)}")`);
  }
}

function applyResearchPresentation(state: GameState, planetId: string): void {
  const planet = state.planets.find((candidate) => candidate.id === planetId);
  const workspace = document.querySelector<HTMLElement>('#research-view');
  if (planet === undefined || workspace === null) return;
  const roles = getFactionMechanicalRoles(planet.factionId).buildings;
  workspace.style.setProperty(
    '--research-facility-art',
    `url("${getBuildingSheetUrl(planet.factionId, roles.laboratory)}")`,
  );
}

function applyProductionPresentation(state: GameState, planetId: string): void {
  const planet = state.planets.find((candidate) => candidate.id === planetId);
  if (planet === undefined) return;
  const roles = getFactionMechanicalRoles(planet.factionId).buildings;
  for (const kind of ['ship', 'defense'] as const) {
    const workspace = document.querySelector<HTMLElement>(
      kind === 'ship' ? '#ship-production-view' : '#defense-production-view',
    );
    if (workspace === null) continue;
    workspace.style.setProperty(
      '--production-facility-art',
      `url("${getBuildingSheetUrl(
        planet.factionId,
        kind === 'ship' ? roles.shipyard : roles.sensorGrid,
      )}")`,
    );
  }
}

export function mountDevelopmentPresentation(
  options: DevelopmentPresentationOptions,
): DevelopmentPresentationMount {
  const refresh = (): void => {
    const state = options.getState();
    const planetId = options.getActivePlanetId();
    applyPlanetPresentation(state, planetId);
    applyResearchPresentation(state, planetId);
    applyProductionPresentation(state, planetId);
  };
  refresh();
  return { refresh, dispose: () => undefined };
}
