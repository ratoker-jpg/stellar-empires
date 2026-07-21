import '../styles/developmentPresentation.css';
import { getFleetShipArtUrl } from '../assets/galaxyFleetRuntimeAssets';
import {
  getBuildingSheetFrame,
  getBuildingSheetUrl,
  getDefensePresentationArtUrl,
  getZoneTerrainUrl,
} from '../assets/planetIndustryRuntimeAssets';
import { getFactionMechanicalRoles } from '../simulation/factions/factionMechanicalRoles';
import { getFactionMechanicalRoles } from '../simulation/factions/factionMechanicalRoles';
import { getUnitsByKind } from '../simulation/units/catalog';
import type { GameState } from '../simulation/types';
import { createBuildingCardViewModels } from './planetViewModel';

export interface DevelopmentPresentationOptions {
  readonly getState: () => GameState;
  readonly getActivePlanetId: () => string;
}

function setSheetArtwork(element: HTMLElement, url: string, frame: number): void {
  element.style.backgroundImage = `linear-gradient(180deg, rgba(2, 8, 14, 0.02), rgba(2, 8, 14, 0.58)), url("${url}")`;
  element.style.backgroundSize = '100% 100%, 400% 100%';
  element.style.backgroundPosition = `center, ${frame === 0 ? 0 : (frame / 3) * 100}% center`;
  element.style.backgroundRepeat = 'no-repeat';
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

  const visibleCards = createBuildingCardViewModels(planet).filter(
    (card) => zoneId === undefined || card.zoneId === zoneId,
  );
  const cardByName = new Map(visibleCards.map((card) => [card.name, card]));
  for (const node of document.querySelectorAll<HTMLElement>(
    '#planet-building-grid .planet-building-node',
  )) {
    const name = node.querySelector<HTMLElement>('.planet-building-node__body strong')?.textContent;
    const art = node.querySelector<HTMLElement>('.planet-building-node__art');
    const card = name === undefined ? undefined : cardByName.get(name);
    if (art === null || card === undefined) continue;
    setSheetArtwork(
      art,
      getBuildingSheetUrl(planet.factionId, card.id),
      getBuildingSheetFrame(card.level, card.maxLevel),
    );
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
    const definitions = getUnitsByKind(kind, planet.factionId);
    const byName = new Map(definitions.map((definition) => [definition.name, definition]));
    for (const card of dialog.querySelectorAll<HTMLElement>('.production-card')) {
      const name = card.querySelector<HTMLHeadingElement>('h3')?.textContent;
      const art = card.querySelector<HTMLElement>('.production-art');
      const definition = name === undefined ? undefined : byName.get(name);
      if (art === null || definition === undefined) continue;
      if (kind === 'ship') {
        art.style.backgroundImage = `linear-gradient(180deg, transparent, rgba(2, 8, 14, 0.68)), url("${getFleetShipArtUrl(planet.factionId, definition.id)}")`;
        art.style.backgroundSize = '100% 100%, contain';
        art.style.backgroundPosition = 'center';
        art.style.backgroundRepeat = 'no-repeat';
      } else {
        setSheetArtwork(
          art,
          getDefensePresentationArtUrl(planet.factionId, definition.id),
          2,
        );
      }
    }
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
