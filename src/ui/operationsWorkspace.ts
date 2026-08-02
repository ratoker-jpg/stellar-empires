import '../styles/arenaOperations.css';
import { renderArenaOperationsPanel } from './arenaOperationsPanel';
import type { OperationsShellMode } from './appShellRoute';
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

function ensureArenaTab(tabs: HTMLElement): void {
  if (tabs.querySelector('[data-operations-mode="arena"]') !== null) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('role', 'tab');
  button.dataset.operationsMode = 'arena';
  button.textContent = 'Арена и репутация';
  const market = tabs.querySelector('[data-operations-mode="market"]');
  tabs.insertBefore(button, market);
}

export function mountOperationsWorkspace(
  options: OperationsWorkspaceOptions,
): OperationsWorkspace {
  const host = requireElement<HTMLElement>('#operations-workspace-host');
  const tabs = requireElement<HTMLElement>('#operations-route-tabs');
  ensureArenaTab(tabs);
  const legacy = mountLegacyOperationsWorkspace(options);
  let mode: OperationsShellMode = 'overview';
  let active = false;

  const refreshArenaTabs = (): void => {
    for (const button of tabs.querySelectorAll<HTMLButtonElement>('[data-operations-mode]')) {
      const selected = button.dataset.operationsMode === 'arena';
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    }
  };

  const renderArena = (): void => {
    if (!active || mode !== 'arena') return;
    refreshArenaTabs();
    renderArenaOperationsPanel(host, {
      getState: options.getState,
      execute: options.execute,
      refresh: renderArena,
    });
  };

  return {
    activate: (nextMode) => {
      mode = nextMode;
      active = true;
      if (nextMode === 'arena') {
        legacy.deactivate();
        renderArena();
      } else {
        legacy.activate(nextMode);
      }
    },
    refresh: () => {
      if (!active) return;
      if (mode === 'arena') renderArena();
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
