import {
  getCurrentObservations,
  getEmpireIntelligence,
} from '../simulation/intelligence/intelligenceState';
import type { GameCommand, GameState } from '../simulation/types';
import { getUnitDefinition } from '../simulation/units/catalog';

export interface MissionScreenOptions {
  readonly getState: () => GameState;
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
    const planets = state.planets.filter((planet) => planet.ownerEmpireId === 'player');
    content.replaceChildren();

    const createSection = document.createElement('section');
    createSection.className = 'mission-create';
    const createTitle = document.createElement('h3');
    createTitle.textContent = 'Сформировать флот';
    const originSelect = document.createElement('select');
    for (const planet of planets) {
      const option = document.createElement('option');
      option.value = planet.id;
      option.textContent = planet.name;
      originSelect.append(option);
    }
    const shipFields = document.createElement('div');
    shipFields.className = 'mission-fields';
    const origin = planets[0];
    const shipInputs: Array<{ readonly id: string; readonly field: HTMLLabelElement }> = [];
    for (const [unitId, count] of Object.entries(origin?.inventory.ships ?? {})) {
      if (count <= 0) continue;
      const field = numberInput(getUnitDefinition(unitId)?.name ?? unitId, count);
      shipInputs.push({ id: unitId, field });
      shipFields.append(field);
    }
    const cargoMetal = numberInput('Груз: металл');
    const cargoCrystal = numberInput('Груз: кристалл');
    const cargoGas = numberInput('Груз: газ');
    shipFields.append(cargoMetal, cargoCrystal, cargoGas);
    const createButton = document.createElement('button');
    createButton.type = 'button';
    createButton.textContent = 'Создать флот';
    createButton.disabled = shipInputs.length === 0;
    createButton.addEventListener('click', () => {
      const ships = Object.fromEntries(
        shipInputs
          .map(({ id, field }) => [id, readNumber(field)] as const)
          .filter(([, quantity]) => quantity > 0),
      );
      if (
        options.execute(
          {
            type: 'CREATE_FLEET',
            empireId: 'player',
            planetId: originSelect.value,
            ships,
            cargo: {
              metal: readNumber(cargoMetal),
              crystal: readNumber(cargoCrystal),
              gas: readNumber(cargoGas),
            },
          },
          'Флот сформирован',
        )
      ) render();
    });
    createSection.append(createTitle, originSelect, shipFields, createButton);
    content.append(createSection);

    const list = document.createElement('section');
    list.className = 'mission-fleet-list';
    const listTitle = document.createElement('h3');
    listTitle.textContent = `Флоты · ${state.fleets.filter((fleet) => fleet.empireId === 'player').length}`;
    list.append(listTitle);

    for (const fleet of state.fleets.filter((candidate) => candidate.empireId === 'player')) {
      const card = document.createElement('article');
      const info = document.createElement('div');
      const composition = Object.entries(fleet.ships)
        .map(([unitId, quantity]) => `${getUnitDefinition(unitId)?.name ?? unitId} × ${quantity}`)
        .join(' · ');
      const name = document.createElement('strong');
      name.textContent = fleet.id;
      const meta = document.createElement('p');
      meta.textContent = `${fleet.status} · скорость ${fleet.speed} · ${composition}`;
      info.append(name, meta);
      const actions = document.createElement('div');
      actions.className = 'mission-actions';

      if (fleet.status === 'stationed' && fleet.location.type === 'planet') {
        const fleetPlanetId = fleet.location.planetId;
        const targets = state.planets.filter((planet) => planet.id !== fleetPlanetId);
        if (targets.length > 0) {
          const target = document.createElement('select');
          for (const planet of targets) {
            const option = document.createElement('option');
            option.value = planet.id;
            option.textContent = `${planet.name} · ${planet.ownerEmpireId}`;
            target.append(option);
          }
          const mission = document.createElement('select');
          mission.innerHTML = '<option value="transport">Транспорт</option><option value="deploy">Размещение</option><option value="scout">Разведка</option>';
          const send = document.createElement('button');
          send.type = 'button';
          send.textContent = 'Отправить';
          send.addEventListener('click', () => {
            const missionKind =
              mission.value === 'deploy'
                ? 'deploy'
                : mission.value === 'scout'
                  ? 'scout'
                  : 'transport';
            if (
              options.execute(
                {
                  type: 'SEND_FLEET',
                  empireId: 'player',
                  fleetId: fleet.id,
                  targetPlanetId: target.value,
                  mission: missionKind,
                },
                'Флот отправлен',
              )
            ) render();
          });
          actions.append(target, mission, send);
        }
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
      const targetName = observation.snapshot.name;
      const summary = document.createElement('strong');
      summary.textContent = `${targetName} · уровень ${observation.snapshot.level}`;
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
