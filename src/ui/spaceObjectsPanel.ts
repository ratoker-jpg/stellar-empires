import type { FleetState } from '../simulation/fleets/types';
import {
  estimateSpaceObjectMission,
  getRequiredSpaceObjectShipId,
  type SpaceObjectState,
} from '../simulation/pve/spaceObjects';
import type { GameCommand, GameState } from '../simulation/types';
import { getUnitDefinition } from '../simulation/units/catalog';
import { formatGameDuration } from './planetViewModel';

export interface SpaceObjectsPanelOptions {
  readonly getState: () => GameState;
  readonly execute: (command: GameCommand, successMessage: string) => boolean;
}

const KIND_LABELS = {
  asteroid: 'Астероид',
  'gas-cloud': 'Газовое облако',
  anomaly: 'Аномалия',
} as const;

function createNavigationButton(): HTMLButtonElement {
  const existing = document.querySelector<HTMLButtonElement>('#nav-space-objects');
  if (existing !== null) return existing;
  const galaxy = document.querySelector<HTMLButtonElement>('#nav-galaxy');
  const clone = galaxy?.cloneNode(true) as HTMLButtonElement | undefined;
  const button = clone ?? document.createElement('button');
  button.id = 'nav-space-objects';
  button.type = 'button';
  button.classList.remove('is-active');
  button.setAttribute('aria-label', 'Космические объекты');
  const icon = button.querySelector('span');
  if (icon !== null) icon.textContent = '☄';
  const label = button.querySelector('small');
  if (label !== null) label.textContent = 'Объекты';
  const expedition = document.querySelector<HTMLButtonElement>('#nav-expeditions');
  if (expedition !== null) expedition.insertAdjacentElement('afterend', button);
  else if (galaxy !== null) galaxy.insertAdjacentElement('afterend', button);
  return button;
}

function createDialog(): HTMLDialogElement {
  const existing = document.querySelector<HTMLDialogElement>('#space-objects-dialog');
  if (existing !== null) return existing;
  const dialog = document.createElement('dialog');
  dialog.id = 'space-objects-dialog';
  dialog.className = 'space-objects-dialog';
  dialog.innerHTML = `
    <header class="space-objects-header">
      <div><p class="panel-label">Strategic Objects</p><h2>Астероиды, газ и аномалии</h2></div>
      <button type="button" class="dialog-close" aria-label="Закрыть">×</button>
    </header>
    <section class="space-objects-launch"></section>
    <section class="space-objects-active"></section>
    <section class="space-objects-grid"></section>
    <section class="space-objects-reports"></section>
  `;
  dialog.querySelector<HTMLButtonElement>('.dialog-close')?.addEventListener('click', () => {
    dialog.close();
  });
  document.body.append(dialog);
  return dialog;
}

function compatibleFleets(
  state: GameState,
  object: SpaceObjectState,
): readonly FleetState[] {
  const requiredShipId = getRequiredSpaceObjectShipId(object.kind);
  return state.fleets
    .filter(
      (fleet) =>
        fleet.empireId === 'player' &&
        fleet.status === 'stationed' &&
        fleet.location.type === 'planet' &&
        (fleet.ships[requiredShipId] ?? 0) > 0,
    )
    .sort((left, right) => left.id.localeCompare(right.id));
}

function objectUnavailable(state: GameState, object: SpaceObjectState): string | null {
  if (object.remainingYield <= 0) return 'Истощён';
  if (object.cooldownUntil > state.clock.elapsedSeconds) {
    return `Нестабилен ещё ${formatGameDuration(object.cooldownUntil - state.clock.elapsedSeconds)}`;
  }
  if (
    state.pendingEvents.some(
      (event) =>
        event.payload.type === 'SPACE_OBJECT_MISSION_RESOLVE' &&
        event.payload.report.objectId === object.id,
    )
  ) {
    return 'Операция уже выполняется';
  }
  return null;
}

function controllerText(state: GameState, object: SpaceObjectState): string {
  if (
    object.controllerEmpireId === null ||
    object.controlExpiresAt === null ||
    object.controlExpiresAt <= state.clock.elapsedSeconds
  ) {
    return 'Контроль: свободный';
  }
  return `Контроль: ${object.controllerEmpireId} · ещё ${formatGameDuration(object.controlExpiresAt - state.clock.elapsedSeconds)}`;
}

function rewardText(report: {
  readonly reward: {
    readonly metal: number;
    readonly crystal: number;
    readonly gas: number;
    readonly exoticMatter: number;
  };
}): string {
  return `M ${report.reward.metal} · C ${report.reward.crystal} · G ${report.reward.gas} · X ${report.reward.exoticMatter}`;
}

export function mountSpaceObjectsPanel(options: SpaceObjectsPanelOptions): void {
  const button = createNavigationButton();
  const dialog = createDialog();
  const launch = dialog.querySelector<HTMLElement>('.space-objects-launch');
  const active = dialog.querySelector<HTMLElement>('.space-objects-active');
  const grid = dialog.querySelector<HTMLElement>('.space-objects-grid');
  const reports = dialog.querySelector<HTMLElement>('.space-objects-reports');
  if (launch === null || active === null || grid === null || reports === null) {
    throw new Error('Space object panel containers are missing.');
  }

  const render = (): void => {
    const state = options.getState();
    const exoticMatter =
      state.strategicResources.find((entry) => entry.empireId === 'player')?.exoticMatter ?? 0;

    launch.replaceChildren();
    const launchTitle = document.createElement('h3');
    launchTitle.textContent = `Новая операция · экзотическая материя ${exoticMatter}`;
    const objectSelect = document.createElement('select');
    for (const object of state.spaceObjects) {
      const option = document.createElement('option');
      option.value = object.id;
      option.textContent = `${KIND_LABELS[object.kind]} · ${object.systemId} · запас ${object.remainingYield}/${object.initialYield}`;
      objectSelect.append(option);
    }
    const fleetSelect = document.createElement('select');
    const preview = document.createElement('p');
    preview.className = 'space-object-preview';
    const start = document.createElement('button');
    start.type = 'button';
    start.textContent = 'Начать операцию';

    const refresh = (): void => {
      const object = state.spaceObjects.find((candidate) => candidate.id === objectSelect.value);
      fleetSelect.replaceChildren();
      if (object === undefined) {
        preview.textContent = 'Объект не найден.';
        start.disabled = true;
        return;
      }
      const unavailable = objectUnavailable(state, object);
      const fleets = compatibleFleets(state, object);
      for (const fleet of fleets) {
        const option = document.createElement('option');
        option.value = fleet.id;
        option.textContent = `${fleet.id} · ${getUnitDefinition(getRequiredSpaceObjectShipId(object.kind))?.name ?? getRequiredSpaceObjectShipId(object.kind)} × ${fleet.ships[getRequiredSpaceObjectShipId(object.kind)] ?? 0}`;
        fleetSelect.append(option);
      }
      const fleet = fleets.find((candidate) => candidate.id === fleetSelect.value) ?? fleets[0];
      if (unavailable !== null) {
        preview.textContent = unavailable;
        start.disabled = true;
        return;
      }
      if (fleet === undefined) {
        preview.textContent = `Нет готового флота. Требуется ${getUnitDefinition(getRequiredSpaceObjectShipId(object.kind))?.name ?? getRequiredSpaceObjectShipId(object.kind)}.`;
        start.disabled = true;
        return;
      }
      try {
        const estimate = estimateSpaceObjectMission(state, fleet, object);
        const originPlanetId = fleet.location.type === 'planet' ? fleet.location.planetId : undefined;
        const origin = originPlanetId === undefined
          ? undefined
          : state.planets.find((planet) => planet.id === originPlanetId);
        const originGas = origin?.economy.resources.gas.amount ?? 0;
        const enoughFuel = originGas >= estimate.totalFuelCost;
        preview.textContent = `Дистанция ${estimate.distance} · цикл ${formatGameDuration(estimate.totalDurationSeconds)} · газ ${estimate.totalFuelCost}/${originGas} · риск ${object.hazardPermille / 10}%`;
        preview.classList.toggle('is-blocked', !enoughFuel);
        start.disabled = !enoughFuel;
      } catch {
        preview.textContent = 'Маршрут недоступен.';
        start.disabled = true;
      }
    };

    objectSelect.addEventListener('change', refresh);
    fleetSelect.addEventListener('change', refresh);
    start.addEventListener('click', () => {
      if (
        options.execute(
          {
            type: 'START_SPACE_OBJECT_MISSION',
            empireId: 'player',
            fleetId: fleetSelect.value,
            objectId: objectSelect.value,
          },
          'Операция на космическом объекте начата',
        )
      ) {
        render();
      }
    });
    launch.append(launchTitle, objectSelect, fleetSelect, preview, start);
    refresh();

    active.replaceChildren();
    const activeTitle = document.createElement('h3');
    activeTitle.textContent = 'Активные операции';
    active.append(activeTitle);
    const activeFleets = state.fleets.filter(
      (fleet) => fleet.empireId === 'player' && fleet.mission?.kind === 'space-object',
    );
    for (const fleet of activeFleets) {
      const card = document.createElement('article');
      const title = document.createElement('strong');
      title.textContent = `${fleet.id} · ${fleet.mission?.targetPlanetId ?? 'unknown'}`;
      const details = document.createElement('p');
      details.textContent = fleet.location.type === 'transit'
        ? `Завершение через ${formatGameDuration(Math.max(0, fleet.location.arrivesAt - state.clock.elapsedSeconds))}`
        : fleet.status;
      const recall = document.createElement('button');
      recall.type = 'button';
      recall.textContent = 'Отозвать';
      recall.addEventListener('click', () => {
        if (
          options.execute(
            { type: 'RECALL_FLEET', empireId: 'player', fleetId: fleet.id },
            'Операция отозвана',
          )
        ) {
          render();
        }
      });
      card.append(title, details, recall);
      active.append(card);
    }
    if (activeFleets.length === 0) active.append('Активных операций нет.');

    grid.replaceChildren();
    for (const object of state.spaceObjects) {
      const card = document.createElement('article');
      card.className = `space-object-card is-${object.kind}`;
      const title = document.createElement('strong');
      title.textContent = `${KIND_LABELS[object.kind]} · ${object.systemId}`;
      const stock = document.createElement('p');
      stock.textContent = `Запас ${object.remainingYield}/${object.initialYield} · риск ${object.hazardPermille / 10}%`;
      const control = document.createElement('small');
      control.textContent = controllerText(state, object);
      card.append(title, stock, control);
      grid.append(card);
    }

    reports.replaceChildren();
    const reportTitle = document.createElement('h3');
    reportTitle.textContent = 'Отчёты операций';
    reports.append(reportTitle);
    const entries = state.eventLog
      .filter(
        (entry) =>
          entry.event.payload.type === 'SPACE_OBJECT_MISSION_RESOLVE' &&
          entry.event.payload.report.empireId === 'player',
      )
      .slice(-12)
      .reverse();
    for (const entry of entries) {
      if (entry.event.payload.type !== 'SPACE_OBJECT_MISSION_RESOLVE') continue;
      const report = entry.event.payload.report;
      const card = document.createElement('article');
      const title = document.createElement('strong');
      title.textContent = report.objectId;
      const result = document.createElement('p');
      const losses = Object.entries(report.losses)
        .map(([unitId, quantity]) => `${unitId} × ${quantity}`)
        .join(' · ');
      result.textContent = `Добыча ${rewardText(report)} · истощение ${report.depletion}${losses.length > 0 ? ` · потери ${losses}` : ''}`;
      const narrative = document.createElement('small');
      narrative.textContent = report.narrative;
      card.append(title, result, narrative);
      reports.append(card);
    }
    if (entries.length === 0) reports.append('Завершённых операций пока нет.');
  };

  button.addEventListener('click', () => {
    render();
    dialog.showModal();
  });
}
