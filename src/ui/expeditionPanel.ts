import { estimateFlightToGalaxyPlanet } from '../simulation/fleets/flightCalculations';
import type { FleetState } from '../simulation/fleets/types';
import { AEGIS_RESEARCH_CATALOG } from '../simulation/research/catalog';
import { calculateResearchEffects } from '../simulation/research/progression';
import { getEmpireResearch } from '../simulation/research/researchState';
import type { GameCommand, GameState } from '../simulation/types';
import { formatGameDuration } from './planetViewModel';

export interface ExpeditionPanelOptions {
  readonly getState: () => GameState;
  readonly execute: (command: GameCommand, successMessage: string) => boolean;
}

function createNavigationButton(): HTMLButtonElement {
  const existing = document.querySelector<HTMLButtonElement>('#nav-expeditions');
  if (existing !== null) return existing;
  const galaxy = document.querySelector<HTMLButtonElement>('#nav-galaxy');
  const button = galaxy?.cloneNode(true) as HTMLButtonElement | undefined;
  const result = button ?? document.createElement('button');
  result.id = 'nav-expeditions';
  result.type = 'button';
  result.setAttribute('aria-label', 'Экспедиции');
  const title = result.querySelector('strong');
  if (title !== null) title.textContent = 'Экспедиции';
  const description = result.querySelector('small');
  if (description !== null) description.textContent = 'Дальние сектора';
  if (galaxy !== null) galaxy.insertAdjacentElement('afterend', result);
  return result;
}

function createDialog(): HTMLDialogElement {
  const existing = document.querySelector<HTMLDialogElement>('#expedition-dialog');
  if (existing !== null) return existing;
  const dialog = document.createElement('dialog');
  dialog.id = 'expedition-dialog';
  dialog.className = 'expedition-dialog';
  dialog.innerHTML = `
    <header class="expedition-header">
      <div><p class="panel-label">Deep Space Operations</p><h2>Экспедиции</h2></div>
      <button type="button" class="dialog-close" aria-label="Закрыть">×</button>
    </header>
    <section class="expedition-launch"></section>
    <section class="expedition-active"></section>
    <section class="expedition-reports"></section>
  `;
  dialog.querySelector<HTMLButtonElement>('.dialog-close')?.addEventListener('click', () => {
    dialog.close();
  });
  document.body.append(dialog);
  return dialog;
}

function fleetSpeedBonus(state: GameState, empireId: string): number {
  const research = getEmpireResearch(state.research, empireId);
  return research === undefined
    ? 0
    : calculateResearchEffects(research, AEGIS_RESEARCH_CATALOG).fleetSpeedPercent;
}

function availableTargets(state: GameState) {
  const occupied = new Set(state.planets.map((planet) => planet.galaxyPlanetId));
  return state.galaxy.systems.flatMap((system) =>
    system.planets
      .filter((planet) => !occupied.has(planet.id))
      .map((planet) => ({ system, planet })),
  );
}

function expeditionFleets(state: GameState): readonly FleetState[] {
  return state.fleets
    .filter(
      (fleet) =>
        fleet.empireId === 'player' &&
        fleet.status === 'stationed' &&
        fleet.location.type === 'planet' &&
        (fleet.ships['ship.aegis.scout'] ?? 0) > 0,
    )
    .sort((left, right) => left.id.localeCompare(right.id));
}

function rewardText(reward: { readonly metal: number; readonly crystal: number; readonly gas: number }): string {
  return `M ${reward.metal} · C ${reward.crystal} · G ${reward.gas}`;
}

export function mountExpeditionPanel(options: ExpeditionPanelOptions): void {
  const button = createNavigationButton();
  const dialog = createDialog();
  const launch = dialog.querySelector<HTMLElement>('.expedition-launch');
  const active = dialog.querySelector<HTMLElement>('.expedition-active');
  const reports = dialog.querySelector<HTMLElement>('.expedition-reports');
  if (launch === null || active === null || reports === null) {
    throw new Error('Expedition panel containers are missing.');
  }

  const render = (): void => {
    const state = options.getState();
    const fleets = expeditionFleets(state);
    const targets = availableTargets(state);
    launch.replaceChildren();
    const launchTitle = document.createElement('h3');
    launchTitle.textContent = 'Новая экспедиция';
    launch.append(launchTitle);

    if (fleets.length === 0 || targets.length === 0) {
      const empty = document.createElement('p');
      empty.textContent =
        fleets.length === 0
          ? 'Нужен станционированный флот минимум с одним разведчиком.'
          : 'Свободных позиций для экспедиции нет.';
      launch.append(empty);
    } else {
      const fleetSelect = document.createElement('select');
      for (const fleet of fleets) {
        const option = document.createElement('option');
        option.value = fleet.id;
        option.textContent = `${fleet.id} · скорость ${fleet.speed} · разведчиков ${fleet.ships['ship.aegis.scout'] ?? 0}`;
        fleetSelect.append(option);
      }
      const targetSelect = document.createElement('select');
      for (const target of targets) {
        const option = document.createElement('option');
        option.value = target.planet.id;
        option.textContent = `${target.system.name} · позиция ${target.planet.position} · ${target.planet.biome} · размер ${target.planet.size}`;
        targetSelect.append(option);
      }
      const preview = document.createElement('p');
      preview.className = 'expedition-preview';
      const start = document.createElement('button');
      start.type = 'button';
      start.textContent = 'Отправить экспедицию';

      const refresh = (): void => {
        const fleet = state.fleets.find((candidate) => candidate.id === fleetSelect.value);
        const origin =
          fleet?.location.type === 'planet'
            ? state.planets.find((planet) => planet.id === fleet.location.planetId)
            : undefined;
        if (fleet === undefined || origin === undefined || targetSelect.value.length === 0) {
          preview.textContent = 'Маршрут недоступен.';
          start.disabled = true;
          return;
        }
        try {
          const estimate = estimateFlightToGalaxyPlanet(
            state.galaxy,
            state.planets,
            fleet,
            targetSelect.value,
            fleetSpeedBonus(state, fleet.empireId),
          );
          const fuel = estimate.fuelCost * 2;
          const enough = origin.economy.resources.gas.amount >= fuel;
          preview.textContent = `Дистанция ${estimate.distance} · полный цикл ${formatGameDuration(estimate.durationSeconds * 2)} · газ ${fuel}/${origin.economy.resources.gas.amount}`;
          preview.classList.toggle('is-blocked', !enough);
          start.disabled = !enough;
        } catch {
          preview.textContent = 'Не удалось рассчитать экспедиционный маршрут.';
          start.disabled = true;
        }
      };

      fleetSelect.addEventListener('change', refresh);
      targetSelect.addEventListener('change', refresh);
      start.addEventListener('click', () => {
        if (
          options.execute(
            {
              type: 'START_EXPEDITION',
              empireId: 'player',
              fleetId: fleetSelect.value,
              targetGalaxyPlanetId: targetSelect.value,
            },
            'Экспедиция отправлена',
          )
        ) {
          render();
        }
      });
      launch.append(fleetSelect, targetSelect, preview, start);
      refresh();
    }

    active.replaceChildren();
    const activeTitle = document.createElement('h3');
    activeTitle.textContent = 'Активные экспедиции';
    active.append(activeTitle);
    const activeFleets = state.fleets.filter(
      (fleet) => fleet.empireId === 'player' && fleet.mission?.kind === 'expedition',
    );
    for (const fleet of activeFleets) {
      const card = document.createElement('article');
      const summary = document.createElement('strong');
      summary.textContent = `${fleet.id} · цель ${fleet.mission?.targetPlanetId ?? 'unknown'}`;
      const details = document.createElement('p');
      details.textContent =
        fleet.location.type === 'transit'
          ? `Завершение цикла через ${formatGameDuration(Math.max(0, fleet.location.arrivesAt - state.clock.elapsedSeconds))}`
          : fleet.status;
      const recall = document.createElement('button');
      recall.type = 'button';
      recall.textContent = 'Отозвать';
      recall.addEventListener('click', () => {
        if (
          options.execute(
            { type: 'RECALL_FLEET', empireId: 'player', fleetId: fleet.id },
            'Экспедиция отозвана',
          )
        ) {
          render();
        }
      });
      card.append(summary, details, recall);
      active.append(card);
    }
    if (activeFleets.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'Активных экспедиций нет.';
      active.append(empty);
    }

    reports.replaceChildren();
    const reportTitle = document.createElement('h3');
    reportTitle.textContent = 'Журнал экспедиций';
    reports.append(reportTitle);
    const entries = state.eventLog
      .filter(
        (entry) =>
          entry.event.payload.type === 'EXPEDITION_RESOLVE' &&
          entry.event.payload.report.empireId === 'player',
      )
      .slice(-12)
      .reverse();
    for (const entry of entries) {
      if (entry.event.payload.type !== 'EXPEDITION_RESOLVE') continue;
      const report = entry.event.payload.report;
      const card = document.createElement('article');
      const summary = document.createElement('strong');
      summary.textContent = `${report.outcome} · ${report.targetGalaxyPlanetId}`;
      const result = document.createElement('p');
      const losses = Object.entries(report.losses)
        .map(([unitId, quantity]) => `${unitId} × ${quantity}`)
        .join(' · ');
      result.textContent = `Награда ${rewardText(report.reward)}${losses.length > 0 ? ` · потери ${losses}` : ''}`;
      const narrative = document.createElement('small');
      narrative.textContent = report.narrative;
      card.append(summary, result, narrative);
      reports.append(card);
    }
    if (entries.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'Завершённых экспедиций пока нет.';
      reports.append(empty);
    }
  };

  button.addEventListener('click', () => {
    render();
    dialog.showModal();
  });
}
