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
  categories: '#research-category-tabs',
  detail: '#research-detail-panel',
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
type ResearchCategory = keyof typeof CATEGORY_LABELS;
const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS) as ResearchCategory[];
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
  const layout = document.createElement('div');
  layout.className = 'research-command-layout';
  const categories = document.createElement('nav');
  categories.id = 'research-category-tabs';
  categories.className = 'research-category-tabs';
  categories.setAttribute('aria-label', 'Категории исследований');
  const grid = document.createElement('div');
  grid.id = 'research-screen-grid';
  grid.className = 'research-screen-grid';
  grid.dataset.testid = 'research-grid';
  const detail = document.createElement('aside');
  detail.id = 'research-detail-panel';
  detail.className = 'research-detail-panel';
  detail.dataset.testid = 'research-detail';
  layout.append(categories, grid, detail);
  host.append(header, summary, queue, layout);
}

export function mountResearchScreen(options: ResearchScreenOptions): ResearchScreenMount {
  const host = requireElement<HTMLElement>(RESEARCH_WORKSPACE_SELECTORS.host);
  createWorkspace(host);
  const grid = requireElement<HTMLElement>(RESEARCH_WORKSPACE_SELECTORS.grid);
  const queue = requireElement<HTMLElement>(RESEARCH_WORKSPACE_SELECTORS.queue);
  const categories = requireElement<HTMLElement>(RESEARCH_WORKSPACE_SELECTORS.categories);
  const detail = requireElement<HTMLElement>(RESEARCH_WORKSPACE_SELECTORS.detail);
  const summary = host.querySelector<HTMLElement>('.research-screen-summary');
  const title = host.querySelector<HTMLElement>('[data-role="research-title"]');
  if (summary === null || title === null) throw new Error('Research workspace containers are missing.');
  let active = false;
  let selectedCategory: ResearchCategory = 'infrastructure';
  let selectedTechnologyId: string | null = null;

  const render = (): void => {
    const state = options.getState();
    const research = getEmpireResearch(state.research, 'player');
    const planet = state.planets.find(
      (candidate) => candidate.id === options.getActivePlanetId(),
    );
    if (research === undefined || planet === undefined) {
      grid.textContent = 'Исследовательские данные недоступны.';
      queue.replaceChildren();
      categories.replaceChildren();
      detail.replaceChildren();
      return;
    }

    const catalog = getResearchCatalogForFaction(planet.factionId);
    if (!catalog.some((definition) => definition.category === selectedCategory)) {
      selectedCategory = (catalog[0]?.category as ResearchCategory | undefined) ?? 'infrastructure';
    }
    const categoryCatalog = catalog.filter((definition) => definition.category === selectedCategory);
    if (!categoryCatalog.some((definition) => definition.id === selectedTechnologyId)) {
      selectedTechnologyId = categoryCatalog[0]?.id ?? null;
    }

    title.textContent = `Исследования «${FACTION_NAMES[planet.factionId]}»`;
    summary.textContent = `${planet.name} финансирует глобальную очередь исследований. Выбери научное направление слева и технологию в центре — требования и запуск остаются в контекстной панели.`;

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

    categories.replaceChildren();
    for (const category of CATEGORY_ORDER) {
      const definitions = catalog.filter((definition) => definition.category === category);
      if (definitions.length === 0) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.researchCategory = category;
      button.setAttribute('aria-pressed', String(category === selectedCategory));
      const label = document.createElement('strong');
      label.textContent = CATEGORY_LABELS[category];
      const count = document.createElement('small');
      count.textContent = `${definitions.length} технологий`;
      button.append(label, count);
      button.addEventListener('click', () => {
        selectedCategory = category;
        selectedTechnologyId = null;
        render();
      });
      categories.append(button);
    }

    grid.replaceChildren();
    for (const definition of categoryCatalog) {
      const profileId = state.campaignSettings.progressionProfile;
      const maxLevel = getResearchMaxLevel(profileId, definition);
      const level = getResearchLevel(research, definition.id);
      const targetLevel = level + 1;
      const missing = findMissingResearchRequirements(definition, research, planet, profileId);
      const maxed = level >= maxLevel;
      const boundedTargetLevel = Math.min(targetLevel, maxLevel);
      const cost = calculateResearchCost(definition, boundedTargetLevel, profileId);
      const seconds = calculateResearchSeconds(definition, boundedTargetLevel, profileId);
      const affordable = canAffordResearch(state, planet.id, cost);
      const queueFree = research.queue.length === 0;
      const available = !maxed && missing.length === 0 && affordable && queueFree;
      const card = document.createElement('article');
      card.className = `research-card${available ? ' is-ready' : ' is-locked'}${definition.id === selectedTechnologyId ? ' is-selected' : ''}`;
      card.dataset.mechanicalId = definition.id;
      const art = document.createElement('div');
      art.className = 'research-card-art';
      art.setAttribute('role', 'img');
      art.setAttribute('aria-label', definition.name);
      setTechnologyArtwork(art, definition.assetId);
      const body = document.createElement('div');
      const meta = document.createElement('div');
      meta.className = 'research-card-meta';
      meta.textContent = `${CATEGORY_LABELS[definition.category as ResearchCategory]} · ур. ${level}/${maxLevel}`;
      const cardTitle = document.createElement('h2');
      cardTitle.textContent = definition.name;
      const description = document.createElement('p');
      description.textContent = definition.description;
      const costLine = document.createElement('p');
      costLine.className = 'research-card-cost';
      costLine.textContent = `M ${NUMBER_FORMAT.format(cost.metal)} · C ${NUMBER_FORMAT.format(cost.crystal)} · G ${NUMBER_FORMAT.format(cost.gas)} · ${formatGameDuration(seconds)}`;
      const select = document.createElement('button');
      select.type = 'button';
      select.className = 'research-detail-action';
      select.textContent = definition.id === selectedTechnologyId ? 'Выбрано' : 'Подробнее';
      select.setAttribute('aria-pressed', String(definition.id === selectedTechnologyId));
      select.addEventListener('click', () => {
        selectedTechnologyId = definition.id;
        render();
      });
      body.append(meta, cardTitle, description, costLine, select);
      card.append(art, body);
      grid.append(card);
    }

    detail.replaceChildren();
    const selected = catalog.find((definition) => definition.id === selectedTechnologyId);
    if (selected === undefined) {
      detail.textContent = 'Выбери технологию.';
      return;
    }
    const profileId = state.campaignSettings.progressionProfile;
    const maxLevel = getResearchMaxLevel(profileId, selected);
    const level = getResearchLevel(research, selected.id);
    const targetLevel = level + 1;
    const maxed = level >= maxLevel;
    const boundedTargetLevel = Math.min(targetLevel, maxLevel);
    const cost = calculateResearchCost(selected, boundedTargetLevel, profileId);
    const seconds = calculateResearchSeconds(selected, boundedTargetLevel, profileId);
    const missing = findMissingResearchRequirements(selected, research, planet, profileId);
    const affordable = canAffordResearch(state, planet.id, cost);
    const queueFree = research.queue.length === 0;
    const available = !maxed && missing.length === 0 && affordable && queueFree;
    const detailArt = document.createElement('div');
    detailArt.className = 'research-detail-art';
    detailArt.setAttribute('role', 'img');
    detailArt.setAttribute('aria-label', selected.name);
    setTechnologyArtwork(detailArt, selected.assetId);
    const detailMeta = document.createElement('p');
    detailMeta.className = 'panel-label';
    detailMeta.textContent = `${CATEGORY_LABELS[selected.category as ResearchCategory]} · уровень ${level}/${maxLevel}`;
    const detailTitle = document.createElement('h2');
    detailTitle.textContent = selected.name;
    const detailDescription = document.createElement('p');
    detailDescription.textContent = selected.description;
    const detailCost = document.createElement('p');
    detailCost.className = 'research-detail-cost';
    detailCost.textContent = `Следующий уровень · M ${NUMBER_FORMAT.format(cost.metal)} · C ${NUMBER_FORMAT.format(cost.crystal)} · G ${NUMBER_FORMAT.format(cost.gas)} · ${formatGameDuration(seconds)}`;
    const requirements = document.createElement('ul');
    requirements.className = 'research-detail-requirements';
    if (maxed) {
      const item = document.createElement('li');
      item.textContent = 'Максимальный уровень достигнут';
      requirements.append(item);
    } else if (missing.length > 0) {
      for (const requirement of missing) {
        const item = document.createElement('li');
        item.textContent = `${requirement.id}: ${requirement.currentLevel}/${requirement.requiredLevel}`;
        requirements.append(item);
      }
    } else {
      const item = document.createElement('li');
      item.textContent = !affordable
        ? `Недостаточно ресурсов на ${planet.name}`
        : !queueFree
          ? 'Глобальная очередь занята'
          : `Все требования выполнены на ${planet.name}`;
      requirements.append(item);
    }
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'research-action';
    action.disabled = !available;
    action.textContent = maxed ? 'Завершено' : `Исследовать уровень ${targetLevel}`;
    action.addEventListener('click', () => {
      options.execute(
        { type: 'QUEUE_RESEARCH', empireId: 'player', planetId: planet.id, technologyId: selected.id },
        `Исследование запущено · ${selected.name}`,
      );
    });
    detail.append(detailArt, detailMeta, detailTitle, detailDescription, detailCost, requirements, action);
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
