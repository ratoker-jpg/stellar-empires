import '../styles/commandDoctrine.css';
import {
  COMMAND_DOCTRINES,
  COMMAND_LEVEL_THRESHOLDS,
  FLAGSHIP_UNLOCK_LEVEL,
  getEmpireCommandState,
} from '../simulation/command/commandDoctrine';
import type { CommandDoctrineId } from '../simulation/command/types';
import type { GameCommand, GameState } from '../simulation/types';

interface CommandDoctrineBridge {
  readonly getState: () => GameState;
  readonly execute: (command: GameCommand, successMessage: string) => boolean;
}

function createNavigationButton(): HTMLButtonElement {
  const existing = document.querySelector<HTMLButtonElement>('#nav-command-doctrine');
  if (existing !== null) return existing;
  const fleetDoctrine = document.querySelector<HTMLButtonElement>('#nav-fleet-doctrine');
  const button = document.createElement('button');
  button.id = 'nav-command-doctrine';
  button.className = 'rail-button';
  button.type = 'button';
  button.setAttribute('aria-label', 'Командный профиль');
  button.innerHTML = '<span class="rail-button__icon">✦</span><small>Командир</small>';
  fleetDoctrine?.insertAdjacentElement('afterend', button);
  if (fleetDoctrine === null) document.querySelector<HTMLElement>('.side-rail')?.append(button);
  return button;
}

function createDialog(): HTMLDialogElement {
  const existing = document.querySelector<HTMLDialogElement>('#command-doctrine-dialog');
  if (existing !== null) return existing;
  const dialog = document.createElement('dialog');
  dialog.id = 'command-doctrine-dialog';
  dialog.className = 'command-doctrine-dialog';
  dialog.innerHTML = `
    <header class="command-doctrine-header">
      <div><p class="panel-label">Command Profile</p><h2>Командная доктрина</h2><p>Опыт растёт после боёв. Флагман усиливает назначенный флот.</p></div>
      <button type="button" class="dialog-close" aria-label="Закрыть командный профиль">×</button>
    </header>
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
  `;
  dialog.querySelector<HTMLButtonElement>('.dialog-close')?.addEventListener('click', () => dialog.close());
  document.body.append(dialog);
  return dialog;
}

export function mountCommandDoctrineScreen(bridge: CommandDoctrineBridge): void {
  const button = createNavigationButton();
  const dialog = createDialog();
  const doctrineForm = dialog.querySelector<HTMLFormElement>('.command-doctrine-form');
  const flagshipForm = dialog.querySelector<HTMLFormElement>('.flagship-form');
  const doctrineSelect = doctrineForm?.elements.namedItem('doctrine');
  const fleetSelect = flagshipForm?.elements.namedItem('fleet');
  const progress = dialog.querySelector<HTMLElement>('.command-progress');
  const cards = dialog.querySelector<HTMLElement>('.command-doctrine-cards');
  if (
    doctrineForm === null ||
    flagshipForm === null ||
    !(doctrineSelect instanceof HTMLSelectElement) ||
    !(fleetSelect instanceof HTMLSelectElement) ||
    progress === null ||
    cards === null
  ) throw new Error('Command doctrine controls are missing.');

  doctrineSelect.replaceChildren(
    ...Object.values(COMMAND_DOCTRINES).map((doctrine) => {
      const option = document.createElement('option');
      option.value = doctrine.id;
      option.textContent = doctrine.name;
      return option;
    }),
  );
  cards.replaceChildren(
    ...Object.values(COMMAND_DOCTRINES).map((doctrine) => {
      const card = document.createElement('article');
      const title = document.createElement('strong');
      title.textContent = doctrine.name;
      const description = document.createElement('p');
      description.textContent = doctrine.description;
      card.append(title, description);
      return card;
    }),
  );

  const render = (): void => {
    const state = bridge.getState();
    const command = getEmpireCommandState(state.commanders, 'player');
    if (command === undefined) return;
    doctrineSelect.value = command.doctrineId;
    const nextThreshold = COMMAND_LEVEL_THRESHOLDS[command.level] ?? COMMAND_LEVEL_THRESHOLDS.at(-1)!;
    const currentThreshold = COMMAND_LEVEL_THRESHOLDS[command.level - 1] ?? 0;
    const range = Math.max(1, nextThreshold - currentThreshold);
    const progressPercent = command.level >= COMMAND_LEVEL_THRESHOLDS.length
      ? 100
      : Math.min(100, Math.floor(((command.experience - currentThreshold) * 100) / range));
    progress.innerHTML = `
      <article><span>Уровень командования</span><strong>${command.level}</strong></article>
      <article><span>Опыт</span><strong>${command.experience} / ${nextThreshold}</strong><progress max="100" value="${progressPercent}"></progress></article>
      <article><span>Флагман</span><strong>${command.flagshipFleetId ?? 'не назначен'}</strong></article>
    `;
    const stationed = state.fleets.filter((fleet) =>
      fleet.empireId === 'player' && fleet.status === 'stationed' && fleet.location.type === 'planet',
    );
    fleetSelect.replaceChildren();
    const none = document.createElement('option');
    none.value = '';
    none.textContent = 'Не назначать';
    fleetSelect.append(none);
    for (const fleet of stationed) {
      const option = document.createElement('option');
      option.value = fleet.id;
      option.textContent = `${fleet.id} · ${Object.values(fleet.ships).reduce((sum, count) => sum + count, 0)} кораблей`;
      fleetSelect.append(option);
    }
    fleetSelect.value = command.flagshipFleetId ?? '';
    flagshipForm.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled =
      command.level < FLAGSHIP_UNLOCK_LEVEL && command.flagshipFleetId === null;
  };

  doctrineForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (bridge.execute({
      type: 'SET_COMMAND_DOCTRINE',
      empireId: 'player',
      doctrineId: doctrineSelect.value as CommandDoctrineId,
    }, 'Командная доктрина обновлена')) render();
  });
  flagshipForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (bridge.execute({
      type: 'ASSIGN_FLAGSHIP',
      empireId: 'player',
      fleetId: fleetSelect.value.length > 0 ? fleetSelect.value : null,
    }, 'Флагманское назначение обновлено')) render();
  });
  button.addEventListener('click', () => {
    render();
    dialog.showModal();
  });
}
