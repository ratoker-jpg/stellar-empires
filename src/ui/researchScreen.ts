import { AEGIS_VERTICAL_SLICE_ASSETS } from '../assets/aegisVerticalSliceAssets';
import type { GameState } from '../simulation/types';
import { AEGIS_RESEARCH_CATALOG } from '../simulation/research/catalog';
import {
  findMissingResearchRequirements,
  getEmpireResearch,
  getResearchLevel,
} from '../simulation/research/researchState';

export interface ResearchScreenOptions {
  readonly getState: () => GameState;
}

const CATEGORY_LABELS = {
  infrastructure: 'Инфраструктура',
  energy: 'Энергетика',
  navigation: 'Навигация',
  intelligence: 'Разведка',
  defense: 'Защита',
  weapons: 'Вооружение',
} as const;

function setTechnologyArtwork(element: HTMLElement, assetId: string): void {
  const asset = AEGIS_VERTICAL_SLICE_ASSETS.find((candidate) => candidate.id === assetId);
  if (asset === undefined) {
    return;
  }

  const column = asset.frame.x / asset.frame.width;
  const row = asset.frame.y / asset.frame.height;
  element.style.backgroundImage = `url("${asset.atlasUrl}")`;
  element.style.backgroundSize = '300% 200%';
  element.style.backgroundPosition = `${column === 0 ? 0 : (column / 2) * 100}% ${row === 0 ? 0 : 100}%`;
}

function createDialog(): HTMLDialogElement {
  const existing = document.querySelector<HTMLDialogElement>('#research-screen-dialog');
  if (existing !== null) {
    return existing;
  }

  const dialog = document.createElement('dialog');
  dialog.id = 'research-screen-dialog';
  dialog.className = 'research-screen-dialog';
  const header = document.createElement('header');
  const text = document.createElement('div');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'panel-label';
  eyebrow.textContent = 'Industry Zone · лаборатория';
  const title = document.createElement('h2');
  title.textContent = 'Исследования «Эгиды»';
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
  summary.textContent = 'Технологии открываются через лабораторию и связанные узлы дерева. Запуск очереди появится в следующем PR.';
  const grid = document.createElement('div');
  grid.id = 'research-screen-grid';
  grid.className = 'research-screen-grid';
  dialog.append(header, summary, grid);
  document.body.append(dialog);
  return dialog;
}

export function mountResearchScreen(options: ResearchScreenOptions): void {
  const dialog = createDialog();
  const grid = dialog.querySelector<HTMLElement>('#research-screen-grid');
  if (grid === null) {
    throw new Error('Research grid is missing.');
  }

  const render = (): void => {
    const state = options.getState();
    const research = getEmpireResearch(state.research, 'player');
    const planet = state.planets.find((candidate) => candidate.ownerEmpireId === 'player');
    if (research === undefined || planet === undefined) {
      grid.textContent = 'Исследовательские данные недоступны.';
      return;
    }

    grid.replaceChildren();
    for (const definition of AEGIS_RESEARCH_CATALOG) {
      const level = getResearchLevel(research, definition.id);
      const missing = findMissingResearchRequirements(definition, research, planet);
      const maxed = level >= definition.maxLevel;
      const card = document.createElement('article');
      card.className = `research-card${missing.length === 0 && !maxed ? ' is-ready' : ' is-locked'}`;
      const art = document.createElement('div');
      art.className = 'research-card-art';
      art.setAttribute('role', 'img');
      art.setAttribute('aria-label', definition.name);
      setTechnologyArtwork(art, definition.assetId);
      const body = document.createElement('div');
      const meta = document.createElement('div');
      meta.className = 'research-card-meta';
      meta.textContent = `${CATEGORY_LABELS[definition.category]} · ур. ${level}/${definition.maxLevel}`;
      const title = document.createElement('h3');
      title.textContent = definition.name;
      const description = document.createElement('p');
      description.textContent = definition.description;
      const requirements = document.createElement('p');
      requirements.className = 'research-card-requirements';
      requirements.textContent = maxed
        ? 'Максимальный уровень достигнут'
        : missing.length === 0
          ? 'Требования выполнены'
          : `Не выполнено: ${missing.map((item) => `${item.id} ${item.currentLevel}/${item.requiredLevel}`).join(' · ')}`;
      body.append(meta, title, description, requirements);
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
      if (!(target instanceof Element)) {
        return;
      }
      const gateway = target.closest<HTMLButtonElement>('.zone-gateway');
      if (gateway?.querySelector('strong')?.textContent !== 'Исследования') {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      open();
    },
    { capture: true },
  );
}
