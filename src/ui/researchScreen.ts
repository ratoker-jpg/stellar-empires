import { getFactionMechanicalAsset } from '../assets/factionMechanicalAssets';
import { getResearchCatalogForFaction } from '../simulation/factions/factionMechanicalCatalogRegistry';
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
  const asset = getFactionMechanicalAsset(assetId);
  if (asset === undefined) return;
  const column = asset.frame.x / asset.frame.width;
  const row = asset.frame.y / asset.frame.height;
  element.style.backgroundImage = `url("${asset.atlasUrl}")`;
  element.style.backgroundSize = '400% 300%';
  element.style.backgroundPosition = `${column === 0 ? 0 : (column / 3) * 100}% ${row === 0 ? 0 : (row / 2) * 100}%`;
}

function createDialog(): HTMLDialogElement {
  const existing = document.querySelector<HTMLDialogElement>('#research-screen-dialog');
  if (existing !== null) return existing;

  const dialog = document.createElement('dialog');
  dialog.id = 'research-screen-dialog';
  dialog.className = 'research-screen-dialog';
  const header = document.createElement('header');
  const text = document.createElement('div');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'panel-label';
  eyebrow.textContent = 'Industry Zone · лаборатория';
  const title = document.createElement('h2');
  title.dataset.role = 'research-title';
  text.append(eyebrow, title);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'dialog-close';
  close.textContent = '×';
  close.setAttribute('aria-label', 'Закрыть исследования');
  close.addEventListener('click', () => dialog.close());
  header.append(text, close);
  const summary = document.createElement('p');
  summary.className = 'research-screen-summary';
  const queue = document.createElement('section');
  queue.id = 'research-screen-queue';
  queue.className = 'research-screen-queue';
  const grid = document.createElement('div');
  grid.id = 'research-screen-grid';
  grid.className = 'research-screen-grid';
  dialog.append(header, summary, queue, grid);
  document.body.append(dialog);
  return dialog;
}

export function mountResearchScreen(options: ResearchScreenOptions): void {
  const dialog = createDialog();
  const grid = dialog.querySelector<HTMLElement>('#research-screen-grid');
  const queue = dialog.querySelector<HTMLElement>('#research-screen-queue');
  const summary = dialog.querySelector<HTMLElement>('.research-screen-summary');
  const title = dialog.querySelector<HTMLElement>('[data-role="research-title"]');
  if (grid === null || queue === null || summary === null || title === null) {
    throw new Error('Research screen containers are missing.');
  }

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
    const active = research.queue[0];
    if (active === undefined) {
      queue.textContent = 'Исследовательская очередь свободна.';
    } else {
      const definition = getResearchDefinition(active.technologyId);
      const duration = Math.max(1, active.completesAt - active.startedAt);
      const elapsed = Math.max(
        0,
        Math.min(duration, state.clock.elapsedSeconds - active.startedAt),
      );
      const remaining = Math.max(0, active.completesAt - state.clock.elapsedSeconds);
      const label = document.createElement('strong');
      label.textContent = `${definition?.name ?? active.technologyId} · ур. ${active.targetLevel} · ${state.planets.find((candidate) => candidate.id === active.planetId)?.name ?? active.planetId}`;
      const progress = document.createElement('div');
      progress.className = 'research-queue-progress';
      const bar = document.createElement('i');
      bar.style.width = `${Math.floor((elapsed * 100) / duration)}%`;
      progress.append(bar);
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.textContent = `Отменить · осталось ${formatGameDuration(remaining)}`;
      cancel.addEventListener('click', () => {
        if (
          options.execute(
            {
              type: 'CANCEL_RESEARCH',
              empireId: 'player',
              queueItemId: active.id,
            },
            'Исследование отменено',
          )
        ) render();
      });
      queue.append(label, progress, cancel);
    }

    grid.replaceChildren();
    for (const definition of getResearchCatalogForFaction(planet.factionId)) {
      const level = getResearchLevel(research, definition.id);
      const targetLevel = level + 1;
      const missing = findMissingResearchRequirements(definition, research, planet);
      const maxed = level >= definition.maxLevel;
      const boundedTargetLevel = Math.min(targetLevel, definition.maxLevel);
      const cost = calculateResearchCost(definition, boundedTargetLevel);
      const seconds = calculateResearchSeconds(definition, boundedTargetLevel);
      const affordable = canAffordResearch(state, planet.id, cost);
      const queueFree = research.queue.length === 0;
      const available = !maxed && missing.length === 0 && affordable && queueFree;
      const card = document.createElement('article');
      card.className = `research-card${available ? ' is-ready' : ' is-locked'}`;
      const art = document.createElement('div');
      art.className = 'research-card-art';
      art.setAttribute('role', 'img');
      art.setAttribute('aria-label', definition.name);
      setTechnologyArtwork(art, definition.assetId);
      const body = document.createElement('div');
      const meta = document.createElement('div');
      meta.className = 'research-card-meta';
      meta.textContent = `${CATEGORY_LABELS[definition.category]} · ур. ${level}/${definition.maxLevel}`;
      const cardTitle = document.createElement('h3');
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
        if (
          options.execute(
            {
              type: 'QUEUE_RESEARCH',
              empireId: 'player',
              planetId: planet.id,
              technologyId: definition.id,
            },
            `Исследование запущено · ${definition.name}`,
          )
        ) render();
      });
      body.append(meta, cardTitle, description, costLine, requirements, button);
      card.append(art, body);
      grid.append(card);
    }
  };

  const open = (): void => {
    render();
    dialog.showModal();
  };

  const scienceButton = document.querySelector<HTMLButtonElement>('[aria-label="Исследования"]');
  scienceButton?.addEventListener(
    'click',
    (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      open();
    },
    { capture: true },
  );

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const gateway = target.closest<HTMLButtonElement>('.zone-gateway');
      if (gateway?.querySelector('strong')?.textContent !== 'Исследования') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      open();
    },
    { capture: true },
  );
}
