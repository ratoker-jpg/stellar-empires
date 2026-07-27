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

export interface ShipUpgradesScreenMount {
  activate(): void;
  deactivate(): void;
  refresh(): void;
  dispose(): void;
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

function requireHost(): HTMLElement {
  const host = document.querySelector<HTMLElement>('#ship-upgrades-view');
  if (host === null) throw new Error('Ship upgrades workspace is missing.');
  return host;
}

function createWorkspace(host: HTMLElement): void {
  if (host.querySelector('.ship-upgrade-form') !== null) return;
  host.innerHTML = `
    <header class="ship-upgrades-header">
      <div><p class="panel-label">Hull Development</p><h1 tabindex="-1">Модернизация кораблей</h1><p>Отдельные уровни вооружения, брони и грузовых систем для каждого корпуса.</p></div>
    </header>
    <section class="ship-upgrade-queue" data-testid="ship-upgrade-queue"></section>
    <form class="ship-upgrade-form">
      <label>Планета<select name="planet"></select></label>
      <label>Корпус<select name="unit"></select></label>
      <label>Направление<select name="track"></select></label>
      <div class="ship-upgrade-quote"></div>
      <button type="submit" class="primary-button">Запустить улучшение</button>
    </form>
    <section class="ship-upgrade-grid" data-testid="ship-upgrade-grid"></section>
  `;
}

export function mountShipUpgradesScreen(bridge: ShipUpgradeBridge): ShipUpgradesScreenMount {
  const host = requireHost();
  createWorkspace(host);
  const form = host.querySelector<HTMLFormElement>('.ship-upgrade-form');
  const planetSelect = form?.elements.namedItem('planet');
  const unitSelect = form?.elements.namedItem('unit');
  const trackSelect = form?.elements.namedItem('track');
  const quote = host.querySelector<HTMLElement>('.ship-upgrade-quote');
  const queueHost = host.querySelector<HTMLElement>('.ship-upgrade-queue');
  const grid = host.querySelector<HTMLElement>('.ship-upgrade-grid');
  if (
    form === null ||
    !(planetSelect instanceof HTMLSelectElement) ||
    !(unitSelect instanceof HTMLSelectElement) ||
    !(trackSelect instanceof HTMLSelectElement) ||
    quote === null || queueHost === null || grid === null
  ) throw new Error('Ship upgrade workspace controls are missing.');
  let active = false;

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
    const activePlanet = playerPlanets.find((planet) => planet.id === bridge.getActivePlanetId()) ?? playerPlanets[0];
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
    if (planetSelect.value.length === 0 && activePlanet !== undefined) planetSelect.value = activePlanet.id;

    const factionShips = activePlanet === undefined ? SHIPS : getUnitsByKind('ship', activePlanet.factionId);
    const previousUnit = unitSelect.value;
    unitSelect.replaceChildren(
      ...factionShips.map((ship) => {
        const option = document.createElement('option');
        option.value = ship.id;
        option.textContent = ship.name;
        return option;
      }),
    );
    if (factionShips.some((ship) => ship.id === previousUnit)) unitSelect.value = previousUnit;

    const empireState = getEmpireShipUpgradeState(state.shipUpgrades, 'player');
    const queued = empireState?.queue[0];
    queueHost.replaceChildren();
    if (queued === undefined) {
      queueHost.dataset.queueState = 'idle';
      queueHost.innerHTML = '<span class="status-badge status-badge--ready">Очередь свободна</span><p>Одновременно выполняется одно улучшение на всю империю.</p>';
    } else {
      queueHost.dataset.queueState = 'active';
      const ship = factionShips.find((candidate) => candidate.id === queued.unitId) ?? SHIPS.find((candidate) => candidate.id === queued.unitId);
      const copy = document.createElement('div');
      copy.innerHTML = `<span class="status-badge status-badge--active">В работе</span><strong>${ship?.name ?? queued.unitId} · ${SHIP_UPGRADE_TRACKS[queued.track].name} ${queued.targetLevel}</strong><small>Осталось ${formatDuration(Math.max(0, queued.completesAt - state.clock.elapsedSeconds))}</small>`;
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'danger-button';
      cancel.textContent = 'Отменить';
      cancel.addEventListener('click', () => {
        bridge.execute(
          { type: 'CANCEL_SHIP_UPGRADE', empireId: 'player', queueItemId: queued.id },
          'Улучшение отменено, возвращено 70% ресурсов',
        );
      });
      queueHost.append(copy, cancel);
    }

    const selectedUnit = unitSelect.value || factionShips[0]?.id;
    const selectedTrack = (trackSelect.value || TRACKS[0]) as ShipUpgradeTrack;
    if (selectedUnit !== undefined) {
      const current = getShipUpgradeLevels(state.shipUpgrades, 'player', selectedUnit)[selectedTrack];
      const cost = calculateShipUpgradeCost(selectedUnit, selectedTrack, current + 1);
      quote.textContent = current >= SHIP_UPGRADE_MAX_LEVEL
        ? `Максимальный уровень ${SHIP_UPGRADE_MAX_LEVEL}`
        : cost === undefined
          ? 'Стоимость недоступна'
          : `Уровень ${current} → ${current + 1} · ${NUMBER_FORMAT.format(cost.metal)} M · ${NUMBER_FORMAT.format(cost.crystal)} C · ${NUMBER_FORMAT.format(cost.gas)} G · +${SHIP_UPGRADE_TRACKS[selectedTrack].percentPerLevel}%`;
    }

    grid.replaceChildren();
    for (const ship of factionShips) {
      const levels = getShipUpgradeLevels(state.shipUpgrades, 'player', ship.id);
      const card = document.createElement('article');
      card.className = 'ship-upgrade-card';
      card.dataset.mechanicalId = ship.id;
      card.tabIndex = 0;
      const art = document.createElement('img');
      art.src = getFleetShipArtUrl(activePlanet?.factionId ?? 'aegis', ship.id);
      art.alt = '';
      const body = document.createElement('div');
      const title = document.createElement('h2');
      title.textContent = ship.name;
      const stats = document.createElement('p');
      stats.textContent = `Вооружение ${levels.weapons}/${SHIP_UPGRADE_MAX_LEVEL} · Броня ${levels.armor}/${SHIP_UPGRADE_MAX_LEVEL} · Груз ${levels.cargo}/${SHIP_UPGRADE_MAX_LEVEL}`;
      body.append(title, stats);
      card.append(art, body);
      const selectCard = (): void => {
        unitSelect.value = ship.id;
        render();
      };
      card.addEventListener('click', selectCard);
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectCard();
        }
      });
      grid.append(card);
    }
  };

  const onSubmit = (event: SubmitEvent): void => {
    event.preventDefault();
    const unitId = unitSelect.value;
    const track = trackSelect.value as ShipUpgradeTrack;
    const planetId = planetSelect.value;
    if (unitId.length === 0 || planetId.length === 0 || !TRACKS.includes(track)) return;
    bridge.execute(
      { type: 'QUEUE_SHIP_UPGRADE', empireId: 'player', planetId, unitId, track },
      'Улучшение корабля поставлено в очередь',
    );
  };
  form.addEventListener('submit', onSubmit);
  const refresh = (): void => { if (active) render(); };
  unitSelect.addEventListener('change', refresh);
  trackSelect.addEventListener('change', refresh);
  planetSelect.addEventListener('change', refresh);

  return {
    activate: () => {
      active = true;
      host.hidden = false;
      render();
      host.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    },
    deactivate: () => {
      active = false;
      host.hidden = true;
    },
    refresh,
    dispose: () => {
      active = false;
      form.removeEventListener('submit', onSubmit);
      unitSelect.removeEventListener('change', refresh);
      trackSelect.removeEventListener('change', refresh);
      planetSelect.removeEventListener('change', refresh);
      host.replaceChildren();
    },
  };
}
