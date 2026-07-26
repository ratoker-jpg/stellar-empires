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
  const dialog = document.querySelector<HTMLDialogElement>('#research-screen-dialog');
  if (planet === undefined || dialog === null) return;
  const roles = getFactionMechanicalRoles(planet.factionId).buildings;
  dialog.style.setProperty(
    '--research-facility-art',
    `url("${getBuildingSheetUrl(planet.factionId, roles.laboratory)}")`,
  );
}

function applyProductionPresentation(state: GameState, planetId: string): void {
  const planet = state.planets.find((candidate) => candidate.id === planetId);
  if (planet === undefined) return;

  for (const kind of ['ship', 'defense'] as const) {
    const dialog = document.querySelector<HTMLDialogElement>(`#${kind}-production-dialog`);
    if (dialog === null) continue;
    dialog.style.setProperty(
      '--production-facility-art',
      `url("${getBuildingSheetUrl(
        planet.factionId,
        kind === 'ship'
          ? getFactionMechanicalRoles(planet.factionId).buildings.shipyard
          : getFactionMechanicalRoles(planet.factionId).buildings.sensorGrid,
      )}")`,
    );

  }
}

export function mountDevelopmentPresentation(
  options: DevelopmentPresentationOptions,
): () => void {
  let pending = false;
  const render = (): void => {
    pending = false;
    const state = options.getState();
    const planetId = options.getActivePlanetId();
    applyPlanetPresentation(state, planetId);
    applyResearchPresentation(state, planetId);
    applyProductionPresentation(state, planetId);
  };
  const schedule = (): void => {
    if (pending) return;
    pending = true;
    queueMicrotask(render);
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('click', schedule, true);
  document.addEventListener('change', schedule, true);
  schedule();

  return () => {
    observer.disconnect();
    document.removeEventListener('click', schedule, true);
    document.removeEventListener('change', schedule, true);
  };
}
