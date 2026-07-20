type SandboxFaction = 'aegis' | 'synod' | 'veyra';

const FACTIONS: readonly SandboxFaction[] = ['aegis', 'synod', 'veyra'];

function element<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tagName);
  if (className !== undefined) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function createPanel(title: string, meta: string): {
  readonly panel: HTMLElement;
  readonly body: HTMLElement;
} {
  const panel = element('section', 'se-panel');
  const header = element('header', 'se-panel__header');
  const titleBlock = element('div');
  titleBlock.append(
    element('h2', 'se-panel__title', title),
    element('p', 'se-panel__meta', meta),
  );
  header.append(titleBlock);
  const body = element('div', 'se-panel__body');
  panel.append(header, body);
  return { panel, body };
}

function createButton(
  label: string,
  variant: 'primary' | 'secondary' | 'neutral' | 'danger',
  disabled = false,
): HTMLButtonElement {
  const button = element('button', `se-button se-button--${variant}`, label);
  button.type = 'button';
  button.disabled = disabled;
  return button;
}

function createThemeSwitcher(): HTMLElement {
  const container = element('div', 'ui-sandbox__theme-switcher');
  for (const faction of FACTIONS) {
    const button = createButton(faction.toUpperCase(), 'secondary');
    button.dataset.faction = faction;
    button.addEventListener('click', () => {
      document.documentElement.dataset.faction = faction;
      for (const candidate of container.querySelectorAll<HTMLButtonElement>('[data-faction]')) {
        candidate.setAttribute('aria-pressed', String(candidate.dataset.faction === faction));
      }
    });
    button.setAttribute('aria-pressed', String(faction === 'aegis'));
    container.append(button);
  }
  return container;
}

function createTabs(): HTMLElement {
  const tabs = element('div', 'se-tab-list');
  const items = [
    ['◉', 'Планета'],
    ['◆', 'Флоты'],
    ['✦', 'Галактика'],
    ['⌬', 'Наука'],
    ['▦', 'Командование'],
    ['▤', 'Рейтинг'],
  ] as const;
  items.forEach(([icon, label], index) => {
    const tab = element('button', 'se-tab');
    tab.type = 'button';
    tab.setAttribute('aria-selected', String(index === 0));
    tab.append(
      element('span', 'se-tab__icon', icon),
      element('span', 'se-tab__label', label),
    );
    tabs.append(tab);
  });
  return tabs;
}

function createQueue(): HTMLElement {
  const queue = element('div', 'se-queue');
  const entries = [
    { icon: '⌂', name: 'Командный центр', detail: 'L3 · 04:16', state: 'active' },
    { icon: '⚙', name: 'Верфь', detail: 'L2 · в очереди', state: 'queued' },
    { icon: '◇', name: 'Свободно', detail: 'Нет задачи', state: 'empty' },
    { icon: '×', name: 'Закрыто', detail: 'Нужна технология', state: 'locked' },
  ] as const;
  for (const entry of entries) {
    const slot = element('article', 'se-slot');
    slot.dataset.state = entry.state;
    slot.append(element('span', 'se-slot__icon', entry.icon));
    const text = element('div');
    text.append(element('strong', undefined, entry.name), element('small', undefined, entry.detail));
    slot.append(text);
    queue.append(slot);
  }
  return queue;
}

function createPreview(): HTMLElement {
  const panel = element('section', 'se-panel ui-sandbox__preview ui-sandbox__wide');
  const layout = element('div', 'ui-sandbox__preview-layout');
  const context = element('aside', 'ui-sandbox__context');
  context.append(
    element('p', 'se-panel__meta', 'Resource Zone'),
    element('h3', 'se-panel__title', 'Ресурсная зона'),
    element(
      'p',
      undefined,
      'Контекстная панель содержит показатели зоны, каталог зданий и одно основное действие.',
    ),
    createButton('Построить', 'primary'),
  );
  const stage = element('div', 'ui-sandbox__stage');
  stage.append(createQueue(), element('div', 'ui-sandbox__scene', 'Игровая территория / сцена'));
  layout.append(context, stage);
  panel.append(layout);
  return panel;
}

export function mountDesignSystemSandbox(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('ui-sandbox')) return false;

  document.documentElement.dataset.faction = 'aegis';
  document.body.dataset.uiSandbox = 'true';
  const root = element('main', 'ui-sandbox');

  const hero = element('section', 'se-panel ui-sandbox__hero');
  const heroText = element('div');
  heroText.append(
    element('p', 'se-panel__meta', 'Stellar Empires UI Foundation'),
    element('h1', undefined, 'Design System v1'),
    element(
      'p',
      undefined,
      'Оригинальная sci-fi компонентная система: структура классической браузерной стратегии без копирования конкретной графики.',
    ),
  );
  hero.append(heroText, createThemeSwitcher());

  const grid = element('div', 'ui-sandbox__grid');

  const buttons = createPanel('Кнопки', 'Все базовые состояния');
  const buttonStack = element('div', 'ui-sandbox__stack');
  buttonStack.append(
    createButton('Главное действие', 'primary'),
    createButton('Вторичное', 'secondary'),
    createButton('Служебное', 'neutral'),
    createButton('Удалить', 'danger'),
    createButton('Недоступно', 'neutral', true),
  );
  buttons.body.append(buttonStack);

  const badges = createPanel('Статусы', 'Не полагаются только на цвет');
  const badgeStack = element('div', 'ui-sandbox__stack');
  const badgeData = [
    ['se-badge', 'Активно'],
    ['se-badge se-badge--success', 'Готово'],
    ['se-badge se-badge--warning', 'Внимание'],
    ['se-badge se-badge--danger', 'Опасность'],
    ['se-badge se-badge--locked', 'Заблокировано'],
  ] as const;
  for (const [className, label] of badgeData) badgeStack.append(element('span', className, label));
  badges.body.append(badgeStack);

  const forms = createPanel('Поля управления', 'Единый размер и focus-visible');
  const formGrid = element('div', 'ui-sandbox__form');
  const inputLabel = element('label', 'ui-sandbox__label', 'Поиск');
  const input = element('input', 'se-input');
  input.placeholder = 'Планета, система или флот';
  inputLabel.append(input);
  const selectLabel = element('label', 'ui-sandbox__label', 'Активная колония');
  const select = element('select', 'se-select');
  for (const label of ['Гоффин', 'Талос', 'Орбита-7']) {
    const option = element('option', undefined, label);
    select.append(option);
  }
  selectLabel.append(select);
  formGrid.append(inputLabel, selectLabel);
  forms.body.append(formGrid);

  const cards = createPanel('Карточки и прогресс', 'Selected / hover / capacity');
  const cardGrid = element('div', 'ui-sandbox__form');
  for (const selected of [false, true]) {
    const card = element('article', 'se-card');
    card.dataset.interactive = 'true';
    card.dataset.selected = String(selected);
    card.append(
      element('span', 'se-badge', selected ? 'Выбрано' : 'Доступно'),
      element('strong', undefined, selected ? 'Плазменная турель' : 'Шахта металла'),
      element('p', undefined, selected ? 'Контр-профиль: heavy armor.' : 'Уровень 3 · добыча 420/ч.'),
    );
    const progress = element('div', 'se-progress');
    progress.style.setProperty('--se-progress', selected ? '78%' : '46%');
    progress.append(element('i'));
    card.append(progress);
    cardGrid.append(card);
  }
  cards.body.append(cardGrid);

  const navigation = createPanel('Навигация', 'Шесть основных разделов');
  navigation.panel.classList.add('ui-sandbox__wide');
  navigation.body.append(createTabs());

  grid.append(buttons.panel, badges.panel, forms.panel, cards.panel, navigation.panel, createPreview());
  root.append(hero, grid);
  document.body.replaceChildren(root);
  document.title = 'Stellar Empires · UI Sandbox';
  return true;
}
