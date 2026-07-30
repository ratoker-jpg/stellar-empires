import { resolveCompleteMechanicalAsset } from '../assets/completeMechanicalAssetManifest';
import { applyMechanicalAssetArtwork } from '../assets/runtimeMechanicalAssets';
import { getResearchCatalogForFaction } from '../simulation/factions/factionMechanicalCatalogRegistry';
import { getResearchMaxLevel } from '../simulation/progression/profile';
import { getResearchDefinition } from '../simulation/research/catalog';
import {
  calculateResearchCost,
  calculateResearchSeconds,
} from '../simulation/research/progression';
import {
  findMissingResearchRequirements,
  getEmpireResearch,
  getResearchLevel,
} from '../simulation/research/researchState';
import type { GameCommand, GameState } from '../simulation/types';
import { formatGameDuration } from './planetViewModel';

export interface ResearchScreenOptions {
  readonly getState: () => GameState;
  readonly getActivePlanetId: () => string;
  readonly execute: (command: GameCommand, successMessage: string) => boolean;
}

export interface ResearchScreenMount {
  activate(): void;
  deactivate(): void;
  refresh(): void;
  dispose(): void;
}

export const RESEARCH_WORKSPACE_SELECTORS = {
  host: '#research-view',
  queue: '#research-screen-queue',
  grid: '#research-screen-grid',
} as const;

const NUMBER_FORMAT = new Intl.NumberFormat('ru-RU');
const CATEGORY_LABELS = {
  infrastructure: 'Инфраструктура',
  energy: 'Энергетика',
  navigation: 'Навигация',
  intelligence: 'Разведка',
  defense: 'Защита',
  weapons: 'Вооружение',
} as const;
const FACTION_NAMES = {
  aegis: 'Эгида',
  synod: 'Синод',
  veyra: 'Вейра',
} as const;

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Research workspace element is missing: ${selector}`);
  return element;
}

function canAffordResearch(
  state: GameState,
  planetId: string,
  cost: ReturnType<typeof calculateResearchCost>,
): boolean {
  const planet = state.planets.find((candidate) => candidate.id === planetId);
  return (
    planet !== undefined &&
    planet.economy.resources.metal.amount >= cost.metal &&
    planet.economy.resources.crystal.amount >= cost.crystal &&
    planet.economy.resources.gas.amount >= cost.gas
  );
}

function setTechnologyArtwork(element: HTMLElement, assetId: string): void {
  const asset = resolveCompleteMechanicalAsset(assetId).asset;
  if (asset !== undefined) applyMechanicalAssetArtwork(element, asset);
}

function createWorkspace(host: HTMLElement): void {
  if (host.querySelector(RESEARCH_WORKSPACE_SELECTORS.grid) !== null) return;
  const header = document.createElement('header');
  const text = document.createElement('div');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'panel-label';
  eyebrow.textContent = 'Industry Zone · лаборатория';
  const title = document.createElement('h1');
  title.dataset.role = 'research-title';
  title.tabIndex = -1;
  text.append(eyebrow, title);
  header.append(text);
  const summary = document.createElement('p');
  summary.className = 'research-screen-summary';
  const queue = document.createElement('section');
  queue.id = 'research-screen-queue';
  queue.className = 'research-screen-queue';
  queue.dataset.testid = 'research-queue';
  const grid = document.createElement('div');
  grid.id = 'research-screen-grid';
  grid.className = 'research-screen-grid';
  grid.dataset.testid = 'research-grid';
  host.append(header, summary, queue, grid);
}

export function mountResearchScreen(options: ResearchScreenOptions): ResearchScreenMount {
  const host = requireElement<HTMLElement>(RESEARCH_WORKSPACE_SELECTORS.host);
  createWorkspace(host);
  const grid = requireElement<HTMLElement>(RESEARCH_WORKSPACE_SELECTORS.grid);
  const queue = requireElement<HTMLElement>(RESEARCH_WORKSPACE_SELECTORS.queue);
  const summary = host.querySelector<HTMLElement>('.research-screen-summary');
  const title = host.querySelector<HTMLElement>('[data-role="research-title"]');
  if (summary === null || title === null) throw new Error('Research workspace containers are missing.');
  let active = false;

  const render = (): void => {
    const state = options.getState();
    const research = getEmpireResearch(state.research, 'player');
    const planet = state.planets.find(
      (candidate) => candidate.id === options.getActivePlanetId(),
    );
    if (research === undefined || planet === undefined) {
      grid.textContent = 'Исследовательские данные недоступны.';
      queue.replaceChildren();
      return;
    }

    title.textContent = `Исследования «${FACTION_NAMES[planet.factionId]}»`;
    summary.textContent = `${planet.name} финансирует глобальную очередь исследований. Ресурсы резервируются сразу, отмена возвращает 75% стоимости.`;
    queue.replaceChildren();
    const queued = research.queue[0];
    if (queued === undefined) {
      queue.textContent = 'Исследовательская очередь свободна.';
      queue.dataset.queueState = 'idle';
    } else {
      queue.dataset.queueState = 'active';
      const definition = getResearchDefinition(queued.technologyId);
      const duration = Math.max(1, queued.completesAt - queued.startedAt);
      const elapsed = Math.max(0, Math.min(duration, state.clock.elapsedSeconds - queued.startedAt));
      const remaining = Math.max(0, queued.completesAt - state.clock.elapsedSeconds);
      const label = document.createElement('strong');
      label.textContent = `${definition?.name ?? queued.technologyId} · ур. ${queued.targetLevel} · ${state.planets.find((candidate) => candidate.id === queued.planetId)?.name ?? queued.planetId}`;
      const progress = document.createElement('div');
      progress.className = 'research-queue-progress';
      const bar = document.createElement('i');
      bar.style.width = `${Math.floor((elapsed * 100) / duration)}%`;
      progress.append(bar);
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.textContent = `Отменить · осталось ${formatGameDuration(remaining)}`;
      cancel.addEventListener('click', () => {
        options.execute(
          { type: 'CANCEL_RESEARCH', empireId: 'player', queueItemId: queued.id },
          'Исследование отменено',
        );
      });
      queue.append(label, progress, cancel);
    }

    grid.replaceChildren();
    for (const definition of getResearchCatalogForFaction(planet.factionId)) {
      const profileId = state.campaignSettings.progressionProfile;
      const maxLevel = getResearchMaxLevel(profileId, definition);
      const level = getResearchLevel(research, definition.id);
      const targetLevel = level + 1;
      const missing = findMissingResearchRequirements(
        definition,
        research,
        planet,
        profileId,
      );
      const maxed = level >= maxLevel;
      const boundedTargetLevel = Math.min(targetLevel, maxLevel);
      const cost = calculateResearchCost(definition, boundedTargetLevel, profileId);
      const seconds = calculateResearchSeconds(definition, boundedTargetLevel, profileId);
      const affordable = canAffordResearch(state, planet.id, cost);
      const queueFree = research.queue.length === 0;
      const available = !maxed && missing.length === 0 && affordable && queueFree;
      const card = document.createElement('article');
      card.className = `research-card${available ? ' is-ready' : ' is-locked'}`;
      card.dataset.mechanicalId = definition.id;
      const art = document.createElement('div');
      art.className = 'research-card-art';
      art.setAttribute('role', 'img');
      art.setAttribute('aria-label', definition.name);
      setTechnologyArtwork(art, definition.assetId);
      const body = document.createElement('div');
      const meta = document.createElement('div');
      meta.className = 'research-card-meta';
      meta.textContent = `${CATEGORY_LABELS[definition.category]} · ур. ${level}/${maxLevel}`;
      const cardTitle = document.createElement('h2');
      cardTitle.textContent = definition.name;
      const description = document.createElement('p');
      description.textContent = definition.description;
      const costLine = document.createElement('p');
      costLine.className = 'research-card-cost';
      costLine.textContent = `M ${NUMBER_FORMAT.format(cost.metal)} · C ${NUMBER_FORMAT.format(cost.crystal)} · G ${NUMBER_FORMAT.format(cost.gas)} · ${formatGameDuration(seconds)}`;
      const requirements = document.createElement('p');
      requirements.className = 'research-card-requirements';
      requirements.textContent = maxed
        ? 'Максимальный уровень достигнут'
        : missing.length > 0
          ? `Не выполнено: ${missing.map((item) => `${item.id} ${item.currentLevel}/${item.requiredLevel}`).join(' · ')}`
          : !affordable
            ? `Недостаточно ресурсов на ${planet.name}`
            : !queueFree
              ? 'Глобальная очередь занята'
              : `Готово к запуску на ${planet.name}`;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'research-action';
      button.disabled = !available;
      button.textContent = maxed ? 'Завершено' : `Исследовать уровень ${targetLevel}`;
      button.addEventListener('click', () => {
        options.execute(
          {
            type: 'QUEUE_RESEARCH',
            empireId: 'player',
            planetId: planet.id,
            technologyId: definition.id,
          },
          `Исследование запущено · ${definition.name}`,
        );
      });
      body.append(meta, cardTitle, description, costLine, requirements, button);
      card.append(art, body);
      grid.append(card);
    }
  };

  return {
    activate: () => {
      active = true;
      host.hidden = false;
      render();
      title.focus({ preventScroll: true });
    },
    deactivate: () => {
      active = false;
      host.hidden = true;
    },
    refresh: () => {
      if (active) render();
    },
    dispose: () => {
      active = false;
      host.replaceChildren();
    },
  };
}
