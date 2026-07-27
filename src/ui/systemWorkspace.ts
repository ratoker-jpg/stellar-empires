import type { SystemShellMode } from './appShellRoute';
import type { SaveManagerUiMount } from './saveManager';

export interface ClientPresentationSettings {
  readonly reduceMotion: boolean;
  readonly compactLayout: boolean;
}

export interface SystemWorkspaceOptions {
  readonly saves: SaveManagerUiMount;
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
  let mode: SystemShellMode = 'saves';
  settingsHost.innerHTML = `
    <section class="system-settings-card">
      <p class="panel-label">Presentation only</p>
      <h2>Настройки интерфейса</h2>
      <p>Настройки сохраняются только в браузере и не входят в GameState или игровые сохранения.</p>
      <label><input type="checkbox" name="reduce-motion" /><span><strong>Уменьшить движение</strong><small>Отключает переходы и анимационные акценты.</small></span></label>
      <label><input type="checkbox" name="compact-layout" /><span><strong>Компактный интерфейс</strong><small>Уменьшает отступы, сохраняя все primary routes и действия.</small></span></label>
      <button type="button" data-settings-reset>Сбросить настройки</button>
    </section>
  `;
  const reduceMotion = settingsHost.querySelector<HTMLInputElement>('[name="reduce-motion"]')!;
  const compactLayout = settingsHost.querySelector<HTMLInputElement>('[name="compact-layout"]')!;
  const reset = settingsHost.querySelector<HTMLButtonElement>('[data-settings-reset]')!;

  const applyInputs = (): void => {
    const settings = { reduceMotion: reduceMotion.checked, compactLayout: compactLayout.checked };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    applyClientPresentationSettings(settings);
  };
  const readInputs = (): void => {
    const settings = readClientPresentationSettings();
    reduceMotion.checked = settings.reduceMotion;
    compactLayout.checked = settings.compactLayout;
    applyClientPresentationSettings(settings);
  };
  const onReset = (): void => {
    localStorage.removeItem(SETTINGS_KEY);
    reduceMotion.checked = matchMedia('(prefers-reduced-motion: reduce)').matches;
    compactLayout.checked = false;
    applyInputs();
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
  tabs.addEventListener('click', onTabs);
  readInputs();

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
    }
  };

  return {
    activate: (nextMode) => {
      mode = MODES.includes(nextMode) ? nextMode : 'saves';
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
      tabs.removeEventListener('click', onTabs);
      options.saves.dispose();
      settingsHost.replaceChildren();
    },
  };
}
