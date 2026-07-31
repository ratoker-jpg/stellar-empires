import type { ResourceId } from '../simulation/economy/types';
import { quoteMarketSwap } from '../simulation/market/market';
import type { GameCommand, GameState } from '../simulation/types';

export interface MarketPanelBridge {
  readonly getState: () => GameState;
  readonly getActivePlanetId: () => string;
  readonly execute: (command: GameCommand, successMessage: string) => boolean;
  readonly refresh: () => void;
}

const RESOURCE_LABELS: Readonly<Record<ResourceId, string>> = {
  metal: 'Металл',
  crystal: 'Минералы',
  gas: 'Газ',
};

function createField(labelText: string, control: HTMLElement): HTMLLabelElement {
  const label = document.createElement('label');
  const caption = document.createElement('span');
  caption.textContent = labelText;
  label.append(caption, control);
  return label;
}

function createResourceSelect(selected: ResourceId): HTMLSelectElement {
  const select = document.createElement('select');
  for (const resourceId of ['metal', 'crystal', 'gas'] as const) {
    const option = document.createElement('option');
    option.value = resourceId;
    option.textContent = RESOURCE_LABELS[resourceId];
    select.append(option);
  }
  select.value = selected;
  return select;
}

function createPlanetSelect(
  state: GameState,
  selectedPlanetId: string,
): HTMLSelectElement {
  const select = document.createElement('select');
  select.dataset.testid = 'market-planet';
  for (const planet of state.planets
    .filter((candidate) => candidate.ownerEmpireId === 'player')
    .sort((left, right) =>
      left.systemId.localeCompare(right.systemId) ||
      left.position - right.position ||
      left.id.localeCompare(right.id))) {
    const option = document.createElement('option');
    option.value = planet.id;
    option.textContent = planet.name;
    select.append(option);
  }
  select.value = [...select.options].some((option) => option.value === selectedPlanetId)
    ? selectedPlanetId
    : select.options[0]?.value ?? '';
  return select;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value);
}

function renderPlanetStocks(
  host: HTMLElement,
  state: GameState,
  planetId: string,
): void {
  const planet = state.planets.find(
    (candidate) => candidate.id === planetId && candidate.ownerEmpireId === 'player',
  );
  host.replaceChildren();
  if (planet === undefined) {
    host.textContent = 'Выбранная колония недоступна.';
    return;
  }
  for (const resourceId of ['metal', 'crystal', 'gas'] as const) {
    const stock = planet.economy.resources[resourceId];
    const item = document.createElement('span');
    item.dataset.resourceId = resourceId;
    item.textContent = `${RESOURCE_LABELS[resourceId]} ${formatNumber(stock.amount)} / ${formatNumber(stock.capacity)}`;
    host.append(item);
  }
}

export function renderMarketPanel(
  host: HTMLElement,
  bridge: MarketPanelBridge,
): void {
  const state = bridge.getState();
  const section = document.createElement('section');
  section.className = 'market-panel operations-embedded-panel';
  section.dataset.testid = 'canonical-market-panel';
  const heading = document.createElement('h2');
  heading.textContent = 'Динамический рынок';
  const reserves = document.createElement('div');
  reserves.className = 'market-reserves';
  for (const resourceId of ['metal', 'crystal', 'gas'] as const) {
    const item = document.createElement('span');
    item.textContent = `${RESOURCE_LABELS[resourceId]} ${formatNumber(state.market.reserves[resourceId])}`;
    reserves.append(item);
  }

  const form = document.createElement('form');
  form.className = 'market-form';
  form.dataset.testid = 'market-form';
  const planet = createPlanetSelect(state, bridge.getActivePlanetId());
  const give = createResourceSelect('metal');
  give.dataset.testid = 'market-give-resource';
  const receive = createResourceSelect('crystal');
  receive.dataset.testid = 'market-receive-resource';
  const amount = document.createElement('input');
  amount.type = 'number';
  amount.min = '1';
  amount.value = '500';
  amount.dataset.testid = 'market-give-amount';
  const stocks = document.createElement('div');
  stocks.className = 'market-colony-stocks';
  stocks.dataset.testid = 'market-colony-stocks';
  const quote = document.createElement('output');
  quote.className = 'market-quote';
  quote.dataset.testid = 'market-quote';
  quote.setAttribute('aria-live', 'polite');
  const feedback = document.createElement('output');
  feedback.className = 'operations-command-feedback';
  feedback.dataset.testid = 'market-feedback';
  feedback.setAttribute('aria-live', 'polite');
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.textContent = 'Подтвердить обмен';

  const updateQuote = (): void => {
    const current = bridge.getState();
    renderPlanetStocks(stocks, current, planet.value);
    const selectedPlanet = current.planets.find(
      (candidate) => candidate.id === planet.value && candidate.ownerEmpireId === 'player',
    );
    const giveResourceId = give.value as ResourceId;
    const receiveResourceId = receive.value as ResourceId;
    const giveAmount = Number(amount.value);
    const result = quoteMarketSwap(
      current.market,
      giveResourceId,
      receiveResourceId,
      giveAmount,
    );
    const localAmount = selectedPlanet?.economy.resources[giveResourceId].amount ?? 0;
    if (selectedPlanet === undefined) {
      quote.textContent = 'Сделка недоступна · колония не найдена';
      submit.disabled = true;
      return;
    }
    if (localAmount < giveAmount) {
      quote.textContent = `Сделка недоступна · на колонии ${formatNumber(localAmount)}, требуется ${formatNumber(giveAmount)}`;
      submit.disabled = true;
      return;
    }
    quote.textContent = result.accepted
      ? `Получишь ${formatNumber(result.receiveAmount)} · комиссия ${formatNumber(result.feeAmount)} · влияние ${(result.priceImpactPermille / 10).toFixed(1)}%`
      : `Сделка недоступна · ${result.rejectionCode ?? 'ошибка'}`;
    submit.disabled = !result.accepted;
  };
  for (const input of [planet, give, receive, amount]) {
    input.addEventListener('input', updateQuote);
    input.addEventListener('change', updateQuote);
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const current = bridge.getState();
    const result = quoteMarketSwap(
      current.market,
      give.value as ResourceId,
      receive.value as ResourceId,
      Number(amount.value),
    );
    if (!result.accepted) {
      feedback.dataset.state = 'error';
      feedback.textContent = 'Сделка отклонена текущей рыночной моделью.';
      return;
    }
    const accepted = bridge.execute(
      {
        type: 'MARKET_SWAP',
        empireId: 'player',
        planetId: planet.value,
        giveResourceId: give.value as ResourceId,
        receiveResourceId: receive.value as ResourceId,
        giveAmount: Number(amount.value),
      },
      `Рынок · получено ${result.receiveAmount} ${RESOURCE_LABELS[receive.value as ResourceId]}`,
    );
    feedback.dataset.state = accepted ? 'success' : 'error';
    feedback.textContent = accepted
      ? `Обмен выполнен на колонии ${current.planets.find((candidate) => candidate.id === planet.value)?.name ?? planet.value}.`
      : 'Команда отклонена. Проверь ресурсы выбранной колонии.';
    if (accepted) bridge.refresh();
  });
  form.append(
    createField('Колония', planet),
    stocks,
    createField('Отдаём', give),
    createField('Получаем', receive),
    createField('Количество', amount),
    quote,
    feedback,
    submit,
  );
  updateQuote();

  const history = document.createElement('div');
  history.className = 'market-history';
  for (const trade of state.market.trades.slice(-10).reverse()) {
    const row = document.createElement('span');
    const tradePlanet = state.planets.find((candidate) => candidate.id === trade.planetId);
    row.textContent = `${tradePlanet?.name ?? trade.planetId}: ${formatNumber(trade.giveAmount)} ${RESOURCE_LABELS[trade.giveResourceId]} → ${formatNumber(trade.receiveAmount)} ${RESOURCE_LABELS[trade.receiveResourceId]}`;
    history.append(row);
  }
  if (history.childElementCount === 0) history.append('Сделок пока нет.');
  section.append(heading, reserves, form, history);
  host.replaceChildren(section);
}
