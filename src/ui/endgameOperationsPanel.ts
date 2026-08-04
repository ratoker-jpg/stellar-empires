import '../styles/endgameOperations.css';
import type { GameCommand, GameState } from '../simulation/types';
import { formatGameDuration } from './planetViewModel';
import {
  createEndgameOperationsViewModel,
  validateAllianceNameInput,
  validateSolarWarEntrySelection,
  type EndgameOperationsViewModel,
} from './endgameOperationsViewModel';

export type EndgameOperationsPanelMode = 'alliances' | 'solar-war';

export interface EndgameOperationsPanelOptions {
  readonly getState: () => GameState;
  readonly execute: (command: GameCommand, successMessage: string) => boolean;
  readonly refresh: () => void;
}

export interface EndgamePanelSummary {
  readonly title: string;
  readonly status: string;
  readonly primaryAction: string | null;
}

export function createEndgamePanelSummary(
  view: EndgameOperationsViewModel,
  mode: EndgameOperationsPanelMode,
): EndgamePanelSummary {
  if (mode === 'alliances') {
    return {
      title: 'Альянсы и одиночное участие',
      status: view.currentAllianceName === null
        ? 'Империя участвует самостоятельно.'
        : `Империя состоит в альянсе «${view.currentAllianceName}».`,
      primaryAction: view.canLeaveAlliance
        ? 'Покинуть альянс'
        : view.canCreateAlliance
          ? 'Создать альянс'
          : null,
    };
  }
  return {
    title: 'Солнечная война',
    status: view.activeEntry === null
      ? `Цикл ${view.cycle.index} открыт для входа.`
      : `Флот ${view.activeEntry.fleetId} удерживается до завершения цикла.`,
    primaryAction: view.activeEntry === null && view.eligibleFleets.length > 0
      ? 'Войти в Солнечную войну'
      : null,
  };
}

function createSection(titleText: string, className: string, testId?: string): HTMLElement {
  const section = document.createElement('section');
  section.className = className;
  if (testId !== undefined) section.dataset.testid = testId;
  const title = document.createElement('h2');
  title.textContent = titleText;
  section.append(title);
  return section;
}

function createParagraph(text: string, className?: string): HTMLParagraphElement {
  const paragraph = document.createElement('p');
  paragraph.textContent = text;
  if (className !== undefined) paragraph.className = className;
  return paragraph;
}

function createActionButton(
  label: string,
  testId: string,
  action: () => void,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.dataset.testid = testId;
  button.addEventListener('click', action);
  return button;
}

function renderUnavailable(host: HTMLElement): void {
  const section = createSection('Участие в эндгейме недоступно', 'endgame-empty-state');
  section.append(createParagraph('Текущая партия не содержит schema-v18 состояния участия.'));
  host.replaceChildren(section);
}

function renderAlliancePanel(
  host: HTMLElement,
  view: EndgameOperationsViewModel,
  options: EndgameOperationsPanelOptions,
): void {
  const summary = createEndgamePanelSummary(view, 'alliances');
  const overview = createSection(summary.title, 'endgame-overview', 'endgame-participation-summary');
  overview.append(
    createParagraph(summary.status),
    createParagraph(
      view.soloEligible
        ? 'Одиночное участие разрешено независимо от текущего членства.'
        : 'Одиночное участие недоступно.',
      'endgame-muted',
    ),
  );

  if (view.canCreateAlliance) {
    const form = document.createElement('form');
    form.className = 'endgame-action-form';
    form.dataset.testid = 'alliance-create-form';
    const label = document.createElement('label');
    label.textContent = 'Название публичного альянса';
    const input = document.createElement('input');
    input.type = 'text';
    input.minLength = 3;
    input.maxLength = 40;
    input.required = true;
    input.autocomplete = 'off';
    input.setAttribute('aria-label', 'Название публичного альянса');
    const feedback = document.createElement('p');
    feedback.className = 'endgame-feedback';
    feedback.dataset.testid = 'alliance-name-feedback';
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.textContent = 'Создать альянс';
    submit.dataset.testid = 'alliance-create-submit';
    const updateValidation = (): ReturnType<typeof validateAllianceNameInput> => {
      const validation = validateAllianceNameInput(input.value);
      feedback.textContent = validation.message;
      feedback.dataset.valid = String(validation.ok);
      submit.disabled = !validation.ok;
      return validation;
    };
    input.addEventListener('input', updateValidation);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const validation = updateValidation();
      if (!validation.ok) return;
      if (options.execute({
        type: 'CREATE_ALLIANCE',
        empireId: view.empireId,
        name: validation.normalizedName,
      }, `Альянс «${validation.normalizedName}» создан`)) {
        options.refresh();
      }
    });
    label.append(input);
    form.append(label, feedback, submit);
    overview.append(form);
    updateValidation();
  }

  const list = createSection('Публичные альянсы', 'endgame-alliance-list', 'alliance-public-list');
  if (view.alliances.length === 0) {
    list.append(createParagraph('Публичных альянсов пока нет.', 'endgame-muted'));
  }
  for (const alliance of view.alliances) {
    const card = document.createElement('article');
    card.className = `endgame-alliance-card${alliance.current ? ' is-current' : ''}`;
    card.dataset.allianceId = alliance.id;
    const header = document.createElement('header');
    const name = document.createElement('strong');
    name.textContent = alliance.name;
    const meta = document.createElement('span');
    meta.textContent = `${alliance.memberCount} участн. · основатель ${alliance.founderEmpireId}`;
    header.append(name, meta);
    const roster = document.createElement('ul');
    roster.setAttribute('aria-label', `Состав альянса ${alliance.name}`);
    for (const empireId of alliance.members) {
      const item = document.createElement('li');
      item.textContent = empireId === view.empireId ? `${empireId} · вы` : empireId;
      roster.append(item);
    }
    card.append(header, roster);
    if (alliance.canJoin) {
      card.append(createActionButton('Вступить', 'alliance-join', () => {
        if (options.execute({
          type: 'JOIN_ALLIANCE',
          empireId: view.empireId,
          allianceId: alliance.id,
        }, `Империя вступила в альянс «${alliance.name}»`)) {
          options.refresh();
        }
      }));
    }
    if (alliance.current && view.canLeaveAlliance) {
      card.append(createActionButton('Покинуть альянс', 'alliance-leave', () => {
        if (options.execute({
          type: 'LEAVE_ALLIANCE',
          empireId: view.empireId,
        }, `Империя покинула альянс «${alliance.name}»`)) {
          options.refresh();
        }
      }));
    }
    list.append(card);
  }
  host.replaceChildren(overview, list);
}

function renderSolarWarEntry(
  section: HTMLElement,
  view: EndgameOperationsViewModel,
  options: EndgameOperationsPanelOptions,
): void {
  if (view.activeEntry !== null) {
    const entry = view.activeEntry;
    section.append(
      createParagraph(`Флот ${entry.fleetId} принят в цикл ${entry.cycle.id}.`),
      createParagraph(
        `Форма участия: ${entry.participationKind === 'alliance' ? `альянс ${entry.participationId}` : 'самостоятельно'} · завершение через ${formatGameDuration(Math.max(0, entry.resolvesAt - options.getState().clock.elapsedSeconds))}.`,
        'endgame-muted',
      ),
    );
    return;
  }

  const label = document.createElement('label');
  label.textContent = 'Флот Солнечной войны';
  const select = document.createElement('select');
  select.setAttribute('aria-label', 'Флот Солнечной войны');
  select.dataset.testid = 'solar-war-fleet-select';
  for (const fleet of view.eligibleFleets) {
    const option = document.createElement('option');
    option.value = fleet.id;
    option.textContent = fleet.label;
    select.append(option);
  }
  label.append(select);
  const detail = createParagraph('', 'endgame-muted');
  detail.dataset.testid = 'solar-war-fleet-detail';
  const feedback = createParagraph('', 'endgame-feedback');
  feedback.dataset.testid = 'solar-war-entry-feedback';
  const submit = createActionButton('Войти в Солнечную войну', 'solar-war-enter', () => {
    const validation = validateSolarWarEntrySelection(options.getState(), select.value, view.empireId);
    feedback.textContent = validation.message;
    feedback.dataset.valid = String(validation.ok);
    if (!validation.ok) return;
    if (options.execute({
      type: 'ENTER_SOLAR_WAR',
      empireId: view.empireId,
      fleetId: select.value,
    }, `Флот ${select.value} вошёл в Солнечную войну`)) {
      options.refresh();
    }
  });
  const refreshSelection = (): void => {
    const fleet = view.eligibleFleets.find((candidate) => candidate.id === select.value);
    detail.textContent = fleet === undefined
      ? 'Нет доступного станционированного боевого флота.'
      : `${fleet.composition} · базирование ${fleet.originPlanetId}`;
    const validation = validateSolarWarEntrySelection(options.getState(), select.value, view.empireId);
    feedback.textContent = validation.message;
    feedback.dataset.valid = String(validation.ok);
    submit.disabled = !validation.ok;
  };
  select.addEventListener('change', refreshSelection);
  section.append(label, detail, feedback, submit);
  refreshSelection();
}

function renderSolarWarPanel(
  host: HTMLElement,
  view: EndgameOperationsViewModel,
  options: EndgameOperationsPanelOptions,
): void {
  const cycle = createSection('Текущий цикл', 'endgame-solar-cycle', 'solar-war-cycle');
  cycle.append(
    createParagraph(`Цикл ${view.cycle.index} · противник: ${view.cycle.factionLabel}`),
    createParagraph(`До разрешения ${formatGameDuration(view.cycle.remainingSeconds)}.`),
    createParagraph(view.cycle.enemySummary, 'endgame-muted'),
  );

  const entry = createSection('Участие игрока', 'endgame-solar-entry', 'solar-war-entry');
  entry.append(createParagraph(
    view.participationKind === 'alliance'
      ? `Результат будет учтён в счёте альянса «${view.currentAllianceName ?? view.currentAllianceId}».`
      : 'Результат будет учтён как самостоятельное участие империи.',
    'endgame-muted',
  ));
  renderSolarWarEntry(entry, view, options);

  const scoreboard = createSection(
    `Таблица цикла ${view.scoreboardCycleIndex}`,
    'endgame-scoreboard',
    'solar-war-scoreboard',
  );
  if (view.scoreboard.length === 0) {
    scoreboard.append(createParagraph('Разрешённых результатов для таблицы пока нет.', 'endgame-muted'));
  }
  for (const row of view.scoreboard) {
    const item = document.createElement('article');
    const name = document.createElement('strong');
    name.textContent = row.label;
    const result = document.createElement('span');
    result.textContent = `Очки ${row.score} · победы ${row.victories} · ничьи ${row.draws} · поражения ${row.defeats}`;
    item.append(name, result);
    scoreboard.append(item);
  }

  const publicResults = createSection(
    'Публичные результаты',
    'endgame-public-results',
    'solar-war-public-results',
  );
  if (view.publicResults.length === 0) {
    publicResults.append(createParagraph('Завершённых циклов пока нет.', 'endgame-muted'));
  }
  for (const result of view.publicResults) {
    const card = document.createElement('article');
    card.dataset.solarWarResultId = result.id;
    card.append(
      createParagraph(`${result.outcomeLabel} · ${result.empireId} · очки ${result.score}`),
      createParagraph(
        `${result.cycleId} · ${result.participationKind === 'alliance' ? `альянс ${result.participationId}` : 'самостоятельно'}`,
        'endgame-muted',
      ),
    );
    publicResults.append(card);
  }

  const ownedResults = createSection(
    'Мои боевые результаты',
    'endgame-owned-results',
    'solar-war-owned-results',
  );
  if (view.ownedResults.length === 0) {
    ownedResults.append(createParagraph('Личных результатов пока нет.', 'endgame-muted'));
  }
  for (const result of view.ownedResults) {
    const details = document.createElement('details');
    details.dataset.solarWarOwnedResultId = result.id;
    const summary = document.createElement('summary');
    summary.textContent = `${result.outcomeLabel} · ${result.cycleId} · очки ${result.score}`;
    details.append(
      summary,
      createParagraph(`Флот ${result.fleetId} · база ${result.originPlanetId}`),
      createParagraph(`Свои потери: ${result.ownLosses}`),
      createParagraph(`Свои выжившие: ${result.ownSurvivors}`),
      createParagraph(`Потери противника: ${result.enemyLosses}`),
      createParagraph(`Выжившие противника: ${result.enemySurvivors}`),
    );
    ownedResults.append(details);
  }

  host.replaceChildren(cycle, entry, scoreboard, publicResults, ownedResults);
}

export function renderEndgameOperationsPanel(
  host: HTMLElement,
  mode: EndgameOperationsPanelMode,
  options: EndgameOperationsPanelOptions,
): void {
  const view = createEndgameOperationsViewModel(options.getState());
  if (!view.available) {
    renderUnavailable(host);
    return;
  }
  if (mode === 'alliances') renderAlliancePanel(host, view, options);
  else renderSolarWarPanel(host, view, options);
}
