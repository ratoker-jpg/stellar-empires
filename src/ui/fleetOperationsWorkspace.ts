import { getFleetShipArtUrl } from '../assets/galaxyFleetRuntimeAssets';
import {
  getColonyLimit,
  getEmpireColonyCount,
} from '../simulation/colonization/colonization';
import type { ResourceCost } from '../simulation/economy/types';
import {
  getMissionTargetLabel,
  type OrdinaryMissionKind,
} from '../simulation/fleets/missionRules';
import type { FleetMissionKind, FleetState } from '../simulation/fleets/types';
import type { FactionId } from '../simulation/planet/types';
import type { GameCommand, GameState } from '../simulation/types';
import { getUnitDefinition } from '../simulation/units/catalog';
import { hasShipRole } from '../simulation/units/shipCapabilities';
import type { FleetShellMode } from './appShellRoute';
import {
  createFleetComposerViewModel,
  createFleetMissionTargets,
  createFleetRoutePreview,
} from './fleetComposerViewModel';
import {
  FLEET_MISSION_TARGET_EVENT,
  type FleetMissionTargetRequest,
} from './fleetMissionEvents';
import { formatGameDuration } from './planetViewModel';

export interface FleetOperationsWorkspaceOptions {
  readonly getState: () => GameState;
  readonly getActivePlanetId: () => string;
  readonly execute: (command: GameCommand, successMessage: string) => boolean;
  readonly navigateToMode: (mode: FleetShellMode) => void;
}

export interface FleetOperationsWorkspace {
  activate(mode: FleetShellMode): void;
  refresh(): void;
  deactivate(): void;
  dispose(): void;
}

interface NumberField {
  readonly wrapper: HTMLLabelElement;
  readonly input: HTMLInputElement;
}

const MODES: readonly FleetShellMode[] = ['overview', 'compose', 'active', 'battles'];

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Fleet workspace element is missing: ${selector}`);
  return element;
}

function createNumberField(labelText: string, max = Number.MAX_SAFE_INTEGER): NumberField {
  const wrapper = document.createElement('label');
  const label = document.createElement('span');
  label.textContent = labelText;
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.max = String(max);
  input.value = '0';
  wrapper.append(label, input);
  return { wrapper, input };
}

function readNumber(field: NumberField): number {
  return Math.max(0, Math.floor(Number(field.input.value) || 0));
}

function totalUnits(units: Readonly<Record<string, number>>): number {
  return Object.values(units).reduce((total, count) => total + count, 0);
}

function readMissionKind(value: string): OrdinaryMissionKind {
  switch (value) {
    case 'deploy':
    case 'scout':
    case 'attack':
    case 'recycle':
    case 'colonize':
      return value;
    default:
      return 'transport';
  }
}

function missionLabel(mission: FleetMissionKind): string {
  switch (mission) {
    case 'deploy': return 'Размещение';
    case 'scout': return 'Разведка';
    case 'attack': return 'Атака';
    case 'recycle': return 'Переработка';
    case 'colonize': return 'Колонизация';
    case 'expedition': return 'Экспедиция';
    case 'space-object': return 'Стратегический объект';
    case 'transport': return 'Транспорт';
  }
}

function fleetStatusLabel(fleet: FleetState): string {
  switch (fleet.status) {
    case 'stationed': return 'На орбите';
    case 'outbound': return 'Следует к цели';
    case 'holding': return 'Удерживает позицию';
    case 'returning': return 'Возвращается';
  }
}

function getPlayerFaction(state: GameState): FactionId {
  return state.planets.find((planet) => planet.ownerEmpireId === 'player')?.factionId ?? 'aegis';
}

function getFleetFaction(state: GameState, fleet: FleetState): FactionId {
  return state.planets.find((planet) => planet.id === fleet.originPlanetId)?.factionId
    ?? getPlayerFaction(state);
}

function getTargetName(
  state: GameState,
  targetId: string,
  empireId = 'player',
): string {
  return getMissionTargetLabel(state, empireId, targetId);
}

function createMetric(labelText: string, valueText: string, detail = ''): HTMLElement {
  const item = document.createElement('article');
  const label = document.createElement('span');
  label.textContent = labelText;
  const value = document.createElement('strong');
  value.textContent = valueText;
  item.append(label, value);
  if (detail !== '') {
    const hint = document.createElement('small');
    hint.textContent = detail;
    item.append(hint);
  }
  return item;
}

function renderFleetCard(state: GameState, fleet: FleetState): HTMLElement {
  const card = document.createElement('article');
  card.className = `mission-fleet-card is-${fleet.status}`;
  const primaryUnitId = Object.entries(fleet.ships)
    .sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'ship.aegis.fighter';
  const visual = document.createElement('div');
  visual.className = 'mission-fleet-card__visual';
  const image = document.createElement('img');
  image.src = getFleetShipArtUrl(getFleetFaction(state, fleet), primaryUnitId);
  image.alt = '';
  image.loading = 'lazy';
  const status = document.createElement('span');
  status.textContent = fleetStatusLabel(fleet);
  visual.append(image, status);
  const body = document.createElement('div');
  body.className = 'mission-fleet-card__body';
  const name = document.createElement('strong');
  name.textContent = fleet.id;
  const composition = Object.entries(fleet.ships)
    .map(([unitId, quantity]) => `${getUnitDefinition(unitId)?.name ?? unitId} × ${quantity}`)
    .join(' · ');
  const meta = document.createElement('p');
  meta.textContent = `Скорость ${fleet.speed} · груз ${fleet.cargo.metal + fleet.cargo.crystal + fleet.cargo.gas}/${fleet.cargoCapacity} · ${composition}`;
  body.append(name, meta);
  if (fleet.location.type === 'transit') {
    const route = document.createElement('p');
    route.className = 'mission-route-preview';
    route.textContent = `${fleet.mission === null ? 'Перелёт' : missionLabel(fleet.mission.kind)} · ${getTargetName(state, fleet.location.toPlanetId, fleet.empireId)} · осталось ${formatGameDuration(Math.max(0, fleet.location.arrivesAt - state.clock.elapsedSeconds))}`;
    body.append(route);
  }
  card.append(visual, body);
  return card;
}

export function mountFleetOperationsWorkspace(
  options: FleetOperationsWorkspaceOptions,
): FleetOperationsWorkspace {
  const host = requireElement<HTMLElement>('#fleet-workspace-host');
  const tabs = requireElement<HTMLElement>('#fleet-route-tabs');
  let mode: FleetShellMode = 'overview';
  let active = false;
  let pendingTarget: FleetMissionTargetRequest | null = null;

  const refreshTabs = (): void => {
    for (const button of tabs.querySelectorAll<HTMLButtonElement>('[data-fleet-mode]')) {
      const candidate = button.dataset.fleetMode as FleetShellMode;
      const selected = candidate === mode;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    }
  };

  const renderOverview = (state: GameState): void => {
    const fleets = state.fleets.filter((fleet) => fleet.empireId === 'player');
    const summary = document.createElement('section');
    summary.className = 'operations-summary';
    summary.append(
      createMetric('Флоты', String(fleets.length), 'всего'),
      createMetric('На орбите', String(fleets.filter((fleet) => fleet.status === 'stationed').length)),
      createMetric('В полёте', String(fleets.filter((fleet) => fleet.location.type === 'transit').length)),
      createMetric('Колонии', `${getEmpireColonyCount(state, 'player')}/${getColonyLimit(state, 'player')}`),
    );
    const list = document.createElement('section');
    list.className = 'mission-fleet-list';
    for (const fleet of fleets) list.append(renderFleetCard(state, fleet));
    if (fleets.length === 0) list.textContent = 'Оперативные группы ещё не сформированы.';
    host.replaceChildren(summary, list);
  };

  const renderCreateFleet = (state: GameState): HTMLElement => {
    const planets = state.planets.filter((planet) => planet.ownerEmpireId === 'player');
    const section = document.createElement('section');
    section.className = 'mission-create';
    const heading = document.createElement('h2');
    heading.textContent = 'Сформировать новый флот';
    const originSelect = document.createElement('select');
    originSelect.setAttribute('aria-label', 'Точка формирования флота');
    for (const planet of planets) {
      const option = document.createElement('option');
      option.value = planet.id;
      option.textContent = `${planet.name} · ${planet.systemId}:${planet.position}`;
      originSelect.append(option);
    }
    if (planets.some((planet) => planet.id === options.getActivePlanetId())) {
      originSelect.value = options.getActivePlanetId();
    }
    const shipFields = document.createElement('div');
    shipFields.className = 'mission-ship-grid';
    const cargoFields = document.createElement('div');
    cargoFields.className = 'mission-cargo-grid';
    const status = document.createElement('p');
    status.className = 'mission-composer-status';
    const create = document.createElement('button');
    create.type = 'button';
    create.className = 'mission-primary-action';
    create.textContent = 'Сформировать флот';
    let shipInputs: Array<{ readonly unitId: string; readonly field: NumberField }> = [];
    let cargoMetal = createNumberField('Металл');
    let cargoCrystal = createNumberField('Минералы');
    let cargoGas = createNumberField('Газ');
    const readComposition = (): Readonly<Record<string, number>> => Object.fromEntries(
      shipInputs
        .map(({ unitId, field }) => [unitId, readNumber(field)] as const)
        .filter(([, quantity]) => quantity > 0),
    );
    const readCargo = (): ResourceCost => ({
      metal: readNumber(cargoMetal),
      crystal: readNumber(cargoCrystal),
      gas: readNumber(cargoGas),
    });
    const refreshComposer = (): void => {
      const model = createFleetComposerViewModel(
        options.getState(),
        'player',
        originSelect.value,
        readComposition(),
        readCargo(),
      );
      if (model === undefined) {
        status.textContent = 'Выбранная колония недоступна.';
        create.disabled = true;
        return;
      }
      status.textContent = `Кораблей ${model.shipCount} · скорость ${model.speed} · груз ${model.cargoAmount}/${model.cargoCapacity}${model.errors.length > 0 ? ` · ${model.errors.join(' · ')}` : ' · готов к формированию'}`;
      create.disabled = !model.canCreate;
    };
    const renderInventory = (): void => {
      const current = options.getState();
      const origin = current.planets.find(
        (planet) => planet.id === originSelect.value && planet.ownerEmpireId === 'player',
      );
      shipFields.replaceChildren();
      cargoFields.replaceChildren();
      shipInputs = [];
      for (const [unitId, count] of Object.entries(origin?.inventory.ships ?? {})) {
        if (count <= 0) continue;
        const card = document.createElement('article');
        card.className = 'mission-ship-option';
        const name = document.createElement('strong');
        name.textContent = `${getUnitDefinition(unitId)?.name ?? unitId} · доступно ${count}`;
        const field = createNumberField('В состав', count);
        field.input.addEventListener('input', refreshComposer);
        shipInputs.push({ unitId, field });
        card.append(name, field.wrapper);
        shipFields.append(card);
      }
      cargoMetal = createNumberField('Металл');
      cargoCrystal = createNumberField('Минералы');
      cargoGas = createNumberField('Газ');
      for (const field of [cargoMetal, cargoCrystal, cargoGas]) {
        field.input.addEventListener('input', refreshComposer);
        cargoFields.append(field.wrapper);
      }
      refreshComposer();
    };
    originSelect.addEventListener('change', renderInventory);
    create.addEventListener('click', () => {
      const model = createFleetComposerViewModel(
        options.getState(),
        'player',
        originSelect.value,
        readComposition(),
        readCargo(),
      );
      if (model === undefined || !model.canCreate) return;
      if (options.execute({
        type: 'CREATE_FLEET',
        empireId: 'player',
        planetId: model.originPlanetId,
        ships: model.selectedShips,
        cargo: model.cargo,
      }, `Флот сформирован · ${model.originName}`)) render();
    });
    renderInventory();
    section.append(heading, originSelect, shipFields, cargoFields, status, create);
    return section;
  };

  const renderMissionComposer = (state: GameState): HTMLElement => {
    const section = document.createElement('section');
    section.className = 'mission-fleet-list';
    const heading = document.createElement('h2');
    heading.textContent = 'Подготовить миссию';
    section.append(heading);
    if (pendingTarget !== null) {
      const notice = document.createElement('div');
      notice.className = 'mission-target-notice';
      notice.dataset.testid = 'mission-target-notice';
      notice.textContent = `Цель с карты: ${pendingTarget.label} · ${missionLabel(pendingTarget.mission)}`;
      section.append(notice);
    }
    const fleets = state.fleets.filter(
      (fleet) => fleet.empireId === 'player' && fleet.status === 'stationed' && fleet.location.type === 'planet',
    );
    for (const fleet of fleets) {
      const card = renderFleetCard(state, fleet);
      const body = card.querySelector<HTMLElement>('.mission-fleet-card__body');
      if (body === null) continue;
      const actions = document.createElement('div');
      actions.className = 'mission-actions';
      const mission = document.createElement('select');
      mission.dataset.testid = `mission-kind-${fleet.id}`;
      for (const missionKind of ['transport', 'deploy', 'scout', 'attack', 'recycle'] as const) {
        const option = document.createElement('option');
        option.value = missionKind;
        option.textContent = missionLabel(missionKind);
        mission.append(option);
      }
      if (hasShipRole(fleet.ships, 'colonizer')) {
        const option = document.createElement('option');
        option.value = 'colonize';
        option.textContent = missionLabel('colonize');
        mission.append(option);
      }
      if (pendingTarget !== null && [...mission.options].some((option) => option.value === pendingTarget?.mission)) {
        mission.value = pendingTarget.mission;
      }
      const target = document.createElement('select');
      target.dataset.testid = `mission-target-${fleet.id}`;
      const preview = document.createElement('p');
      preview.className = 'mission-route-preview';
      const send = document.createElement('button');
      send.type = 'button';
      send.className = 'mission-primary-action';
      send.dataset.testid = `mission-send-${fleet.id}`;
      send.textContent = 'Подтвердить отправку';
      const refreshPreview = (): void => {
        if (target.value.length === 0) {
          preview.textContent = 'Для выбранной миссии нет доступных целей.';
          send.disabled = true;
          return;
        }
        const route = createFleetRoutePreview(
          options.getState(),
          fleet,
          readMissionKind(mission.value),
          target.value,
        );
        if (route === undefined) {
          preview.textContent = 'Маршрут недоступен.';
          send.disabled = true;
          return;
        }
        const slots = `слоты ${route.slotUsed}/${route.slotCapacity}`;
        preview.textContent = route.allowed
          ? `Дистанция ${route.distance} · ${formatGameDuration(route.durationSeconds)} · резерв газа ${route.reservedFuel}/${route.originGas} · ${slots}`
          : `${route.message} · ${slots}`;
        send.disabled = !route.allowed;
      };
      const renderTargets = (): void => {
        target.replaceChildren();
        const missionKind = readMissionKind(mission.value);
        const candidates = createFleetMissionTargets(
          options.getState(),
          fleet,
          missionKind,
        );
        for (const candidate of candidates) {
          const option = document.createElement('option');
          option.value = candidate.id;
          option.textContent = candidate.label;
          target.append(option);
        }
        if (candidates.length === 0) {
          const empty = document.createElement('option');
          empty.value = '';
          empty.textContent = 'Нет доступных целей';
          target.append(empty);
        }
        if (pendingTarget !== null && [...target.options].some((option) => option.value === pendingTarget?.targetId)) {
          target.value = pendingTarget.targetId;
        }
        refreshPreview();
      };
      mission.addEventListener('change', renderTargets);
      target.addEventListener('change', refreshPreview);
      send.addEventListener('click', () => {
        const missionKind = readMissionKind(mission.value);
        if (target.value.length === 0) return;
        if (options.execute({
          type: 'SEND_FLEET',
          empireId: 'player',
          fleetId: fleet.id,
          targetPlanetId: target.value,
          mission: missionKind,
        }, `Флот отправлен · ${missionLabel(missionKind)}`)) {
          pendingTarget = null;
          render();
        }
      });
      renderTargets();
      actions.append(mission, target, preview, send);
      const disband = document.createElement('button');
      disband.type = 'button';
      disband.textContent = 'Расформировать';
      disband.addEventListener('click', () => {
        if (options.execute(
          { type: 'DISBAND_FLEET', empireId: 'player', fleetId: fleet.id },
          'Флот расформирован',
        )) render();
      });
      actions.append(disband);
      body.append(actions);
      section.append(card);
    }
    if (fleets.length === 0) section.append('Нет флотов, готовых к отправке.');
    return section;
  };

  const renderCompose = (state: GameState): void => {
    const workspace = document.createElement('div');
    workspace.className = 'mission-workspace';
    workspace.append(renderCreateFleet(state), renderMissionComposer(state));
    host.replaceChildren(workspace);
  };

  const renderActive = (state: GameState): void => {
    const list = document.createElement('section');
    list.className = 'mission-fleet-list';
    const fleets = state.fleets.filter(
      (fleet) => fleet.empireId === 'player' && fleet.status !== 'stationed',
    );
    for (const fleet of fleets) {
      const card = renderFleetCard(state, fleet);
      const body = card.querySelector<HTMLElement>('.mission-fleet-card__body');
      if (body !== null && fleet.status === 'outbound') {
        const recall = document.createElement('button');
        recall.type = 'button';
        recall.textContent = 'Отозвать';
        recall.addEventListener('click', () => {
          if (options.execute(
            { type: 'RECALL_FLEET', empireId: 'player', fleetId: fleet.id },
            'Флот отозван',
          )) render();
        });
        body.append(recall);
      }
      list.append(card);
    }
    if (fleets.length === 0) list.textContent = 'Активных полётов нет.';
    host.replaceChildren(list);
  };

  const renderBattles = (state: GameState): void => {
    const list = document.createElement('section');
    list.className = 'mission-battles';
    const reports = state.eventLog
      .filter((entry) => entry.event.payload.type === 'BATTLE_REPORT')
      .slice(-24)
      .reverse();
    for (const entry of reports) {
      if (entry.event.payload.type !== 'BATTLE_REPORT') continue;
      const report = entry.event.payload.report;
      if (report.attackerEmpireId !== 'player' && report.defenderEmpireId !== 'player') continue;
      const card = document.createElement('article');
      const title = document.createElement('strong');
      title.textContent = `${getTargetName(state, report.targetPlanetId)} · ${report.winner}`;
      const details = document.createElement('p');
      details.textContent = `${report.rounds.length} раундов · атакующие ${totalUnits(report.attackerInitial)} → ${totalUnits(report.attackerRemaining)} · защитники ${totalUnits(report.defenderInitial)} → ${totalUnits(report.defenderRemaining)}`;
      card.append(title, details);
      list.append(card);
    }
    if (list.childElementCount === 0) list.textContent = 'Боевых отчётов пока нет.';
    host.replaceChildren(list);
  };

  const render = (): void => {
    if (!active) return;
    refreshTabs();
    const state = options.getState();
    if (mode === 'overview') renderOverview(state);
    else if (mode === 'compose') renderCompose(state);
    else if (mode === 'active') renderActive(state);
    else renderBattles(state);
  };

  const onTabClick = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('[data-fleet-mode]');
    if (button === null) return;
    options.navigateToMode(button.dataset.fleetMode as FleetShellMode);
  };
  tabs.addEventListener('click', onTabClick);

  const onTarget = ((event: Event): void => {
    pendingTarget = (event as CustomEvent<FleetMissionTargetRequest>).detail;
    options.navigateToMode('compose');
  }) as EventListener;
  window.addEventListener(FLEET_MISSION_TARGET_EVENT, onTarget);

  return {
    activate: (nextMode) => {
      mode = MODES.includes(nextMode) ? nextMode : 'overview';
      active = true;
      render();
    },
    refresh: render,
    deactivate: () => { active = false; },
    dispose: () => {
      tabs.removeEventListener('click', onTabClick);
      window.removeEventListener(FLEET_MISSION_TARGET_EVENT, onTarget);
      host.replaceChildren();
    },
  };
}
