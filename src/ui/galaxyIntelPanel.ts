import { getPlanetArtUrl } from '../assets/galaxyFleetRuntimeAssets';
import {
  GALAXY_SYSTEM_SELECTED_EVENT,
  type GalaxySystemSelectionDetail,
} from '../game/galaxyPresentationEvents';
import {
  createGalaxyIntelligenceView,
  filterGalaxyIntelligence,
  summarizeGalaxyIntelligence,
  type GalaxyIntelPlanet,
  type GalaxyIntelQuery,
  type GalaxyIntelVisibility,
  type GalaxyOwnerFilter,
} from '../simulation/galaxy/intelligenceView';
import type { PlanetBiome } from '../simulation/galaxy/types';
import type { GameState } from '../simulation/types';
import {
  dispatchFleetMissionTarget,
  inferMissionForGalaxyTarget,
} from './fleetMissionEvents';

export interface GalaxyIntelPanelOptions {
  readonly getState: () => GameState;
  readonly empireId?: string;
}

const VISIBILITY_LABELS = {
  owned: 'Своя колония',
  current: 'Актуальная разведка',
  stale: 'Устаревшие сведения',
  contact: 'Неизвестный контакт',
  unclaimed: 'Свободная позиция',
} as const;

const BIOME_LABELS: Readonly<Record<PlanetBiome, string>> = {
  terran: 'Земная',
  desert: 'Пустынная',
  ice: 'Ледяная',
  volcanic: 'Вулканическая',
  toxic: 'Токсичная',
  barren: 'Безжизненная',
  gas: 'Газовый гигант',
};

function createSelect(
  labelText: string,
  options: readonly { readonly value: string; readonly label: string }[],
): { readonly label: HTMLLabelElement; readonly select: HTMLSelectElement } {
  const label = document.createElement('label');
  label.className = 'galaxy-intel-control';
  const caption = document.createElement('span');
  caption.textContent = labelText;
  const select = document.createElement('select');
  for (const option of options) {
    const element = document.createElement('option');
    element.value = option.value;
    element.textContent = option.label;
    select.append(element);
  }
  label.append(caption, select);
  return { label, select };
}

function createDialog(): HTMLDialogElement {
  const existing = document.querySelector<HTMLDialogElement>('#galaxy-intel-dialog');
  if (existing !== null) return existing;
  const dialog = document.createElement('dialog');
  dialog.id = 'galaxy-intel-dialog';
  dialog.className = 'galaxy-intel-dialog';
  dialog.innerHTML = `
    <header class="galaxy-intel-header">
      <div>
        <p class="panel-label">Galaxy Intelligence</p>
        <h2>Навигация, разведка и выбор цели</h2>
        <p>Выберите систему на карте или найдите позицию вручную. Цель можно сразу передать в командование флотом.</p>
      </div>
      <button type="button" class="dialog-close" aria-label="Закрыть">×</button>
    </header>
    <div class="galaxy-intel-controls"></div>
    <div class="galaxy-intel-summary"></div>
    <div class="galaxy-intel-results"></div>
  `;
  dialog.querySelector<HTMLButtonElement>('.dialog-close')?.addEventListener('click', () => {
    dialog.close();
  });
  document.body.append(dialog);
  return dialog;
}

function resourceLine(planet: GalaxyIntelPlanet): string {
  const resources = planet.resources;
  if (resources === null || resources === undefined) return 'Экономика скрыта';
  return `M ${resources.metal} · C ${resources.crystal} · G ${resources.gas}`;
}

function missionActionLabel(planet: GalaxyIntelPlanet): string {
  if (planet.visibility === 'unclaimed') return 'Подготовить колонизацию';
  if (planet.ownerEmpireId === 'player') return 'Подготовить снабжение';
  return 'Подготовить разведку';
}

function getMissionTargetId(planet: GalaxyIntelPlanet): string {
  return planet.visibility === 'unclaimed'
    ? planet.galaxyPlanetId
    : planet.colonyId ?? planet.galaxyPlanetId;
}

function createPlanetCard(planet: GalaxyIntelPlanet, closeDialog: () => void): HTMLElement {
  const article = document.createElement('article');
  article.className = `galaxy-intel-card is-${planet.visibility}`;

  const visual = document.createElement('div');
  visual.className = 'galaxy-intel-card__visual';
  const image = document.createElement('img');
  image.src = getPlanetArtUrl(planet.biome);
  image.alt = '';
  image.loading = 'lazy';
  const coordinate = document.createElement('span');
  coordinate.textContent = `${planet.systemX}:${planet.systemY}:${planet.position}`;
  visual.append(image, coordinate);

  const body = document.createElement('div');
  body.className = 'galaxy-intel-card__body';
  const header = document.createElement('header');
  const title = document.createElement('h3');
  title.textContent = planet.displayName;
  const badge = document.createElement('span');
  badge.textContent = VISIBILITY_LABELS[planet.visibility];
  header.append(title, badge);

  const location = document.createElement('p');
  location.textContent = `${planet.systemName} · орбита ${planet.position}`;
  const physical = document.createElement('p');
  physical.textContent = `${BIOME_LABELS[planet.biome]} · размер ${planet.size} · звезда ${planet.starClass}`;
  const owner = document.createElement('p');
  owner.textContent = planet.ownerEmpireId === null
    ? planet.visibility === 'unclaimed'
      ? 'Владелец: нет'
      : 'Владелец: скрыт'
    : `Владелец: ${planet.ownerEmpireId}`;
  const resources = document.createElement('strong');
  resources.textContent = resourceLine(planet);
  const intel = document.createElement('small');
  intel.textContent = planet.observedAt === null
    ? 'Нет разведывательного снимка'
    : planet.expiresAt === null
      ? `Собственные данные · время ${planet.observedAt}`
      : `Наблюдение ${planet.observedAt} · актуально до ${planet.expiresAt}`;

  const action = document.createElement('button');
  action.type = 'button';
  action.className = 'galaxy-intel-mission-button';
  action.textContent = missionActionLabel(planet);
  action.addEventListener('click', () => {
    dispatchFleetMissionTarget({
      targetId: getMissionTargetId(planet),
      label: `${planet.displayName} · ${planet.systemName}:${planet.position}`,
      mission: inferMissionForGalaxyTarget(planet.ownerEmpireId, planet.visibility),
    });
    closeDialog();
  });

  body.append(header, location, physical, owner, resources, intel, action);
  article.append(visual, body);
  return article;
}

export function mountGalaxyIntelPanel(options: GalaxyIntelPanelOptions): void {
  const dialog = createDialog();
  const controls = dialog.querySelector<HTMLElement>('.galaxy-intel-controls');
  const summary = dialog.querySelector<HTMLElement>('.galaxy-intel-summary');
  const results = dialog.querySelector<HTMLElement>('.galaxy-intel-results');
  if (controls === null || summary === null || results === null) {
    throw new Error('Galaxy intelligence panel containers are missing.');
  }

  const searchLabel = document.createElement('label');
  searchLabel.className = 'galaxy-intel-control galaxy-intel-search';
  const searchCaption = document.createElement('span');
  searchCaption.textContent = 'Поиск';
  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = 'Система, колония или ID';
  searchLabel.append(searchCaption, search);

  const owner = createSelect('Владелец', [
    { value: 'all', label: 'Все' },
    { value: 'self', label: 'Свои' },
    { value: 'foreign', label: 'Чужие контакты' },
    { value: 'unclaimed', label: 'Свободные' },
  ]);
  const visibility = createSelect('Разведка', [
    { value: 'all', label: 'Любая' },
    ...Object.entries(VISIBILITY_LABELS).map(([value, label]) => ({ value, label })),
  ]);
  const biome = createSelect('Биом', [
    { value: 'all', label: 'Любой' },
    ...Object.entries(BIOME_LABELS).map(([value, label]) => ({ value, label })),
  ]);
  const sizeLabel = document.createElement('label');
  sizeLabel.className = 'galaxy-intel-control';
  const sizeCaption = document.createElement('span');
  sizeCaption.textContent = 'Мин. размер';
  const size = document.createElement('input');
  size.type = 'number';
  size.min = '0';
  size.value = '0';
  sizeLabel.append(sizeCaption, size);
  controls.append(searchLabel, owner.label, visibility.label, biome.label, sizeLabel);

  const render = (): void => {
    const state = options.getState();
    const all = createGalaxyIntelligenceView(state, options.empireId ?? 'player');
    const query: GalaxyIntelQuery = {
      search: search.value,
      owner: owner.select.value as GalaxyOwnerFilter,
      visibility: visibility.select.value as GalaxyIntelVisibility | 'all',
      biome: biome.select.value as PlanetBiome | 'all',
      minimumSize: Number(size.value) || 0,
    };
    const filtered = filterGalaxyIntelligence(all, query);
    const totals = summarizeGalaxyIntelligence(all);
    summary.textContent = `Позиций ${totals.totalPositions} · свои ${totals.owned} · актуальные ${totals.current} · устаревшие ${totals.stale} · контакты ${totals.contacts} · свободные ${totals.unclaimed} · показано ${filtered.length}`;
    results.replaceChildren(
      ...filtered.map((planet) => createPlanetCard(planet, () => dialog.close())),
    );
    if (filtered.length === 0) results.textContent = 'По заданным фильтрам ничего не найдено.';
  };

  const open = (): void => {
    render();
    if (!dialog.open) dialog.showModal();
  };

  for (const input of [search, owner.select, visibility.select, biome.select, size]) {
    input.addEventListener('input', render);
    input.addEventListener('change', render);
  }
  document.querySelector<HTMLButtonElement>('#nav-galaxy')?.addEventListener('click', open);
  window.addEventListener(
    GALAXY_SYSTEM_SELECTED_EVENT,
    ((event: Event) => {
      const detail = (event as CustomEvent<GalaxySystemSelectionDetail>).detail;
      search.value = detail.systemName;
      open();
    }) as EventListener,
  );
}
