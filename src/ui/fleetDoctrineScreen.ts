import '../styles/fleetDoctrine.css';
import {
  CLASS_SKILLS,
  FLEET_FORMATIONS,
  type FleetFormation,
  type FleetTargetPriority,
} from '../simulation/combat/fleetDoctrine';
import type { GameCommand, GameState } from '../simulation/types';

interface FleetDoctrineBridge {
  readonly getState: () => GameState;
  readonly execute: (command: GameCommand, successMessage: string) => boolean;
}

const PRIORITY_NAMES: Readonly<Record<FleetTargetPriority, string>> = {
  balanced: 'Сбалансированный огонь',
  interceptors: 'Перехватчики и малые цели',
  capitals: 'Крупные корабли',
  installations: 'Планетарные установки',
};

function createNavigationButton(): HTMLButtonElement {
  const existing = document.querySelector<HTMLButtonElement>('#nav-fleet-doctrine');
  if (existing !== null) return existing;
  const upgrades = document.querySelector<HTMLButtonElement>('#nav-ship-upgrades');
  const button = document.createElement('button');
  button.id = 'nav-fleet-doctrine';
  button.className = 'rail-button';
  button.type = 'button';
  button.setAttribute('aria-label', 'Боевые доктрины флота');
  button.innerHTML = '<span class="rail-button__icon">◈</span><small>Доктрина</small>';
  upgrades?.insertAdjacentElement('afterend', button);
  if (upgrades === null) document.querySelector<HTMLElement>('.side-rail')?.append(button);
  return button;
}

function createDialog(): HTMLDialogElement {
  const existing = document.querySelector<HTMLDialogElement>('#fleet-doctrine-dialog');
  if (existing !== null) return existing;
  const dialog = document.createElement('dialog');
  dialog.id = 'fleet-doctrine-dialog';
  dialog.className = 'fleet-doctrine-dialog';
  dialog.innerHTML = `
    <header class="fleet-doctrine-header">
      <div><p class="panel-label">Combat Doctrine</p><h2>Формации и приоритеты</h2><p>Настройка доступна только для флотов, находящихся на планете.</p></div>
      <button type="button" class="dialog-close" aria-label="Закрыть доктрины">×</button>
    </header>
    <form class="fleet-doctrine-form">
      <label>Флот<select name="fleet"></select></label>
      <label>Формация<select name="formation"></select></label>
      <label>Приоритет<select name="priority"></select></label>
      <button type="submit" class="primary-button">Применить</button>
    </form>
    <section class="fleet-doctrine-summary"></section>
    <section class="fleet-doctrine-skills" aria-label="Классовые навыки"></section>
  `;
  dialog.querySelector<HTMLButtonElement>('.dialog-close')?.addEventListener('click', () => dialog.close());
  document.body.append(dialog);
  return dialog;
}

export function mountFleetDoctrineScreen(bridge: FleetDoctrineBridge): void {
  const button = createNavigationButton();
  const dialog = createDialog();
  const form = dialog.querySelector<HTMLFormElement>('.fleet-doctrine-form');
  const fleetSelect = form?.elements.namedItem('fleet');
  const formationSelect = form?.elements.namedItem('formation');
  const prioritySelect = form?.elements.namedItem('priority');
  const summary = dialog.querySelector<HTMLElement>('.fleet-doctrine-summary');
  const skills = dialog.querySelector<HTMLElement>('.fleet-doctrine-skills');
  if (
    form === null ||
    !(fleetSelect instanceof HTMLSelectElement) ||
    !(formationSelect instanceof HTMLSelectElement) ||
    !(prioritySelect instanceof HTMLSelectElement) ||
    summary === null ||
    skills === null
  ) {
    throw new Error('Fleet doctrine controls are missing.');
  }

  formationSelect.replaceChildren(
    ...Object.values(FLEET_FORMATIONS).map((formation) => {
      const option = document.createElement('option');
      option.value = formation.id;
      option.textContent = formation.name;
      return option;
    }),
  );
  prioritySelect.replaceChildren(
    ...Object.entries(PRIORITY_NAMES).map(([priority, name]) => {
      const option = document.createElement('option');
      option.value = priority;
      option.textContent = name;
      return option;
    }),
  );
  skills.replaceChildren(
    ...CLASS_SKILLS.map((skill) => {
      const card = document.createElement('article');
      const title = document.createElement('strong');
      title.textContent = skill.name;
      const description = document.createElement('p');
      description.textContent = skill.description;
      card.append(title, description);
      return card;
    }),
  );

  const renderSummary = (): void => {
    const formation = FLEET_FORMATIONS[formationSelect.value as FleetFormation];
    const priority = prioritySelect.value as FleetTargetPriority;
    summary.innerHTML = `
      <article><span>Формация</span><strong>${formation.name}</strong><p>${formation.description}</p></article>
      <article><span>Модификаторы</span><strong>${formation.weaponBonusPercent >= 0 ? '+' : ''}${formation.weaponBonusPercent}% атака · ${formation.armorBonusPercent >= 0 ? '+' : ''}${formation.armorBonusPercent}% защита</strong></article>
      <article><span>Целевой приоритет</span><strong>${PRIORITY_NAMES[priority]}</strong><p>Перераспределяет урон между классами целей, не создавая гарантированного фокуса.</p></article>
    `;
  };

  const render = (): void => {
    const state = bridge.getState();
    const fleets = state.fleets.filter(
      (fleet) =>
        fleet.empireId === 'player' &&
        fleet.status === 'stationed' &&
        fleet.location.type === 'planet',
    );
    const previous = fleetSelect.value;
    fleetSelect.replaceChildren(
      ...fleets.map((fleet) => {
        const option = document.createElement('option');
        option.value = fleet.id;
        option.textContent = `${fleet.id} · ${Object.values(fleet.ships).reduce((total, count) => total + count, 0)} кораблей`;
        return option;
      }),
    );
    if (previous.length > 0 && fleets.some((fleet) => fleet.id === previous)) {
      fleetSelect.value = previous;
    }
    const selected = fleets.find((fleet) => fleet.id === fleetSelect.value) ?? fleets[0];
    form.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled = selected === undefined;
    if (selected !== undefined) {
      fleetSelect.value = selected.id;
      formationSelect.value = selected.formation ?? 'line';
      prioritySelect.value = selected.targetPriority ?? 'balanced';
    }
    renderSummary();
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (fleetSelect.value.length === 0) return;
    if (
      bridge.execute(
        {
          type: 'SET_FLEET_COMBAT_DOCTRINE',
          empireId: 'player',
          fleetId: fleetSelect.value,
          formation: formationSelect.value as FleetFormation,
          targetPriority: prioritySelect.value as FleetTargetPriority,
        },
        'Боевая доктрина флота обновлена',
      )
    ) render();
  });
  fleetSelect.addEventListener('change', render);
  formationSelect.addEventListener('change', renderSummary);
  prioritySelect.addEventListener('change', renderSummary);
  button.addEventListener('click', () => {
    render();
    dialog.showModal();
  });
}
