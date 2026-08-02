import type { ResourceCost } from '../simulation/economy/types';
import type { FleetState } from '../simulation/fleets/types';
import {
  ARENA_CYCLE_SECONDS,
  enterArenaChallenge,
  getArenaChallenges,
  getArenaCycleIndex,
} from '../simulation/pveMeta/arena';
import {
  PVE_REPUTATION_AWARDS,
  PVE_REPUTATION_THRESHOLDS,
  calculateExpeditionReputationAward,
  calculatePirateReputationAward,
  calculateSpaceObjectReputationAward,
  createInitialPveMetaState,
  getEmpirePveReputation,
  getPveReputationTier,
  type ArenaChallenge,
  type ArenaDifficulty,
  type ArenaEntry,
  type ArenaResult,
  type PveReputationTier,
} from '../simulation/pveMeta/reputation';
import type { GameCommand, GameState } from '../simulation/types';
import { getUnitDefinition } from '../simulation/units/catalog';
import { formatGameDuration } from './planetViewModel';

const PLAYER_EMPIRE_ID = 'player';
const TIER_ORDER: readonly PveReputationTier[] = ['recruit', 'ranger', 'vanguard', 'warden'];

const TIER_LABELS: Readonly<Record<PveReputationTier, string>> = {
  recruit: 'Рекрут',
  ranger: 'Рейнджер',
  vanguard: 'Авангард',
  warden: 'Страж',
};

const DIFFICULTY_LABELS: Readonly<Record<ArenaDifficulty, string>> = {
  patrol: 'Патруль',
  assault: 'Штурм',
  elite: 'Элита',
};

const DIFFICULTY_REPUTATION: Readonly<Record<ArenaDifficulty, number>> = {
  patrol: 10,
  assault: 20,
  elite: 35,
};

const FACTION_LABELS = {
  aegis: 'Эгида',
  synod: 'Синод',
  veyra: 'Вейра',
} as const;

const OUTCOME_LABELS: Readonly<Record<ArenaResult['outcome'], string>> = {
  victory: 'Победа',
  defeat: 'Поражение',
  draw: 'Ничья',
  withdrawn: 'Отозвано',
};

const VALIDATION_MESSAGES: Readonly<Record<string, string>> = {
  ARENA_ENTRY_ACTIVE: 'Сначала заверши или отзови текущий вход на Арену.',
  ARENA_CHALLENGE_UNAVAILABLE: 'Испытание уже сменилось. Обнови текущий цикл.',
  ARENA_FLEET_NOT_FOUND: 'Выбранный флот больше недоступен.',
  ARENA_FLEET_NOT_IDLE: 'Нужен собственный станционированный флот без активной миссии.',
  ARENA_ORIGIN_UNAVAILABLE: 'Планета базирования флота недоступна.',
  ARENA_ENTRY_COST_UNAFFORDABLE: 'На планете базирования недостаточно ресурсов для входа.',
};

export interface ReputationProgressView {
  readonly score: number;
  readonly tier: PveReputationTier;
  readonly tierLabel: string;
  readonly nextTier: PveReputationTier | null;
  readonly nextTierLabel: string | null;
  readonly currentProgress: number;
  readonly requiredProgress: number;
  readonly percent: number;
}

export interface ArenaFleetOptionView {
  readonly id: string;
  readonly originPlanetId: string;
  readonly label: string;
  readonly shipCount: number;
}

export interface ArenaChallengeView {
  readonly challenge: ArenaChallenge;
  readonly difficultyLabel: string;
  readonly factionLabel: string;
  readonly enemySummary: string;
  readonly costLine: string;
  readonly rewardLine: string;
  readonly reputationAward: number;
}

export interface ReputationLedgerEntry {
  readonly id: string;
  readonly resolvedAt: number;
  readonly source: 'expedition' | 'space-object' | 'pirate-base' | 'arena';
  readonly title: string;
  readonly detail: string;
  readonly amount: number;
}

export interface PveMetaOperationsView {
  readonly reputation: ReputationProgressView;
  readonly cycleIndex: number;
  readonly cycleEndsAt: number;
  readonly cycleRemainingSeconds: number;
  readonly challenges: readonly ArenaChallengeView[];
  readonly eligibleFleets: readonly ArenaFleetOptionView[];
  readonly activeEntry: ArenaEntry | null;
  readonly arenaHistory: readonly ArenaResult[];
  readonly reputationLedger: readonly ReputationLedgerEntry[];
}

export interface ArenaEntryValidation {
  readonly ok: boolean;
  readonly code: string | null;
  readonly message: string;
}

export interface ArenaOperationsPanelOptions {
  readonly getState: () => GameState;
  readonly execute: (command: GameCommand, successMessage: string) => boolean;
  readonly refresh: () => void;
}

function resourceLine(cost: ResourceCost): string {
  return `M ${cost.metal} · C ${cost.crystal} · G ${cost.gas}`;
}

function totalUnits(units: Readonly<Record<string, number>>): number {
  return Object.values(units).reduce((total, quantity) => total + quantity, 0);
}

function unitSummary(units: Readonly<Record<string, number>>): string {
  return Object.entries(units)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([unitId, quantity]) => `${getUnitDefinition(unitId)?.name ?? unitId} ×${quantity}`)
    .join(' · ');
}

function lossSummary(
  initial: Readonly<Record<string, number>>,
  remaining: Readonly<Record<string, number>>,
): string {
  const lost = Object.keys(initial).reduce(
    (total, unitId) => total + Math.max(0, (initial[unitId] ?? 0) - (remaining[unitId] ?? 0)),
    0,
  );
  return lost === 0 ? 'потерь нет' : `потеряно кораблей: ${lost}`;
}

function createReputationProgress(score: number): ReputationProgressView {
  const tier = getPveReputationTier(score);
  const tierIndex = TIER_ORDER.indexOf(tier);
  const nextTier = TIER_ORDER[tierIndex + 1] ?? null;
  const currentThreshold = PVE_REPUTATION_THRESHOLDS[tier];
  const nextThreshold = nextTier === null ? currentThreshold : PVE_REPUTATION_THRESHOLDS[nextTier];
  const currentProgress = nextTier === null ? 0 : Math.max(0, score - currentThreshold);
  const requiredProgress = nextTier === null ? 0 : nextThreshold - currentThreshold;
  return {
    score,
    tier,
    tierLabel: TIER_LABELS[tier],
    nextTier,
    nextTierLabel: nextTier === null ? null : TIER_LABELS[nextTier],
    currentProgress,
    requiredProgress,
    percent: nextTier === null
      ? 100
      : Math.min(100, Math.floor((currentProgress * 100) / Math.max(1, requiredProgress))),
  };
}

function eligibleArenaFleets(state: GameState, empireId: string): readonly ArenaFleetOptionView[] {
  return state.fleets
    .filter(
      (fleet) =>
        fleet.empireId === empireId &&
        fleet.status === 'stationed' &&
        fleet.location.type === 'planet' &&
        fleet.mission === null &&
        totalUnits(fleet.ships) > 0,
    )
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((fleet): ArenaFleetOptionView => {
      const originPlanetId = fleet.location.type === 'planet'
        ? fleet.location.planetId
        : fleet.originPlanetId;
      const planet = state.planets.find((candidate) => candidate.id === originPlanetId);
      const shipCount = totalUnits(fleet.ships);
      return {
        id: fleet.id,
        originPlanetId,
        shipCount,
        label: `${fleet.id} · ${planet?.name ?? originPlanetId} · кораблей ${shipCount}`,
      };
    });
}

function activePirateHuntAt(state: GameState, targetId: string, resolvedAt: number): boolean {
  return [...state.worldEvents.active, ...state.worldEvents.history].some(
    (event) =>
      event.definitionId === 'pirate-hunt' &&
      event.targetId === targetId &&
      event.startedAt <= resolvedAt &&
      event.endsAt >= resolvedAt,
  );
}

export function createReputationLedger(
  state: GameState,
  empireId = PLAYER_EMPIRE_ID,
): readonly ReputationLedgerEntry[] {
  const entries: ReputationLedgerEntry[] = [];
  for (const executed of state.eventLog) {
    const payload = executed.event.payload;
    if (payload.type === 'EXPEDITION_RESOLVE' && payload.report.empireId === empireId) {
      const amount = calculateExpeditionReputationAward(payload.report.outcome, payload.report.reward);
      if (amount > 0) {
        entries.push({
          id: `reputation-${payload.report.id}`,
          resolvedAt: executed.executedAt,
          source: 'expedition',
          title: 'Успешная экспедиция',
          detail: `Найдены ресурсы · ${resourceLine(payload.report.reward)}`,
          amount,
        });
      }
      continue;
    }
    if (payload.type === 'SPACE_OBJECT_MISSION_RESOLVE' && payload.report.empireId === empireId) {
      const amount = calculateSpaceObjectReputationAward(
        payload.report.depletion,
        payload.report.reward,
      );
      if (amount > 0) {
        entries.push({
          id: `reputation-${payload.report.id}`,
          resolvedAt: executed.executedAt,
          source: 'space-object',
          title: 'Добыча на космическом объекте',
          detail: `Положительный выход · M ${payload.report.reward.metal} · C ${payload.report.reward.crystal} · G ${payload.report.reward.gas} · X ${payload.report.reward.exoticMatter}`,
          amount,
        });
      }
      continue;
    }
    if (payload.type === 'BATTLE_REPORT' && payload.report.attackerEmpireId === empireId) {
      const destroyed = payload.report.destruction?.planetDestroyed ?? false;
      const amount = calculatePirateReputationAward(
        destroyed,
        destroyed && activePirateHuntAt(
          state,
          payload.report.targetPlanetId,
          executed.executedAt,
        ),
      );
      if (amount > 0) {
        entries.push({
          id: `reputation-${payload.report.id}`,
          resolvedAt: executed.executedAt,
          source: 'pirate-base',
          title: amount > PVE_REPUTATION_AWARDS.pirateBaseDestroyed
            ? 'Цель охоты на пиратов уничтожена'
            : 'Пиратская база уничтожена',
          detail: amount > PVE_REPUTATION_AWARDS.pirateBaseDestroyed
            ? 'База +30 · активная цель охоты +20'
            : 'Уничтожение базы +30',
          amount,
        });
      }
    }
  }
  for (const result of state.pveMeta?.arenaHistory ?? []) {
    if (result.empireId !== empireId || result.reputationAward <= 0) continue;
    entries.push({
      id: `reputation-${result.id}`,
      resolvedAt: result.resolvedAt,
      source: 'arena',
      title: `Арена: ${DIFFICULTY_LABELS[result.difficulty]}`,
      detail: `${OUTCOME_LABELS[result.outcome]} · ${resourceLine(result.rewardGranted)}`,
      amount: result.reputationAward,
    });
  }
  return entries
    .sort((left, right) => right.resolvedAt - left.resolvedAt || left.id.localeCompare(right.id))
    .slice(0, 16);
}

export function createPveMetaOperationsView(
  state: GameState,
  empireId = PLAYER_EMPIRE_ID,
): PveMetaOperationsView {
  const pveMeta = state.pveMeta ?? createInitialPveMetaState(state.empires);
  const score = getEmpirePveReputation(pveMeta, empireId)?.reputation ?? 0;
  const cycleIndex = getArenaCycleIndex(state.clock.elapsedSeconds);
  const cycleEndsAt = (cycleIndex + 1) * ARENA_CYCLE_SECONDS;
  return {
    reputation: createReputationProgress(score),
    cycleIndex,
    cycleEndsAt,
    cycleRemainingSeconds: Math.max(0, cycleEndsAt - state.clock.elapsedSeconds),
    challenges: getArenaChallenges(state).map((challenge): ArenaChallengeView => ({
      challenge,
      difficultyLabel: DIFFICULTY_LABELS[challenge.difficulty],
      factionLabel: FACTION_LABELS[challenge.factionId],
      enemySummary: unitSummary(challenge.enemyUnits),
      costLine: resourceLine(challenge.entryCost),
      rewardLine: resourceLine(challenge.reward),
      reputationAward: DIFFICULTY_REPUTATION[challenge.difficulty],
    })),
    eligibleFleets: eligibleArenaFleets(state, empireId),
    activeEntry: pveMeta.activeArenaEntries.find((entry) => entry.empireId === empireId) ?? null,
    arenaHistory: pveMeta.arenaHistory
      .filter((entry) => entry.empireId === empireId)
      .sort((left, right) => right.resolvedAt - left.resolvedAt || left.id.localeCompare(right.id))
      .slice(0, 12),
    reputationLedger: createReputationLedger(state, empireId),
  };
}

export function validateArenaEntrySelection(
  state: GameState,
  challengeId: string,
  fleetId: string,
  empireId = PLAYER_EMPIRE_ID,
): ArenaEntryValidation {
  if (fleetId.length === 0) {
    return {
      ok: false,
      code: 'ARENA_FLEET_NOT_FOUND',
      message: 'Нет доступного станционированного флота.',
    };
  }
  const result = enterArenaChallenge(state, {
    type: 'ENTER_ARENA_CHALLENGE',
    empireId,
    challengeId,
    fleetId,
  });
  if (result.ok) {
    return { ok: true, code: null, message: 'Флот и ресурсы готовы к входу.' };
  }
  return {
    ok: false,
    code: result.code,
    message: VALIDATION_MESSAGES[result.code] ?? result.message,
  };
}

function createSection(titleText: string, className: string): HTMLElement {
  const section = document.createElement('section');
  section.className = className;
  const heading = document.createElement('h2');
  heading.textContent = titleText;
  section.append(heading);
  return section;
}

function createDataLine(label: string, value: string): HTMLElement {
  const row = document.createElement('div');
  const term = document.createElement('span');
  term.textContent = label;
  const data = document.createElement('strong');
  data.textContent = value;
  row.append(term, data);
  return row;
}

function renderReputation(view: PveMetaOperationsView): HTMLElement {
  const section = createSection('Репутация PvE', 'arena-reputation');
  section.dataset.testid = 'pve-reputation-card';
  const score = document.createElement('div');
  score.className = 'arena-reputation-score';
  const value = document.createElement('strong');
  value.textContent = String(view.reputation.score);
  const tier = document.createElement('span');
  tier.textContent = view.reputation.tierLabel;
  score.append(value, tier);
  const progress = document.createElement('progress');
  progress.max = Math.max(1, view.reputation.requiredProgress);
  progress.value = view.reputation.nextTier === null
    ? progress.max
    : view.reputation.currentProgress;
  progress.setAttribute('aria-label', 'Прогресс до следующего уровня репутации');
  const detail = document.createElement('p');
  detail.textContent = view.reputation.nextTier === null
    ? 'Максимальный уровень достигнут.'
    : `${view.reputation.currentProgress}/${view.reputation.requiredProgress} до уровня «${view.reputation.nextTierLabel}»`;
  section.append(score, progress, detail);
  return section;
}

function renderAwardRules(): HTMLElement {
  const section = createSection('Точные начисления', 'arena-award-rules');
  const list = document.createElement('ul');
  for (const [label, value] of [
    ['Успешная экспедиция с ресурсами', `+${PVE_REPUTATION_AWARDS.expeditionSuccess}`],
    ['Операция на объекте с положительным выходом', `+${PVE_REPUTATION_AWARDS.spaceObjectYield}`],
    ['Уничтоженная пиратская база', `+${PVE_REPUTATION_AWARDS.pirateBaseDestroyed}`],
    ['Активная цель «Охоты на пиратов»', `дополнительно +${PVE_REPUTATION_AWARDS.pirateHuntTargetDestroyed}`],
    ['Победа на Арене: патруль / штурм / элита', '+10 / +20 / +35'],
  ] as const) {
    const item = document.createElement('li');
    item.append(createDataLine(label, value));
    list.append(item);
  }
  section.append(list);
  return section;
}

function renderActiveEntry(
  entry: ArenaEntry,
  state: GameState,
  options: ArenaOperationsPanelOptions,
): HTMLElement {
  const section = createSection('Активный вход', 'arena-active-entry');
  section.dataset.testid = 'arena-active-entry';
  const card = document.createElement('article');
  card.append(
    createDataLine('Испытание', DIFFICULTY_LABELS[entry.challenge.difficulty]),
    createDataLine('Флот', entry.fleetId),
    createDataLine(
      'Разрешение',
      entry.resolvesAt <= state.clock.elapsedSeconds
        ? 'при ближайшей обработке времени'
        : `через ${formatGameDuration(entry.resolvesAt - state.clock.elapsedSeconds)}`,
    ),
    createDataLine('Противник', unitSummary(entry.challenge.enemyUnits)),
  );
  const withdraw = document.createElement('button');
  withdraw.type = 'button';
  withdraw.textContent = 'Отозвать без возврата стоимости';
  withdraw.dataset.testid = 'arena-withdraw';
  withdraw.addEventListener('click', () => {
    if (options.execute({
      type: 'WITHDRAW_ARENA_ENTRY',
      empireId: PLAYER_EMPIRE_ID,
      entryId: entry.id,
    }, 'Вход на Арену отозван')) {
      options.refresh();
    }
  });
  card.append(withdraw);
  section.append(card);
  return section;
}

function renderChallenge(
  challengeView: ArenaChallengeView,
  view: PveMetaOperationsView,
  options: ArenaOperationsPanelOptions,
): HTMLElement {
  const card = document.createElement('article');
  card.className = `arena-challenge is-${challengeView.challenge.difficulty}`;
  card.dataset.testid = `arena-challenge-${challengeView.challenge.difficulty}`;
  const header = document.createElement('header');
  const title = document.createElement('h3');
  title.textContent = challengeView.difficultyLabel;
  const faction = document.createElement('span');
  faction.textContent = challengeView.factionLabel;
  header.append(title, faction);
  const details = document.createElement('div');
  details.className = 'arena-challenge-details';
  details.append(
    createDataLine('Силы противника', challengeView.enemySummary),
    createDataLine('Стоимость входа', challengeView.costLine),
    createDataLine('Награда за победу', challengeView.rewardLine),
    createDataLine('Репутация', `+${challengeView.reputationAward}`),
    createDataLine('Длительность', formatGameDuration(challengeView.challenge.durationSeconds)),
  );
  const label = document.createElement('label');
  label.className = 'arena-fleet-control';
  const caption = document.createElement('span');
  caption.textContent = 'Флот';
  const select = document.createElement('select');
  select.setAttribute('aria-label', `Флот для испытания ${challengeView.difficultyLabel}`);
  select.dataset.testid = `arena-fleet-${challengeView.challenge.difficulty}`;
  for (const fleet of view.eligibleFleets) {
    const option = document.createElement('option');
    option.value = fleet.id;
    option.textContent = fleet.label;
    select.append(option);
  }
  label.append(caption, select);
  const validation = document.createElement('p');
  validation.className = 'arena-validation';
  validation.setAttribute('role', 'status');
  const enter = document.createElement('button');
  enter.type = 'button';
  enter.textContent = 'Войти в испытание';
  enter.dataset.testid = `arena-enter-${challengeView.challenge.difficulty}`;
  const refreshValidation = (): void => {
    const current = options.getState();
    const result = validateArenaEntrySelection(
      current,
      challengeView.challenge.id,
      select.value,
    );
    validation.textContent = result.message;
    validation.dataset.validationCode = result.code ?? 'ready';
    enter.disabled = !result.ok;
  };
  select.addEventListener('change', refreshValidation);
  enter.addEventListener('click', () => {
    if (options.execute({
      type: 'ENTER_ARENA_CHALLENGE',
      empireId: PLAYER_EMPIRE_ID,
      fleetId: select.value,
      challengeId: challengeView.challenge.id,
    }, `Флот вошёл в испытание «${challengeView.difficultyLabel}»`)) {
      options.refresh();
    } else {
      refreshValidation();
    }
  });
  card.append(header, details, label, validation, enter);
  refreshValidation();
  return card;
}

function renderChallenges(
  view: PveMetaOperationsView,
  options: ArenaOperationsPanelOptions,
): HTMLElement {
  const section = createSection('Текущие испытания', 'arena-challenges');
  const cycle = document.createElement('p');
  cycle.className = 'arena-cycle';
  cycle.textContent = `Цикл ${view.cycleIndex} · обновление через ${formatGameDuration(view.cycleRemainingSeconds)}`;
  const grid = document.createElement('div');
  grid.className = 'arena-challenge-grid';
  for (const challenge of view.challenges) grid.append(renderChallenge(challenge, view, options));
  section.append(cycle, grid);
  return section;
}

function renderArenaHistory(view: PveMetaOperationsView): HTMLElement {
  const section = createSection('История Арены', 'arena-history');
  const list = document.createElement('div');
  list.className = 'arena-history-list';
  for (const result of view.arenaHistory) {
    const card = document.createElement('article');
    const title = document.createElement('strong');
    title.textContent = `${DIFFICULTY_LABELS[result.difficulty]} · ${OUTCOME_LABELS[result.outcome]}`;
    const detail = document.createElement('p');
    detail.textContent = `${result.fleetId} · ${lossSummary(result.attackerInitial, result.attackerRemaining)}`;
    const reward = document.createElement('small');
    reward.textContent = `Награда ${resourceLine(result.rewardGranted)} · репутация +${result.reputationAward}`;
    card.append(title, detail, reward);
    list.append(card);
  }
  if (view.arenaHistory.length === 0) list.textContent = 'Завершённых входов пока нет.';
  section.append(list);
  return section;
}

function renderReputationLedger(view: PveMetaOperationsView): HTMLElement {
  const section = createSection('Последние начисления репутации', 'arena-reputation-ledger');
  const list = document.createElement('div');
  list.className = 'arena-ledger-list';
  for (const entry of view.reputationLedger) {
    const card = document.createElement('article');
    const title = document.createElement('strong');
    title.textContent = entry.title;
    const detail = document.createElement('p');
    detail.textContent = entry.detail;
    const amount = document.createElement('span');
    amount.textContent = `+${entry.amount}`;
    card.append(title, detail, amount);
    list.append(card);
  }
  if (view.reputationLedger.length === 0) {
    list.textContent = 'Начислений в доступной истории пока нет.';
  }
  section.append(list);
  return section;
}

export function renderArenaOperationsPanel(
  host: HTMLElement,
  options: ArenaOperationsPanelOptions,
): void {
  const state = options.getState();
  const view = createPveMetaOperationsView(state);
  const header = document.createElement('section');
  header.className = 'arena-meta-header';
  header.append(renderReputation(view), renderAwardRules());
  const sections: HTMLElement[] = [header];
  if (view.activeEntry !== null) {
    sections.push(renderActiveEntry(view.activeEntry, state, options));
  }
  sections.push(
    renderChallenges(view, options),
    renderArenaHistory(view),
    renderReputationLedger(view),
  );
  host.replaceChildren(...sections);
}
