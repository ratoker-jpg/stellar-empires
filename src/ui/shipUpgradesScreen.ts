import '../styles/shipUpgrades.css';
import { getFleetShipArtUrl } from '../assets/galaxyFleetRuntimeAssets';
import type { GameCommand, GameState } from '../simulation/types';
import { getUnitsByKind } from '../simulation/units/catalog';
import {
  calculateShipUpgradeCost,
  getEmpireShipUpgradeState,
  getShipUpgradeLevels,
  SHIP_UPGRADE_MAX_LEVEL,
  SHIP_UPGRADE_TRACKS,
} from '../simulation/upgrades/shipUpgrades';
import type { ShipUpgradeTrack } from '../simulation/upgrades/types';

interface ShipUpgradeBridge {
  readonly getState: () => GameState;
  readonly getActivePlanetId: () => string;
  readonly execute: (command: GameCommand, successMessage: string) => boolean;
}

const NUMBER_FORMAT = new Intl.NumberFormat('ru-RU');
const SHIPS = getUnitsByKind('ship');
const TRACKS = Object.keys(SHIP_UPGRADE_TRACKS) as ShipUpgradeTrack[];

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours > 0 ? `${hours}ч ${minutes}м` : `${minutes}м ${remainder}с`;
}

function createNavigationButton(): HTMLButtonElement {
  const existing = document.querySelector<HTMLButtonElement>('#nav-ship-upgrades');
  if (existing !== null) return existing;
  const fleets = document.querySelector<HTMLButtonElement>('#nav-fleets');
  const button = document.createElement('button');
  button.id = 'nav-ship-upgrades';
  button.className = 'rail-button';
  button.type = 'button';
  button.setAttribute('aria-label', 'Улучшения кораблей');
  button.innerHTML = '<span class="rail-button__icon">⬡</span><small>Улучшения</small>';
  fleets?.insertAdjacentElement('afterend', button);
  if (fleets === null) document.querySelector<HTMLElement>('.side-rail')?.append(button);
  return button;
}

function createDialog(): HTMLDialogElement {
  const existing = document.querySelector<HTMLDialogElement>('#ship-upgrades-dialog');
  if (existing !== null) return existing;
  const dialog = document.createElement('dialog');
  dialog.id = 'ship-upgrades-dialog';
  dialog.className = 'ship-upgrades-dialog';
  dialog.innerHTML = `
    <header class="ship-upgrades-header">
      <div><p class="panel-label">Hull Development</p><h2>Модернизация кораблей</h2><p>Отдельные уровни вооружения, брони и грузовых систем для каждого корпуса.</p></div>
      <button type="button" class="dialog-close" aria-label="Закрыть улучшения">×</button>
    </header>
    <section class="ship-upgrade-queue"></section>
    <form class="ship-upgrade-form">
      <label>Планета<select name="planet"></select></label>
      <label>Корпус<select name="unit"></select></label>
      <label>Направление<select name="track"></select></label>
      <div class="ship-upgrade-quote"></div>
      <button type="submit" class="primary-button">Запустить улучшение</button>
    </form>
    <section class="ship-upgrade-grid"></section>
  `;
  dialog.querySelector<HTMLButtonElement>('.dialog-close')?.addEventListener('click', () => dialog.close());
  document.body.append(dialog);
  return dialog;
}

export function mountShipUpgradesScreen(bridge: ShipUpgradeBridge): void {
  const button = createNavigationButton();
  const dialog = createDialog();
  const form = dialog.querySelector<HTMLFormElement>('.ship-upgrade-form');
  const planetSelect = form?.elements.namedItem('planet');
  const unitSelect = form?.elements.namedItem('unit');
  const trackSelect = form?.elements.namedItem('track');
  const quote = dialog.querySelector<HTMLElement>('.ship-upgrade-quote');
  const queueHost = dialog.querySelector<HTMLElement>('.ship-upgrade-queue');
  const grid = dialog.querySelector<HTMLElement>('.ship-upgrade-grid');
  if (
    form === null ||
    !(planetSelect instanceof HTMLSelectElement) ||
    !(unitSelect instanceof HTMLSelectElement) ||
    !(trackSelect instanceof HTMLSelectElement) ||
    quote === null ||
    queueHost === null ||
    grid === null
  ) {
    throw new Error('Ship upgrade screen controls are missing.');
  }

  unitSelect.replaceChildren(
    ...SHIPS.map((ship) => {
      const option = document.createElement('option');
      option.value = ship.id;
      option.textContent = ship.name;
      return option;
    }),
  );
  trackSelect.replaceChildren(
    ...TRACKS.map((track) => {
      const option = document.createElement('option');
      option.value = track;
      option.textContent = SHIP_UPGRADE_TRACKS[track].name;
      return option;
    }),
  );

  const render = (): void => {
    const state = bridge.getState();
    const playerPlanets = state.planets.filter((planet) => planet.ownerEmpireId === 'player');
    const previousPlanet = planetSelect.value || bridge.getActivePlanetId();
    planetSelect.replaceChildren(
      ...playerPlanets.map((planet) => {
        const option = document.createElement('option');
        option.value = planet.id;
        option.textContent = planet.name;
        option.selected = planet.id === previousPlanet;
        return option;
      }),
    );
    if (planetSelect.value.length === 0 && playerPlanets[0] !== undefined) {
      planetSelect.value = playerPlanets[0].id;
    }

    const empireState = getEmpireShipUpgradeState(state.shipUpgrades, 'player');
    const active = empireState?.queue[0];
    queueHost.replaceChildren();
    if (active === undefined) {
      queueHost.innerHTML = '<span class="status-badge status-badge--ready">Очередь свободна</span><p>Одновременно выполняется одно улучшение на всю империю.</p>';
    } else {
      const ship = SHIPS.find((candidate) => candidate.id === active.unitId);
      const copy = document.createElement('div');
      copy.innerHTML = `<span class="status-badge status-badge--active">В работе</span><strong>${ship?.name ?? active.unitId} · ${SHIP_UPGRADE_TRACKS[active.track].name} ${active.targetLevel}</strong><small>Осталось ${formatDuration(Math.max(0, active.completesAt - state.clock.elapsedSeconds))}</small>`;
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'danger-button';
      cancel.textContent = 'Отменить';
      cancel.addEventListener('click', () => {
        if (
          bridge.execute(
            { type: 'CANCEL_SHIP_UPGRADE', empireId: 'player', queueItemId: active.id },
            'Улучшение отменено, возвращено 70% ресурсов',
          )
        ) render();
      });
      queueHost.append(copy, cancel);
    }

    const selectedUnit = unitSelect.value || SHIPS[0]?.id;
    const selectedTrack = (trackSelect.value || TRACKS[0]) as ShipUpgradeTrack;
    if (selectedUnit !== undefined) {
      const current = getShipUpgradeLevels(state.shipUpgrades, 'player', selectedUnit)[selectedTrack];
      const cost = calculateShipUpgradeCost(selectedUnit, selectedTrack, current + 1);
      quote.textContent =
        current >= SHIP_UPGRADE_MAX_LEVEL
          ? `Максимальный уровень ${SHIP_UPGRADE_MAX_LEVEL}`
          : cost === undefined
            ? 'Стоимость недоступна'
            : `Уровень ${current} → ${current + 1} · ${NUMBER_FORMAT.format(cost.metal)} M · ${NUMBER_FORMAT.format(cost.crystal)} C · ${NUMBER_FORMAT.format(cost.gas)} G · +${SHIP_UPGRADE_TRACKS[selectedTrack].percentPerLevel}%`;
    }

    grid.replaceChildren();
    const factionId = playerPlanets[0]?.factionId ?? 'aegis';
    for (const ship of SHIPS) {
      const levels = getShipUpgradeLevels(state.shipUpgrades, 'player', ship.id);
      const card = document.createElement('article');
      card.className = 'ship-upgrade-card';
      const art = document.createElement('img');
      art.src = getFleetShipArtUrl(factionId, ship.id);
      art.alt = '';
      const body = document.createElement('div');
      const title = document.createElement('h3');
      title.textContent = ship.name;
      const stats = document.createElement('p');
      stats.textContent = `Вооружение ${levels.weapons}/${SHIP_UPGRADE_MAX_LEVEL} · Броня ${levels.armor}/${SHIP_UPGRADE_MAX_LEVEL} · Груз ${levels.cargo}/${SHIP_UPGRADE_MAX_LEVEL}`;
      body.append(title, stats);
      card.append(art, body);
      card.addEventListener('click', () => {
        unitSelect.value = ship.id;
        render();
      });
      grid.append(card);
    }
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const unitId = unitSelect.value;
    const track = trackSelect.value as ShipUpgradeTrack;
    const planetId = planetSelect.value;
    if (unitId.length === 0 || planetId.length === 0 || !TRACKS.includes(track)) return;
    if (
      bridge.execute(
        { type: 'QUEUE_SHIP_UPGRADE', empireId: 'player', planetId, unitId, track },
        'Улучшение корабля поставлено в очередь',
      )
    ) render();
  });
  unitSelect.addEventListener('change', render);
  trackSelect.addEventListener('change', render);
  planetSelect.addEventListener('change', render);
  button.addEventListener('click', () => {
    render();
    dialog.showModal();
  });
}
