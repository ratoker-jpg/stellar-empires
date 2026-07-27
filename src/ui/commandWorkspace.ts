import { resolveCompleteMechanicalAsset } from '../assets/completeMechanicalAssetManifest';
import { applyMechanicalAssetArtwork } from '../assets/runtimeMechanicalAssets';
import {
  countCommanderShipForEmpire,
  selectActiveCommanderShip,
} from '../simulation/command/commanderShips';
import {
  COMMAND_DOCTRINES,
  COMMAND_LEVEL_THRESHOLDS,
  FLAGSHIP_UNLOCK_LEVEL,
  getEmpireCommandState,
} from '../simulation/command/commandDoctrine';
import type { CommandDoctrineId } from '../simulation/command/types';
import {
  CLASS_SKILLS,
  FLEET_FORMATIONS,
  type FleetFormation,
  type FleetTargetPriority,
} from '../simulation/combat/fleetDoctrine';
import type { GameCommand, GameState } from '../simulation/types';
import { COMPLETE_COMMANDER_SHIP_CATALOG } from '../simulation/units/completeCommanderShipCatalog';
import { getUnitsByKind } from '../simulation/units/catalog';
import {
  getEmpireShipUpgradeState,
  getShipUpgradeLevels,
  SHIP_UPGRADE_TRACKS,
} from '../simulation/upgrades/shipUpgrades';
import type { CommandShellMode } from './appShellRoute';
import type { EmpireOverviewMount } from './empireOverview';

export interface CommandWorkspaceOptions {
  readonly getState: () => GameState;
  readonly execute: (command: GameCommand, successMessage: string) => boolean;
  readonly overview: EmpireOverviewMount;
  readonly navigateToMode: (mode: CommandShellMode) => void;
  readonly navigateToPlanetUpgrades: () => void;
}

export interface CommandWorkspaceMount {
  activate(mode: CommandShellMode): void;
  deactivate(): void;
  refresh(): void;
  dispose(): void;
}

const PRIORITY_NAMES: Readonly<Record<FleetTargetPriority, string>> = {
  balanced: 'Сбалансированный огонь',
  interceptors: 'Перехватчики и малые цели',
  capitals: 'Крупные корабли',
  installations: 'Планетарные установки',
};

const MODES: readonly CommandShellMode[] = ['overview', 'doctrine', 'fleet-doctrine', 'upgrades'];

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Command workspace element is missing: ${selector}`);
  return element;
}

function createDoctrineWorkspace(host: HTMLElement): void {
  if (host.querySelector('.command-doctrine-form') !== null) return;
  host.innerHTML = `
    <section class="command-progress" aria-live="polite"></section>
    <form class="command-doctrine-form">
      <label>Доктрина<select name="doctrine"></select></label>
      <button type="submit" class="primary-button">Применить доктрину</button>
    </form>
    <form class="flagship-form">
      <label>Флагманский флот<select name="fleet"></select></label>
      <button type="submit" class="primary-button">Назначить флагман</button>
    </form>
    <section class="command-doctrine-cards"></section>
    <div class="commander-roster-heading"><p class="panel-label">Shared Commander Catalog</p><h2>Командирские корабли</h2></div>
    <section class="commander-ship-cards" aria-live="polite"></section>
  `;
}

function createFleetDoctrineWorkspace(host: HTMLElement): void {
  if (host.querySelector('.fleet-doctrine-form') !== null) return;
  host.innerHTML = `
    <form class="fleet-doctrine-form">
      <label>Флот<select name="fleet"></select></label>
      <label>Формация<select name="formation"></select></label>
      <label>Приоритет<select name="priority"></select></label>
      <button type="submit" class="primary-button">Применить</button>
    </form>
    <section class="fleet-doctrine-summary"></section>
    <section class="fleet-doctrine-skills" aria-label="Классовые навыки"></section>
  `;
}

export function mountCommandWorkspace(options: CommandWorkspaceOptions): CommandWorkspaceMount {
  const workspace = requireElement<HTMLElement>('#command-view');
  const tabs = requireElement<HTMLElement>('#command-route-tabs');
  const overviewHost = requireElement<HTMLElement>('#command-overview-view');
  const doctrineHost = requireElement<HTMLElement>('#command-doctrine-view');
  const fleetDoctrineHost = requireElement<HTMLElement>('#fleet-doctrine-view');
  const upgradesHost = requireElement<HTMLElement>('#command-upgrades-view');
  createDoctrineWorkspace(doctrineHost);
  createFleetDoctrineWorkspace(fleetDoctrineHost);
  let active = false;
  let mode: CommandShellMode = 'overview';

  const doctrineForm = doctrineHost.querySelector<HTMLFormElement>('.command-doctrine-form')!;
  const flagshipForm = doctrineHost.querySelector<HTMLFormElement>('.flagship-form')!;
  const doctrineSelect = doctrineForm.elements.namedItem('doctrine') as HTMLSelectElement;
  const flagshipSelect = flagshipForm.elements.namedItem('fleet') as HTMLSelectElement;
  const progress = doctrineHost.querySelector<HTMLElement>('.command-progress')!;
  const doctrineCards = doctrineHost.querySelector<HTMLElement>('.command-doctrine-cards')!;
  const commanderCards = doctrineHost.querySelector<HTMLElement>('.commander-ship-cards')!;

  doctrineSelect.replaceChildren(...Object.values(COMMAND_DOCTRINES).map((doctrine) => {
    const option = document.createElement('option');
    option.value = doctrine.id;
    option.textContent = doctrine.name;
    return option;
  }));
  doctrineCards.replaceChildren(...Object.values(COMMAND_DOCTRINES).map((doctrine) => {
    const card = document.createElement('article');
    const title = document.createElement('strong');
    title.textContent = doctrine.name;
    const description = document.createElement('p');
    description.textContent = doctrine.description;
    card.append(title, description);
    return card;
  }));

  const fleetForm = fleetDoctrineHost.querySelector<HTMLFormElement>('.fleet-doctrine-form')!;
  const fleetSelect = fleetForm.elements.namedItem('fleet') as HTMLSelectElement;
  const formationSelect = fleetForm.elements.namedItem('formation') as HTMLSelectElement;
  const prioritySelect = fleetForm.elements.namedItem('priority') as HTMLSelectElement;
  const fleetSummary = fleetDoctrineHost.querySelector<HTMLElement>('.fleet-doctrine-summary')!;
  const skills = fleetDoctrineHost.querySelector<HTMLElement>('.fleet-doctrine-skills')!;
  formationSelect.replaceChildren(...Object.values(FLEET_FORMATIONS).map((formation) => {
    const option = document.createElement('option');
    option.value = formation.id;
    option.textContent = formation.name;
    return option;
  }));
  prioritySelect.replaceChildren(...Object.entries(PRIORITY_NAMES).map(([priority, name]) => {
    const option = document.createElement('option');
    option.value = priority;
    option.textContent = name;
    return option;
  }));
  skills.replaceChildren(...CLASS_SKILLS.map((skill) => {
    const card = document.createElement('article');
    const title = document.createElement('strong');
    title.textContent = skill.name;
    const description = document.createElement('p');
    description.textContent = skill.description;
    card.append(title, description);
    return card;
  }));

  const renderDoctrine = (): void => {
    const state = options.getState();
    const command = getEmpireCommandState(state.commanders, 'player');
    if (command === undefined) {
      doctrineHost.textContent = 'Командное состояние недоступно.';
      return;
    }
    doctrineSelect.value = command.doctrineId;
    const nextThreshold = COMMAND_LEVEL_THRESHOLDS[command.level] ?? COMMAND_LEVEL_THRESHOLDS.at(-1)!;
    const currentThreshold = COMMAND_LEVEL_THRESHOLDS[command.level - 1] ?? 0;
    const range = Math.max(1, nextThreshold - currentThreshold);
    const progressPercent = command.level >= COMMAND_LEVEL_THRESHOLDS.length
      ? 100
      : Math.min(100, Math.floor(((command.experience - currentThreshold) * 100) / range));
    const flagship = state.fleets.find((fleet) => fleet.id === command.flagshipFleetId);
    const activeCommander = flagship === undefined
      ? undefined
      : selectActiveCommanderShip(command, flagship.id, flagship.ships);
    progress.innerHTML = `
      <article><span>Уровень Адмирала</span><strong>${command.level} / 40</strong></article>
      <article><span>Боевой опыт</span><strong>${command.experience} / ${nextThreshold}</strong><progress max="100" value="${progressPercent}"></progress></article>
      <article><span>Активная способность</span><strong>${activeCommander?.definition.commanderAbility?.name ?? 'не активна'}</strong><small>${activeCommander?.definition.name ?? command.flagshipFleetId ?? 'флагман не назначен'}</small></article>
    `;
    const stationed = state.fleets.filter((fleet) =>
      fleet.empireId === 'player' && fleet.status === 'stationed' && fleet.location.type === 'planet',
    );
    flagshipSelect.replaceChildren();
    const none = document.createElement('option');
    none.value = '';
    none.textContent = 'Не назначать';
    flagshipSelect.append(none);
    for (const fleet of stationed) {
      const option = document.createElement('option');
      option.value = fleet.id;
      const commander = Object.keys(fleet.ships).find((unitId) =>
        COMPLETE_COMMANDER_SHIP_CATALOG.some((definition) => definition.id === unitId),
      );
      option.textContent = `${commander === undefined ? '' : '✦ '}${fleet.id} · ${Object.values(fleet.ships).reduce((sum, count) => sum + count, 0)} кораблей`;
      flagshipSelect.append(option);
    }
    flagshipSelect.value = command.flagshipFleetId ?? '';
    flagshipForm.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled =
      command.level < FLAGSHIP_UNLOCK_LEVEL && command.flagshipFleetId === null;

    commanderCards.replaceChildren(...COMPLETE_COMMANDER_SHIP_CATALOG.map((definition) => {
      const owned = countCommanderShipForEmpire(state, 'player', definition.id) > 0;
      const unlocked = command.level >= (definition.requiredAdmiralLevel ?? 1);
      const isActive = activeCommander?.unitId === definition.id;
      const card = document.createElement('article');
      card.className = `commander-ship-card${isActive ? ' is-active' : ''}${owned ? ' is-owned' : ''}${!owned && unlocked ? ' is-available' : ''}${!unlocked ? ' is-locked' : ''}`;
      card.dataset.mechanicalId = definition.id;
      const status = isActive
        ? 'Активен во флагманском флоте'
        : owned
          ? 'Построен'
          : unlocked
            ? 'Доступен для производства'
            : `Откроется на уровне ${definition.requiredAdmiralLevel}`;
      const art = document.createElement('div');
      art.className = 'commander-ship-card__art';
      art.setAttribute('role', 'img');
      art.setAttribute('aria-label', definition.name);
      const asset = resolveCompleteMechanicalAsset(definition.id).asset;
      if (asset !== undefined) applyMechanicalAssetArtwork(art, asset);
      card.innerHTML = `<header><strong>${definition.name}</strong><span>${status}</span></header><p>${definition.description}</p><dl><div><dt>Адмирал</dt><dd>${definition.requiredAdmiralLevel}</dd></div><div><dt>Верфь</dt><dd>${definition.requiredShipyardLevel}</dd></div><div><dt>Способность</dt><dd>${definition.commanderAbility?.name ?? '—'}</dd></div></dl><small>${definition.commanderAbility?.description ?? ''}</small>`;
      card.prepend(art);
      return card;
    }));
  };

  const renderFleetSummary = (): void => {
    const formation = FLEET_FORMATIONS[formationSelect.value as FleetFormation];
    const priority = prioritySelect.value as FleetTargetPriority;
    fleetSummary.innerHTML = `<article><span>Формация</span><strong>${formation.name}</strong><p>${formation.description}</p></article><article><span>Модификаторы</span><strong>${formation.weaponBonusPercent >= 0 ? '+' : ''}${formation.weaponBonusPercent}% атака · ${formation.armorBonusPercent >= 0 ? '+' : ''}${formation.armorBonusPercent}% защита</strong></article><article><span>Целевой приоритет</span><strong>${PRIORITY_NAMES[priority]}</strong><p>Перераспределяет урон между классами целей, не создавая гарантированного фокуса.</p></article>`;
  };

  const renderFleetDoctrine = (): void => {
    const fleets = options.getState().fleets.filter(
      (fleet) => fleet.empireId === 'player' && fleet.status === 'stationed' && fleet.location.type === 'planet',
    );
    const previous = fleetSelect.value;
    fleetSelect.replaceChildren(...fleets.map((fleet) => {
      const option = document.createElement('option');
      option.value = fleet.id;
      option.textContent = `${fleet.id} · ${Object.values(fleet.ships).reduce((total, count) => total + count, 0)} кораблей`;
      return option;
    }));
    const selected = fleets.find((fleet) => fleet.id === previous) ?? fleets[0];
    fleetForm.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled = selected === undefined;
    if (selected !== undefined) {
      fleetSelect.value = selected.id;
      formationSelect.value = selected.formation ?? 'line';
      prioritySelect.value = selected.targetPriority ?? 'balanced';
    }
    renderFleetSummary();
  };

  const renderUpgrades = (): void => {
    const state = options.getState();
    const upgradeState = getEmpireShipUpgradeState(state.shipUpgrades, 'player');
    const section = document.createElement('section');
    section.className = 'command-upgrade-summary';
    const heading = document.createElement('h2');
    heading.textContent = 'Модернизации корпусов';
    const queue = document.createElement('p');
    queue.textContent = upgradeState?.queue[0] === undefined
      ? 'Очередь модернизации свободна.'
      : `${upgradeState.queue[0].unitId} · ${SHIP_UPGRADE_TRACKS[upgradeState.queue[0].track].name} · уровень ${upgradeState.queue[0].targetLevel}`;
    const grid = document.createElement('div');
    grid.className = 'command-upgrade-grid';
    for (const ship of getUnitsByKind('ship')) {
      const levels = getShipUpgradeLevels(state.shipUpgrades, 'player', ship.id);
      if (levels.weapons + levels.armor + levels.cargo <= 0) continue;
      const card = document.createElement('article');
      card.innerHTML = `<strong>${ship.name}</strong><span>Оружие ${levels.weapons} · Броня ${levels.armor} · Груз ${levels.cargo}</span>`;
      grid.append(card);
    }
    if (grid.childElementCount === 0) grid.textContent = 'Завершённых модернизаций пока нет.';
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'primary-button';
    open.textContent = 'Открыть центр модернизации';
    open.addEventListener('click', options.navigateToPlanetUpgrades, { once: true });
    section.append(heading, queue, grid, open);
    upgradesHost.replaceChildren(section);
  };

  const refreshTabs = (): void => {
    for (const button of tabs.querySelectorAll<HTMLButtonElement>('[data-command-mode]')) {
      const selected = button.dataset.commandMode === mode;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    }
  };

  const render = (): void => {
    if (!active) return;
    refreshTabs();
    overviewHost.hidden = mode !== 'overview';
    doctrineHost.hidden = mode !== 'doctrine';
    fleetDoctrineHost.hidden = mode !== 'fleet-doctrine';
    upgradesHost.hidden = mode !== 'upgrades';
    if (mode === 'overview') options.overview.activate();
    else options.overview.deactivate();
    if (mode === 'doctrine') renderDoctrine();
    if (mode === 'fleet-doctrine') renderFleetDoctrine();
    if (mode === 'upgrades') renderUpgrades();
  };

  const onTabs = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('[data-command-mode]');
    if (button !== null) options.navigateToMode(button.dataset.commandMode as CommandShellMode);
  };
  const onDoctrineSubmit = (event: SubmitEvent): void => {
    event.preventDefault();
    if (options.execute({ type: 'SET_COMMAND_DOCTRINE', empireId: 'player', doctrineId: doctrineSelect.value as CommandDoctrineId }, 'Командная доктрина обновлена')) renderDoctrine();
  };
  const onFlagshipSubmit = (event: SubmitEvent): void => {
    event.preventDefault();
    if (options.execute({ type: 'ASSIGN_FLAGSHIP', empireId: 'player', fleetId: flagshipSelect.value.length > 0 ? flagshipSelect.value : null }, 'Флагманское назначение обновлено')) renderDoctrine();
  };
  const onFleetSubmit = (event: SubmitEvent): void => {
    event.preventDefault();
    if (fleetSelect.value.length === 0) return;
    if (options.execute({ type: 'SET_FLEET_COMBAT_DOCTRINE', empireId: 'player', fleetId: fleetSelect.value, formation: formationSelect.value as FleetFormation, targetPriority: prioritySelect.value as FleetTargetPriority }, 'Боевая доктрина флота обновлена')) renderFleetDoctrine();
  };
  tabs.addEventListener('click', onTabs);
  doctrineForm.addEventListener('submit', onDoctrineSubmit);
  flagshipForm.addEventListener('submit', onFlagshipSubmit);
  fleetForm.addEventListener('submit', onFleetSubmit);
  fleetSelect.addEventListener('change', renderFleetDoctrine);
  formationSelect.addEventListener('change', renderFleetSummary);
  prioritySelect.addEventListener('change', renderFleetSummary);

  return {
    activate: (nextMode) => {
      active = true;
      mode = MODES.includes(nextMode) ? nextMode : 'overview';
      workspace.hidden = false;
      render();
    },
    deactivate: () => {
      active = false;
      workspace.hidden = true;
      options.overview.deactivate();
    },
    refresh: () => {
      options.overview.refresh();
      render();
    },
    dispose: () => {
      tabs.removeEventListener('click', onTabs);
      doctrineForm.removeEventListener('submit', onDoctrineSubmit);
      flagshipForm.removeEventListener('submit', onFlagshipSubmit);
      fleetForm.removeEventListener('submit', onFleetSubmit);
      fleetSelect.removeEventListener('change', renderFleetDoctrine);
      formationSelect.removeEventListener('change', renderFleetSummary);
      prioritySelect.removeEventListener('change', renderFleetSummary);
      options.overview.dispose();
      doctrineHost.replaceChildren();
      fleetDoctrineHost.replaceChildren();
      upgradesHost.replaceChildren();
    },
  };
}
