import '../styles/arenaOperations.css';
import { renderArenaOperationsPanel } from './arenaOperationsPanel';
import type { OperationsShellMode } from './appShellRoute';
import {
  renderEndgameOperationsPanel,
  type EndgameOperationsPanelMode,
} from './endgameOperationsPanel';
import {
  createOperationsSummary,
  mountOperationsWorkspace as mountLegacyOperationsWorkspace,
  type OperationsWorkspace,
  type OperationsWorkspaceOptions,
} from './operationsWorkspaceLegacy';

export { createOperationsSummary };
export type { OperationsWorkspace, OperationsWorkspaceOptions };

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Operations workspace element is missing: ${selector}`);
  return element;
}

function ensureTab(
  tabs: HTMLElement,
  mode: OperationsShellMode,
  label: string,
  beforeSelector: string,
): void {
  if (tabs.querySelector(`[data-operations-mode="${mode}"]`) !== null) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('role', 'tab');
  button.setAttribute('aria-controls', 'operations-workspace-host');
  button.dataset.operationsMode = mode;
  button.textContent = label;
  const before = tabs.querySelector(beforeSelector);
  tabs.insertBefore(button, before);
}

function ensureExtendedTabs(tabs: HTMLElement): void {
  ensureTab(tabs, 'arena', 'Арена и репутация', '[data-operations-mode="market"]');
  ensureTab(tabs, 'alliances', 'Альянсы', '[data-operations-mode="market"]');
  ensureTab(tabs, 'solar-war', 'Солнечная война', '[data-operations-mode="market"]');
}

function isEndgameMode(mode: OperationsShellMode): mode is EndgameOperationsPanelMode {
  return mode === 'alliances' || mode === 'solar-war';
}

export function mountOperationsWorkspace(
  options: OperationsWorkspaceOptions,
): OperationsWorkspace {
  const host = requireElement<HTMLElement>('#operations-workspace-host');
  const tabs = requireElement<HTMLElement>('#operations-route-tabs');
  ensureExtendedTabs(tabs);
  const legacy = mountLegacyOperationsWorkspace(options);
  let mode: OperationsShellMode = 'overview';
  let active = false;

  const refreshExtendedTabs = (): void => {
    for (const button of tabs.querySelectorAll<HTMLButtonElement>('[data-operations-mode]')) {
      const selected = button.dataset.operationsMode === mode;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    }
  };

  const renderExtended = (): void => {
    if (!active) return;
    refreshExtendedTabs();
    if (mode === 'arena') {
      renderArenaOperationsPanel(host, {
        getState: options.getState,
        execute: options.execute,
        refresh: renderExtended,
      });
      return;
    }
    if (isEndgameMode(mode)) {
      renderEndgameOperationsPanel(host, mode, {
        getState: options.getState,
        execute: options.execute,
        refresh: renderExtended,
      });
    }
  };

  return {
    activate: (nextMode) => {
      mode = nextMode;
      active = true;
      if (nextMode === 'arena' || isEndgameMode(nextMode)) {
        legacy.deactivate();
        renderExtended();
      } else {
        legacy.activate(nextMode);
      }
    },
    refresh: () => {
      if (!active) return;
      if (mode === 'arena' || isEndgameMode(mode)) renderExtended();
      else legacy.refresh();
    },
    deactivate: () => {
      active = false;
      legacy.deactivate();
      host.replaceChildren();
    },
    dispose: () => {
      active = false;
      legacy.dispose();
      host.replaceChildren();
    },
  };
}
