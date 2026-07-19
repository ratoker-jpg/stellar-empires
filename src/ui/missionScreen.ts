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
import type { GameCommand, GameState } from '../simulation/types';
import { getUnitDefinition } from '../simulation/units/catalog';
import {
  createFleetComposerViewModel,
  createFleetRoutePreview,
} from './fleetComposerViewModel';
import { formatGameDuration } from './planetViewModel';

export interface MissionScreenOptions {
  readonly getState: () => GameState;
  readonly getActivePlanetId: () => string;
  readonly execute: (command: GameCommand, successMessage: string) => boolean;
}

function numberInput(label: string, max = Number.MAX_SAFE_INTEGER): HTMLLabelElement {
  const wrapper = document.createElement('label');
  wrapper.textContent = label;
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.max = String(max);
  input.value = '0';
  wrapper.append(input);
  return wrapper;
}

function readNumber(label: HTMLLabelElement): number {
  const input = label.querySelector('input');
  return Math.max(0, Math.floor(Number(input?.value) || 0));
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
          !state.planets.some(
            (colony) => colony.galaxyPlanetId === planet.id,
          ),
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
      (planet) =>
        planet.id !== originId && planet.ownerEmpireId === fleet.empireId,
    );
  }
  return state.planets.filter((planet) => planet.id !== originId);
}

function missionLabel(mission: FleetMissionKind): string {
  switch (mission) {
    case 'deploy':
      return 'Размещение';
    case 'scout':
      return 'Разведка';
    case 'attack':
      return 'Атака';
    case 'recycle':
      return 'Переработка';
    case 'colonize':
      return 'Колонизация';
    default:
      return 'Транспорт';
  }
}

export function mountMissionScreen(options: MissionScreenOptions): void {
  const dialog = document.createElement('dialog');
  dialog.id = 'mission-screen-dialog';
  dialog.className = 'mission-screen-dialog';
  const header = document.createElement('header');
  const heading = document.createElement('div');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'panel-label';
  eyebrow.textContent = 'Military Zone · command';
  const title = document.createElement('h2');
  title.textContent = 'Флоты и миссии';
  heading.append(eyebrow, title);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'dialog-close';
  close.textContent = '×';
  close.addEventListener('click', () => dialog.close());
  header.append(heading, close);
  const content = document.createElement('div');
  content.className = 'mission-screen-content';
  dialog.append(header, content);
  document.body.append(dialog);

  const render = (): void => {
    const state = options.getState();
    const planets = state.planets.filter(
      (planet) => planet.ownerEmpireId === 'player',
    );
    const colonizationTargets = getColonizationTargets(state);
    content.replaceChildren();

    const createSection = document.createElement('section');
    createSection.className = 'mission-create';
    const createTitle = document.createElement('h3');
    createTitle.textContent = 'Сформировать флот';
    const colonySummary = document.createElement('p');
    colonySummary.textContent = `Колонии ${getEmpireColonyCount(state, 'player')}/${getColonyLimit(state, 'player')} · свободных миров ${colonizationTargets.length}`;
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
    const shipFields = document.createElement('div');
    shipFields.className = 'mission-fields';
    const cargoFields = document.createElement('div');
    cargoFields.className = 'mission-fields';
    const composerStatus = document.createElement('p');
    composerStatus.className = 'mission-composer-status';
    const createButton = document.createElement('button');
    createButton.type = 'button';
    createButton.textContent = 'Создать флот';

    let shipInputs: Array<{
      readonly unitId: string;
      readonly field: HTMLLabelElement;
    }> = [];
    let cargoMetal = numberInput('Груз: металл');
    let cargoCrystal = numberInput('Груз: кристалл');
    let cargoGas = numberInput('Груз: газ');

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
      composerStatus.textContent = `Кораблей ${model.shipCount} · скорость ${model.speed} · груз ${model.cargoAmount}/${model.cargoCapacity}${model.errors.length > 0 ? ` · ${model.errors.join(' · ')}` : ''}`;
      createButton.disabled = !model.canCreate;
    };

    const renderOriginInventory = (): void => {
      const origin = state.planets.find(
        (planet) =>
          planet.id === originSelect.value &&
          planet.ownerEmpireId === 'player',
      );
      shipFields.replaceChildren();
      cargoFields.replaceChildren();
      shipInputs = [];
      for (const [unitId, count] of Object.entries(origin?.inventory.ships ?? {})) {
        if (count <= 0) continue;
        const field = numberInput(
          `${getUnitDefinition(unitId)?.name ?? unitId} · доступно ${count}`,
          count,
        );
        shipInputs.push({ unitId, field });
        field.querySelector('input')?.addEventListener('input', refreshComposer);
        shipFields.append(field);
      }
      cargoMetal = numberInput('Груз: металл');
      cargoCrystal = numberInput('Груз: кристалл');
      cargoGas = numberInput('Груз: газ');
      for (const field of [cargoMetal, cargoCrystal, cargoGas]) {
        field.querySelector('input')?.addEventListener('input', refreshComposer);
        cargoFields.append(field);
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
      if (
        options.execute(
          {
            type: 'CREATE_FLEET',
            empireId: 'player',
            planetId: model.originPlanetId,
            ships: model.selectedShips,
            cargo: model.cargo,
          },
          `Флот сформирован · ${model.originName}`,
        )
      ) render();
    });
    renderOriginInventory();
    createSection.append(
      createTitle,
      colonySummary,
      originSelect,
      shipFields,
      cargoFields,
      composerStatus,
      createButton,
    );
    content.append(createSection);

    const list = document.createElement('section');
    list.className = 'mission-fleet-list';
    const listTitle = document.createElement('h3');
    listTitle.textContent = `Флоты · ${state.fleets.filter((fleet) => fleet.empireId === 'player').length}`;
    list.append(listTitle);

    for (const fleet of state.fleets.filter(
      (candidate) => candidate.empireId === 'player',
    )) {
      const card = document.createElement('article');
      const info = document.createElement('div');
      const composition = Object.entries(fleet.ships)
        .map(
          ([unitId, quantity]) =>
            `${getUnitDefinition(unitId)?.name ?? unitId} × ${quantity}`,
        )
        .join(' · ');
      const name = document.createElement('strong');
      name.textContent = fleet.id;
      const meta = document.createElement('p');
      meta.textContent = `${fleet.status} · скорость ${fleet.speed} · груз ${fleet.cargo.metal + fleet.cargo.crystal + fleet.cargo.gas}/${fleet.cargoCapacity} · ${composition}`;
      info.append(name, meta);
      const actions = document.createElement('div');
      actions.className = 'mission-actions';

      if (fleet.status === 'stationed' && fleet.location.type === 'planet') {
        const target = document.createElement('select');
        const mission = document.createElement('select');
        for (const missionKind of [
          'transport',
          'deploy',
          'scout',
          'attack',
          'recycle',
        ] as const) {
          const option = document.createElement('option');
          option.value = missionKind;
          option.textContent = missionLabel(missionKind);
          mission.append(option);
        }
        if ((fleet.ships['ship.aegis.colony'] ?? 0) > 0) {
          const option = document.createElement('option');
          option.value = 'colonize';
          option.textContent = missionLabel('colonize');
          mission.append(option);
        }
        const preview = document.createElement('p');
        preview.className = 'mission-route-preview';
        const send = document.createElement('button');
        send.type = 'button';
        send.textContent = 'Отправить';

        const refreshPreview = (): void => {
          const missionKind = readMissionKind(mission.value);
          const route = createFleetRoutePreview(
            state,
            fleet,
            missionKind,
            target.value,
          );
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
              const debris = state.debrisFields.find(
                (field) => field.planetId === planet.id,
              );
              const option = document.createElement('option');
              option.value = planet.id;
              option.textContent = `${planet.name} · ${planet.ownerEmpireId}${debris === undefined ? '' : ` · обломки ${debris.metal + debris.crystal}`}`;
              target.append(option);
            }
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
          if (
            options.execute(
              {
                type: 'SEND_FLEET',
                empireId: 'player',
                fleetId: fleet.id,
                targetPlanetId: target.value,
                mission: missionKind,
              },
              missionKind === 'colonize'
                ? 'Колонизационная экспедиция отправлена'
                : `Флот отправлен · ${missionLabel(missionKind)}`,
            )
          ) render();
        });
        renderTargets();
        actions.append(mission, target, preview, send);

        const disband = document.createElement('button');
        disband.type = 'button';
        disband.textContent = 'Расформировать';
        disband.addEventListener('click', () => {
          if (
            options.execute(
              { type: 'DISBAND_FLEET', empireId: 'player', fleetId: fleet.id },
              'Флот расформирован',
            )
          ) render();
        });
        actions.append(disband);
      } else if (fleet.status === 'outbound') {
        const recall = document.createElement('button');
        recall.type = 'button';
        recall.textContent = 'Отозвать';
        recall.addEventListener('click', () => {
          if (
            options.execute(
              { type: 'RECALL_FLEET', empireId: 'player', fleetId: fleet.id },
              'Флот отозван',
            )
          ) render();
        });
        actions.append(recall);
      }

      card.append(info, actions);
      list.append(card);
    }
    content.append(list);

    const intelligence = getEmpireIntelligence(state.intelligence, 'player');
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
    content.append(intelSection);

    const battleSection = document.createElement('section');
    battleSection.className = 'mission-battles';
    const battleTitle = document.createElement('h3');
    battleTitle.textContent = 'Боевые отчёты';
    battleSection.append(battleTitle);
    const reports = state.eventLog
      .filter(
        (entry) =>
          entry.event.payload.type === 'BATTLE_REPORT' &&
          (entry.event.payload.report.attackerEmpireId === 'player' ||
            entry.event.payload.report.defenderEmpireId === 'player'),
      )
      .slice(-10)
      .reverse();
    for (const entry of reports) {
      if (entry.event.payload.type !== 'BATTLE_REPORT') continue;
      const report = entry.event.payload.report;
      const debris = report.debrisCreated ?? { metal: 0, crystal: 0 };
      const loot = report.plunderedCargo ?? { metal: 0, crystal: 0, gas: 0 };
      const card = document.createElement('article');
      const summary = document.createElement('strong');
      summary.textContent = `${report.targetPlanetId} · ${report.winner}`;
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
    content.append(battleSection);

    const debrisSection = document.createElement('section');
    debrisSection.className = 'mission-debris';
    const debrisTitle = document.createElement('h3');
    debrisTitle.textContent = 'Поля обломков';
    debrisSection.append(debrisTitle);
    for (const field of state.debrisFields) {
      const planet = state.planets.find(
        (candidate) => candidate.id === field.planetId,
      );
      const card = document.createElement('article');
      const summary = document.createElement('strong');
      summary.textContent = planet?.name ?? field.planetId;
      const details = document.createElement('p');
      details.textContent = `Металл ${field.metal} · кристалл ${field.crystal}`;
      card.append(summary, details);
      debrisSection.append(card);
    }
    if (debrisSection.childElementCount === 1) {
      const empty = document.createElement('p');
      empty.textContent = 'Доступных полей обломков нет.';
      debrisSection.append(empty);
    }
    content.append(debrisSection);
  };

  const open = (): void => {
    render();
    dialog.showModal();
  };

  const fleetButton = document.querySelector<HTMLButtonElement>('[aria-label="Флот"]');
  fleetButton?.addEventListener(
    'click',
    (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      open();
    },
    { capture: true },
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
