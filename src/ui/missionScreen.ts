import { getFleetShipArtUrl } from '../assets/galaxyFleetRuntimeAssets';
import {
  getColonyLimit,
  getEmpireColonyCount,
  isColonizableGalaxyPlanet,
} from '../simulation/colonization/colonization';
import type { ResourceCost } from '../simulation/economy/types';
import type { FleetMissionKind, FleetState } from '../simulation/fleets/types';
import {
  getCurrentObservations,
  getEmpireIntelligence,
} from '../simulation/intelligence/intelligenceState';
import type { FactionId } from '../simulation/planet/types';
import type { GameCommand, GameState } from '../simulation/types';
import { getUnitDefinition } from '../simulation/units/catalog';
import { hasShipRole } from '../simulation/units/shipCapabilities';
import { hasShipRole } from '../simulation/units/shipCapabilities';
import { hasShipRole } from '../simulation/units/shipCapabilities';
import {
  createFleetComposerViewModel,
  createFleetRoutePreview,
} from './fleetComposerViewModel';
import {
  FLEET_MISSION_TARGET_EVENT,
  type FleetMissionTargetRequest,
} from './fleetMissionEvents';
import { formatGameDuration } from './planetViewModel';

export interface MissionScreenOptions {
  readonly getState: () => GameState;
  readonly getActivePlanetId: () => string;
  readonly execute: (command: GameCommand, successMessage: string) => boolean;
}

interface NumberField {
  readonly wrapper: HTMLLabelElement;
  readonly input: HTMLInputElement;
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

function formatIntelTime(seconds: number): string {
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  return `${hours}ч ${minutes}м`;
}

function totalUnits(units: Readonly<Record<string, number>>): number {
  return Object.values(units).reduce((total, count) => total + count, 0);
}

function readMissionKind(value: string): FleetMissionKind {
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

function getColonizationTargets(state: GameState) {
  return state.galaxy.systems.flatMap((system) =>
    system.planets
      .filter(
        (planet) =>
          isColonizableGalaxyPlanet(planet) &&
          !state.planets.some((colony) => colony.galaxyPlanetId === planet.id),
      )
      .map((planet) => ({ system, planet })),
  );
}

function getRegularTargets(
  state: GameState,
  fleet: FleetState,
  mission: FleetMissionKind,
) {
  if (fleet.location.type !== 'planet') return [];
  const originId = fleet.location.planetId;
  if (mission === 'recycle') {
    const debrisPlanetIds = new Set(
      state.debrisFields
        .filter((field) => field.metal > 0 || field.crystal > 0)
        .map((field) => field.planetId),
    );
    return state.planets.filter(
      (planet) => planet.id !== originId && debrisPlanetIds.has(planet.id),
    );
  }
  if (mission === 'transport' || mission === 'deploy') {
    return state.planets.filter(
      (planet) => planet.id !== originId && planet.ownerEmpireId === fleet.empireId,
    );
  }
  return state.planets.filter((planet) => planet.id !== originId);
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

function getTargetName(state: GameState, targetId: string): string {
  const colony = state.planets.find(
    (planet) => planet.id === targetId || planet.galaxyPlanetId === targetId,
  );
  if (colony !== undefined) return colony.name;
  for (const system of state.galaxy.systems) {
    const planet = system.planets.find((candidate) => candidate.id === targetId);
    if (planet !== undefined) return `${system.name} · орбита ${planet.position}`;
  }
  return targetId;
}

function composerErrorLabel(code: string): string {
  if (code.startsWith('INSUFFICIENT_SHIPS')) return 'Недостаточно выбранных кораблей';
  if (code.startsWith('SHIP_NOT_AT_ORIGIN')) return 'Корабль отсутствует на колонии';
  if (code.startsWith('INSUFFICIENT_CARGO_RESOURCE')) return 'Недостаточно ресурса для груза';
  if (code === 'FLEET_CARGO_OVER_CAPACITY') return 'Груз превышает вместимость';
  return code;
}

function createMetric(labelText: string, valueText: string): HTMLElement {
  const item = document.createElement('div');
  const label = document.createElement('span');
  label.textContent = labelText;
  const value = document.createElement('strong');
  value.textContent = valueText;
  item.append(label, value);
  return item;
}

export function mountMissionScreen(options: MissionScreenOptions): void {
  const dialog = document.createElement('dialog');
  dialog.id = 'mission-screen-dialog';
  dialog.className = 'mission-screen-dialog';
  const header = document.createElement('header');
  const heading = document.createElement('div');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'panel-label';
  eyebrow.textContent = 'Fleet Operations · command';
  const title = document.createElement('h2');
  title.textContent = 'Флоты и миссии';
  const subtitle = document.createElement('p');
  subtitle.textContent = 'Формирование, выбор цели, маршрут и контроль активных операций.';
  heading.append(eyebrow, title, subtitle);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'dialog-close';
  close.textContent = '×';
  close.setAttribute('aria-label', 'Закрыть');
  close.addEventListener('click', () => dialog.close());
  header.append(heading, close);
  const content = document.createElement('div');
  content.className = 'mission-screen-content';
  dialog.append(header, content);
  document.body.append(dialog);

  let pendingTarget: FleetMissionTargetRequest | null = null;

  const render = (): void => {
    const state = options.getState();
    const playerFleets = state.fleets.filter((fleet) => fleet.empireId === 'player');
    const planets = state.planets.filter((planet) => planet.ownerEmpireId === 'player');
    const colonizationTargets = getColonizationTargets(state);
    const factionId = getPlayerFaction(state);
    content.replaceChildren();

    const overview = document.createElement('section');
    overview.className = 'mission-overview';
    overview.append(
      createMetric('Флоты', String(playerFleets.length)),
      createMetric('На орбите', String(playerFleets.filter((fleet) => fleet.status === 'stationed').length)),
      createMetric('В полёте', String(playerFleets.filter((fleet) => fleet.location.type === 'transit').length)),
      createMetric('Колонии', `${getEmpireColonyCount(state, 'player')}/${getColonyLimit(state, 'player')}`),
      createMetric('Свободные миры', String(colonizationTargets.length)),
    );
    if (pendingTarget !== null) {
      const targetNotice = document.createElement('div');
      targetNotice.className = 'mission-target-notice';
      targetNotice.textContent = `Цель с карты: ${pendingTarget.label} · ${missionLabel(pendingTarget.mission)}`;
      overview.append(targetNotice);
    }
    content.append(overview);

    const workspace = document.createElement('div');
    workspace.className = 'mission-workspace';

    const createSection = document.createElement('section');
    createSection.className = 'mission-create';
    const createTitle = document.createElement('div');
    createTitle.className = 'mission-section-heading';
    const createHeading = document.createElement('h3');
    createHeading.textContent = 'Сформировать новый флот';
    const createHint = document.createElement('p');
    createHint.textContent = 'Корабли и груз резервируются на выбранной колонии.';
    createTitle.append(createHeading, createHint);

    const originLabel = document.createElement('label');
    originLabel.className = 'mission-origin-field';
    const originCaption = document.createElement('span');
    originCaption.textContent = 'Точка формирования';
    const originSelect = document.createElement('select');
    for (const planet of planets) {
      const option = document.createElement('option');
      option.value = planet.id;
      option.textContent = `${planet.name} · ${planet.systemId}:${planet.position}`;
      originSelect.append(option);
    }
    if (planets.some((planet) => planet.id === options.getActivePlanetId())) {
      originSelect.value = options.getActivePlanetId();
    }
    originLabel.append(originCaption, originSelect);

    const shipFields = document.createElement('div');
    shipFields.className = 'mission-ship-grid';
    const cargoFields = document.createElement('div');
    cargoFields.className = 'mission-cargo-grid';
    const composerStatus = document.createElement('p');
    composerStatus.className = 'mission-composer-status';
    const createButton = document.createElement('button');
    createButton.type = 'button';
    createButton.className = 'mission-primary-action';
    createButton.textContent = 'Сформировать флот';

    let shipInputs: Array<{ readonly unitId: string; readonly field: NumberField }> = [];
    let cargoMetal = createNumberField('Металл');
    let cargoCrystal = createNumberField('Минералы');
    let cargoGas = createNumberField('Газ');

    const readComposition = (): Readonly<Record<string, number>> =>
      Object.fromEntries(
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
        state,
        'player',
        originSelect.value,
        readComposition(),
        readCargo(),
      );
      if (model === undefined) {
        composerStatus.textContent = 'Выбранная колония недоступна.';
        createButton.disabled = true;
        return;
      }
      const errors = model.errors.map(composerErrorLabel);
      composerStatus.textContent = `Кораблей ${model.shipCount} · скорость ${model.speed} · груз ${model.cargoAmount}/${model.cargoCapacity}${errors.length > 0 ? ` · ${errors.join(' · ')}` : ' · готов к формированию'}`;
      composerStatus.classList.toggle('is-blocked', errors.length > 0);
      createButton.disabled = !model.canCreate;
    };

    const renderOriginInventory = (): void => {
      const origin = state.planets.find(
        (planet) => planet.id === originSelect.value && planet.ownerEmpireId === 'player',
      );
      shipFields.replaceChildren();
      cargoFields.replaceChildren();
      shipInputs = [];
      for (const [unitId, count] of Object.entries(origin?.inventory.ships ?? {})) {
        if (count <= 0) continue;
        const definition = getUnitDefinition(unitId);
        const card = document.createElement('article');
        card.className = 'mission-ship-option';
        const image = document.createElement('img');
        image.src = getFleetShipArtUrl(origin?.factionId ?? factionId, unitId);
        image.alt = '';
        image.loading = 'lazy';
        const details = document.createElement('div');
        const name = document.createElement('strong');
        name.textContent = definition?.name ?? unitId;
        const available = document.createElement('small');
        available.textContent = `Доступно ${count} · ${definition?.role ?? 'корабль'}`;
        const field = createNumberField('В состав', count);
        field.input.addEventListener('input', refreshComposer);
        details.append(name, available, field.wrapper);
        card.append(image, details);
        shipInputs.push({ unitId, field });
        shipFields.append(card);
      }
      if (shipInputs.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'mission-empty';
        empty.textContent = 'На колонии нет доступных кораблей.';
        shipFields.append(empty);
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

    originSelect.addEventListener('change', renderOriginInventory);
    createButton.addEventListener('click', () => {
      const model = createFleetComposerViewModel(
        options.getState(),
        'player',
        originSelect.value,
        readComposition(),
        readCargo(),
      );
      if (model === undefined || !model.canCreate) {
        refreshComposer();
        return;
      }
      if (options.execute({
        type: 'CREATE_FLEET',
        empireId: 'player',
        planetId: model.originPlanetId,
        ships: model.selectedShips,
        cargo: model.cargo,
      }, `Флот сформирован · ${model.originName}`)) render();
    });
    renderOriginInventory();
    createSection.append(
      createTitle,
      originLabel,
      shipFields,
      document.createElement('hr'),
      cargoFields,
      composerStatus,
      createButton,
    );

    const list = document.createElement('section');
    list.className = 'mission-fleet-list';
    const listHeading = document.createElement('div');
    listHeading.className = 'mission-section-heading';
    const listTitle = document.createElement('h3');
    listTitle.textContent = `Оперативные группы · ${playerFleets.length}`;
    const listHint = document.createElement('p');
    listHint.textContent = 'Выберите миссию и цель. Перед отправкой отображаются время и резерв топлива.';
    listHeading.append(listTitle, listHint);
    list.append(listHeading);

    for (const fleet of playerFleets) {
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
        const route = document.createElement('div');
        route.className = 'mission-transit';
        const routeText = document.createElement('p');
        const targetName = getTargetName(state, fleet.location.toPlanetId);
        const remaining = Math.max(0, fleet.location.arrivesAt - state.clock.elapsedSeconds);
        routeText.textContent = `${fleet.mission === null ? 'Перелёт' : missionLabel(fleet.mission.kind)} · ${targetName} · осталось ${formatGameDuration(remaining)}`;
        const progress = document.createElement('progress');
        progress.max = Math.max(1, fleet.location.arrivesAt - fleet.location.departedAt);
        progress.value = Math.max(0, state.clock.elapsedSeconds - fleet.location.departedAt);
        route.append(routeText, progress);
        body.append(route);
      }

      const actions = document.createElement('div');
      actions.className = 'mission-actions';
      if (fleet.status === 'stationed' && fleet.location.type === 'planet') {
        const mission = document.createElement('select');
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
        if (
          pendingTarget !== null &&
          Array.from(mission.options).some((option) => option.value === pendingTarget?.mission)
        ) {
          mission.value = pendingTarget.mission;
        }

        const target = document.createElement('select');
        const preview = document.createElement('p');
        preview.className = 'mission-route-preview';
        const send = document.createElement('button');
        send.type = 'button';
        send.className = 'mission-primary-action';
        send.textContent = 'Отправить';

        const refreshPreview = (): void => {
          const missionKind = readMissionKind(mission.value);
          const route = createFleetRoutePreview(state, fleet, missionKind, target.value);
          if (route === undefined) {
            preview.textContent = 'Маршрут недоступен.';
            send.disabled = true;
            return;
          }
          preview.textContent = `Дистанция ${route.distance} · ${formatGameDuration(route.durationSeconds)} · резерв газа ${route.reservedFuel}/${route.originGas}`;
          preview.classList.toggle('is-blocked', !route.hasEnoughFuel);
          send.disabled = !route.hasEnoughFuel;
        };

        const renderTargets = (): void => {
          target.replaceChildren();
          const missionKind = readMissionKind(mission.value);
          if (missionKind === 'colonize') {
            for (const candidate of colonizationTargets) {
              const option = document.createElement('option');
              option.value = candidate.planet.id;
              option.textContent = `${candidate.system.name} ${candidate.planet.position} · ${candidate.planet.biome} · размер ${candidate.planet.size}`;
              target.append(option);
            }
          } else {
            for (const planet of getRegularTargets(state, fleet, missionKind)) {
              const debris = state.debrisFields.find((field) => field.planetId === planet.id);
              const option = document.createElement('option');
              option.value = planet.id;
              option.textContent = `${planet.name} · ${planet.ownerEmpireId}${debris === undefined ? '' : ` · обломки ${debris.metal + debris.crystal}`}`;
              target.append(option);
            }
          }
          if (
            pendingTarget !== null &&
            Array.from(target.options).some((option) => option.value === pendingTarget?.targetId)
          ) {
            target.value = pendingTarget.targetId;
          }
          if (target.options.length === 0) {
            preview.textContent = 'Нет доступных целей для выбранной миссии.';
            send.disabled = true;
          } else {
            refreshPreview();
          }
        };

        mission.addEventListener('change', renderTargets);
        target.addEventListener('change', refreshPreview);
        send.addEventListener('click', () => {
          const missionKind = readMissionKind(mission.value);
          if (options.execute({
            type: 'SEND_FLEET',
            empireId: 'player',
            fleetId: fleet.id,
            targetPlanetId: target.value,
            mission: missionKind,
          }, missionKind === 'colonize'
            ? 'Колонизационная экспедиция отправлена'
            : `Флот отправлен · ${missionLabel(missionKind)}`)) {
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
      } else if (fleet.status === 'outbound') {
        const recall = document.createElement('button');
        recall.type = 'button';
        recall.textContent = 'Отозвать';
        recall.addEventListener('click', () => {
          if (options.execute(
            { type: 'RECALL_FLEET', empireId: 'player', fleetId: fleet.id },
            'Флот отозван',
          )) render();
        });
        actions.append(recall);
      }

      body.append(actions);
      card.append(visual, body);
      list.append(card);
    }
    if (playerFleets.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'mission-empty';
      empty.textContent = 'Оперативные группы ещё не сформированы.';
      list.append(empty);
    }

    workspace.append(createSection, list);
    content.append(workspace);

    const intelligence = getEmpireIntelligence(state.intelligence, 'player');
    const operationalGrid = document.createElement('div');
    operationalGrid.className = 'mission-operational-grid';

    const intelSection = document.createElement('section');
    intelSection.className = 'mission-intelligence';
    const intelTitle = document.createElement('h3');
    intelTitle.textContent = 'Разведданные';
    intelSection.append(intelTitle);
    for (const observation of intelligence === undefined
      ? []
      : getCurrentObservations(intelligence, state.clock.elapsedSeconds)) {
      const report = document.createElement('article');
      const summary = document.createElement('strong');
      summary.textContent = `${observation.snapshot.name} · уровень ${observation.snapshot.level}`;
      const details = document.createElement('p');
      const remaining = observation.expiresAt - state.clock.elapsedSeconds;
      details.textContent = `${observation.snapshot.ownerEmpireId} · данные актуальны ещё ${formatIntelTime(remaining)} · ${observation.detected ? 'разведка обнаружена' : 'скрытно'}`;
      report.append(summary, details);
      intelSection.append(report);
    }
    if (intelSection.childElementCount === 1) {
      const empty = document.createElement('p');
      empty.textContent = 'Актуальных разведывательных отчётов нет.';
      intelSection.append(empty);
    }

    const battleSection = document.createElement('section');
    battleSection.className = 'mission-battles';
    const battleTitle = document.createElement('h3');
    battleTitle.textContent = 'Боевые отчёты';
    battleSection.append(battleTitle);
    const reports = state.eventLog
      .filter((entry) =>
        entry.event.payload.type === 'BATTLE_REPORT' &&
        (entry.event.payload.report.attackerEmpireId === 'player' ||
          entry.event.payload.report.defenderEmpireId === 'player'))
      .slice(-6)
      .reverse();
    for (const entry of reports) {
      if (entry.event.payload.type !== 'BATTLE_REPORT') continue;
      const report = entry.event.payload.report;
      const debris = report.debrisCreated ?? { metal: 0, crystal: 0 };
      const loot = report.plunderedCargo ?? { metal: 0, crystal: 0, gas: 0 };
      const card = document.createElement('article');
      const summary = document.createElement('strong');
      summary.textContent = `${getTargetName(state, report.targetPlanetId)} · ${report.winner}`;
      const details = document.createElement('p');
      details.textContent = `${report.rounds.length} раундов · атакующие ${totalUnits(report.attackerInitial)} → ${totalUnits(report.attackerRemaining)} · защитники ${totalUnits(report.defenderInitial)} → ${totalUnits(report.defenderRemaining)} · обломки M${debris.metal}/C${debris.crystal} · добыча M${loot.metal}/C${loot.crystal}/G${loot.gas}`;
      card.append(summary, details);
      battleSection.append(card);
    }
    if (battleSection.childElementCount === 1) {
      const empty = document.createElement('p');
      empty.textContent = 'Боевых отчётов пока нет.';
      battleSection.append(empty);
    }

    const debrisSection = document.createElement('section');
    debrisSection.className = 'mission-debris';
    const debrisTitle = document.createElement('h3');
    debrisTitle.textContent = 'Поля обломков';
    debrisSection.append(debrisTitle);
    for (const field of state.debrisFields) {
      const card = document.createElement('article');
      const summary = document.createElement('strong');
      summary.textContent = getTargetName(state, field.planetId);
      const details = document.createElement('p');
      details.textContent = `Металл ${field.metal} · минералы ${field.crystal}`;
      card.append(summary, details);
      debrisSection.append(card);
    }
    if (debrisSection.childElementCount === 1) {
      const empty = document.createElement('p');
      empty.textContent = 'Доступных полей обломков нет.';
      debrisSection.append(empty);
    }

    operationalGrid.append(intelSection, battleSection, debrisSection);
    content.append(operationalGrid);
  };

  const open = (): void => {
    render();
    if (!dialog.open) dialog.showModal();
  };

  const fleetButton = document.querySelector<HTMLButtonElement>('[aria-label="Флот"]');
  if (fleetButton !== null) {
    fleetButton.disabled = false;
    fleetButton.id = 'nav-fleet';
    fleetButton.addEventListener('click', open);
  }

  window.addEventListener(
    FLEET_MISSION_TARGET_EVENT,
    ((event: Event) => {
      pendingTarget = (event as CustomEvent<FleetMissionTargetRequest>).detail;
      open();
    }) as EventListener,
  );

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const gateway = target.closest<HTMLButtonElement>('.zone-gateway');
      if (gateway?.querySelector('strong')?.textContent !== 'Командование флотом') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      open();
    },
    { capture: true },
  );
}
