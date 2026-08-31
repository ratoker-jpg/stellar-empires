import { formatProgressionProfile } from '../simulation/campaign/settings';
import type { GameState } from '../simulation/types';
import type { SystemShellMode } from './appShellRoute';
import type { SaveManagerUiMount } from './saveManager';

export interface ClientPresentationSettings {
  readonly reduceMotion: boolean;
  readonly compactLayout: boolean;
}

export interface SystemWorkspaceOptions {
  readonly saves: SaveManagerUiMount;
  readonly getState: () => GameState;
  readonly navigateToMode: (mode: SystemShellMode) => void;
}

export interface SystemWorkspaceMount {
  activate(mode: SystemShellMode): void;
  deactivate(): void;
  refresh(): void;
  dispose(): void;
}

const SETTINGS_KEY = 'stellar-empires:client-settings:v1';
const MODES: readonly SystemShellMode[] = ['saves', 'settings'];
const SETTINGS_CATEGORIES = [
  { id: 'graphics', label: 'Графика' },
  { id: 'sound', label: 'Звук' },
  { id: 'interface', label: 'Интерфейс' },
  { id: 'controls', label: 'Управление' },
  { id: 'notifications', label: 'Уведомления' },
  { id: 'campaign', label: 'Кампания и сохранения' },
] as const;
type SettingsCategory = (typeof SETTINGS_CATEGORIES)[number]['id'];

export function readClientPresentationSettings(storage: Storage = localStorage): ClientPresentationSettings {
  try {
    const parsed = JSON.parse(storage.getItem(SETTINGS_KEY) ?? '{}') as Partial<ClientPresentationSettings>;
    return {
      reduceMotion: parsed.reduceMotion ?? matchMedia('(prefers-reduced-motion: reduce)').matches,
      compactLayout: parsed.compactLayout ?? false,
    };
  } catch {
    return {
      reduceMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      compactLayout: false,
    };
  }
}

export function applyClientPresentationSettings(settings: ClientPresentationSettings): void {
  document.documentElement.dataset.motionPreference = settings.reduceMotion ? 'reduce' : 'system';
  document.documentElement.dataset.uiDensity = settings.compactLayout ? 'compact' : 'normal';
}

export function mountSystemWorkspace(options: SystemWorkspaceOptions): SystemWorkspaceMount {
  const workspace = document.querySelector<HTMLElement>('#system-view');
  const tabs = document.querySelector<HTMLElement>('#system-route-tabs');
  const savesHost = document.querySelector<HTMLElement>('#system-saves-view');
  const settingsHost = document.querySelector<HTMLElement>('#system-settings-view');
  if (workspace === null || tabs === null || savesHost === null || settingsHost === null) {
    throw new Error('System workspace is missing.');
  }
  let active = false;
  let mode: SystemShellMode = 'settings';
  let category: SettingsCategory = 'interface';
  settingsHost.innerHTML = `
    <div class="system-settings-layout" data-testid="settings-category-layout">
      <nav class="system-settings-categories" aria-label="Категории настроек">
        ${SETTINGS_CATEGORIES.map(({ id, label }) => `<button type="button" data-settings-category="${id}" aria-pressed="false">${label}</button>`).join('')}
      </nav>
      <div class="system-settings-sections">
        <section class="system-settings-card" data-settings-panel="graphics">
          <p class="panel-label">Graphics</p>
          <h2>Графика</h2>
          <p>Визуальный профиль использует адаптивное качество интерфейса и текущие Stellar-ассеты. Параметры здесь не меняют симуляцию.</p>
          <div class="system-settings-status-grid">
            <article><span>Качество интерфейса</span><strong>Автоматически</strong><small>Подстраивается под viewport и устройство.</small></article>
            <article><span>Эффекты оболочки</span><strong>Процедурные</strong><small>CSS/SVG/canvas без внешних runtime-зависимостей.</small></article>
          </div>
        </section>
        <section class="system-settings-card" data-settings-panel="sound" hidden>
          <p class="panel-label">Sound</p>
          <h2>Звук</h2>
          <p>Отдельный звуковой микшер пока не является игровым состоянием. Интерфейс не создаёт фиктивные настройки, которые не поддерживаются runtime.</p>
          <div class="system-settings-status-grid">
            <article><span>Музыка</span><strong>Runtime default</strong><small>Без изменения GameState.</small></article>
            <article><span>Эффекты</span><strong>Runtime default</strong><small>Без изменения save-формата.</small></article>
          </div>
        </section>
        <section class="system-settings-card" data-settings-panel="interface" hidden>
          <p class="panel-label">Interface</p>
          <h2>Интерфейс</h2>
          <p>Эти параметры сохраняются только в браузере и не входят в GameState.</p>
          <label><input type="checkbox" name="reduce-motion" /><span><strong>Уменьшить движение</strong><small>Отключает переходы и анимационные акценты.</small></span></label>
          <label><input type="checkbox" name="compact-layout" /><span><strong>Компактный интерфейс</strong><small>Уменьшает отступы, сохраняя primary routes и действия.</small></span></label>
          <button type="button" data-settings-reset>Сбросить настройки интерфейса</button>
        </section>
        <section class="system-settings-card" data-settings-panel="controls" hidden>
          <p class="panel-label">Controls</p>
          <h2>Управление</h2>
          <p>Клавиатурная навигация следует общему shell-контракту.</p>
          <div class="system-settings-status-grid">
            <article><span>Primary navigation</span><strong>← / → + Enter</strong><small>Перемещение между девятью основными разделами.</small></article>
            <article><span>Диалоги</span><strong>Escape</strong><small>Закрывает доступные overlay/dialog поверхности.</small></article>
          </div>
        </section>
        <section class="system-settings-card" data-settings-panel="notifications" hidden>
          <p class="panel-label">Notifications</p>
          <h2>Уведомления</h2>
          <p>Статусы очередей, полётов и сохранений показываются в соответствующих рабочих областях и HUD.</p>
          <div class="system-settings-status-grid">
            <article><span>Очереди</span><strong>В интерфейсе</strong><small>Прогресс и завершение рядом с владельцем задачи.</small></article>
            <article><span>Сохранения</span><strong>HUD + Save Manager</strong><small>Без фоновых внешних уведомлений.</small></article>
          </div>
        </section>
        <section class="system-settings-card" data-settings-panel="campaign" hidden>
          <p class="panel-label">Campaign & Saves</p>
          <h2>Кампания и сохранения</h2>
          <p>Профиль кампании и save lifecycle остаются существующей локальной системой, а не новым глобальным маршрутом.</p>
          <div class="system-campaign-profile"><span>Профиль кампании</span><strong data-campaign-profile></strong><small>Входит в checksum и не меняется после создания.</small></div>
          <button type="button" data-open-saves>Открыть сохранения</button>
        </section>
      </div>
    </div>
  `;
  const reduceMotion = settingsHost.querySelector<HTMLInputElement>('[name="reduce-motion"]')!;
  const compactLayout = settingsHost.querySelector<HTMLInputElement>('[name="compact-layout"]')!;
  const reset = settingsHost.querySelector<HTMLButtonElement>('[data-settings-reset]')!;
  const campaignProfile = settingsHost.querySelector<HTMLElement>('[data-campaign-profile]')!;
  const openSaves = settingsHost.querySelector<HTMLButtonElement>('[data-open-saves]')!;
  const categoryNav = settingsHost.querySelector<HTMLElement>('.system-settings-categories')!;

  const applyInputs = (): void => {
    const settings = { reduceMotion: reduceMotion.checked, compactLayout: compactLayout.checked };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    applyClientPresentationSettings(settings);
  };
  const readInputs = (): void => {
    const settings = readClientPresentationSettings();
    reduceMotion.checked = settings.reduceMotion;
    compactLayout.checked = settings.compactLayout;
    const progressionProfile = options.getState().campaignSettings.progressionProfile;
    campaignProfile.dataset.progressionProfile = progressionProfile;
    campaignProfile.textContent = formatProgressionProfile(progressionProfile);
    applyClientPresentationSettings(settings);
  };
  const renderCategory = (): void => {
    for (const button of categoryNav.querySelectorAll<HTMLButtonElement>('[data-settings-category]')) {
      button.setAttribute('aria-pressed', String(button.dataset.settingsCategory === category));
    }
    for (const panel of settingsHost.querySelectorAll<HTMLElement>('[data-settings-panel]')) {
      panel.hidden = panel.dataset.settingsPanel !== category;
    }
  };
  const onReset = (): void => {
    localStorage.removeItem(SETTINGS_KEY);
    reduceMotion.checked = matchMedia('(prefers-reduced-motion: reduce)').matches;
    compactLayout.checked = false;
    applyInputs();
  };
  const onCategory = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('[data-settings-category]');
    if (button === null) return;
    const requested = button.dataset.settingsCategory as SettingsCategory;
    if (!SETTINGS_CATEGORIES.some((candidate) => candidate.id === requested)) return;
    category = requested;
    renderCategory();
  };
  const onTabs = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('[data-system-mode]');
    if (button !== null) options.navigateToMode(button.dataset.systemMode as SystemShellMode);
  };
  reduceMotion.addEventListener('change', applyInputs);
  compactLayout.addEventListener('change', applyInputs);
  reset.addEventListener('click', onReset);
  openSaves.addEventListener('click', () => options.navigateToMode('saves'));
  categoryNav.addEventListener('click', onCategory);
  tabs.addEventListener('click', onTabs);
  readInputs();
  renderCategory();

  const render = (): void => {
    if (!active) return;
    for (const button of tabs.querySelectorAll<HTMLButtonElement>('[data-system-mode]')) {
      const selected = button.dataset.systemMode === mode;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    }
    savesHost.hidden = mode !== 'saves';
    settingsHost.hidden = mode !== 'settings';
    if (mode === 'saves') options.saves.activate();
    else {
      options.saves.deactivate();
      readInputs();
      renderCategory();
    }
  };

  return {
    activate: (nextMode) => {
      mode = MODES.includes(nextMode) ? nextMode : 'settings';
      active = true;
      workspace.hidden = false;
      render();
    },
    deactivate: () => {
      active = false;
      workspace.hidden = true;
      options.saves.deactivate();
    },
    refresh: () => {
      options.saves.refresh();
      render();
    },
    dispose: () => {
      reduceMotion.removeEventListener('change', applyInputs);
      compactLayout.removeEventListener('change', applyInputs);
      reset.removeEventListener('click', onReset);
      categoryNav.removeEventListener('click', onCategory);
      tabs.removeEventListener('click', onTabs);
      options.saves.dispose();
      settingsHost.replaceChildren();
    },
  };
}
