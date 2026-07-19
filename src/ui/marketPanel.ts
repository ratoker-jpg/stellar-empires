import type { ResourceId } from '../simulation/economy/types';
import { quoteMarketSwap } from '../simulation/market/market';
import type { GameCommand, GameState } from '../simulation/types';

export interface MarketPanelBridge {
  readonly getState: () => GameState;
  readonly getActivePlanetId: () => string;
  readonly execute: (command: GameCommand, successMessage: string) => boolean;
}

const RESOURCE_LABELS: Readonly<Record<ResourceId, string>> = {
  metal: 'Металл',
  crystal: 'Минералы',
  gas: 'Газ',
};

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

export function mountMarketPanel(bridge: MarketPanelBridge): void {
  const host = document.querySelector<HTMLElement>('.command-panel');
  if (host === null) return;
  const section = document.createElement('section');
  section.className = 'panel-block market-panel';
  host.append(section);

  const render = (): void => {
    const state = bridge.getState();
    const eyebrow = document.createElement('p');
    eyebrow.className = 'panel-label';
    eyebrow.textContent = 'Торговый центр';
    const heading = document.createElement('h2');
    heading.textContent = 'Динамический рынок';
    const reserves = document.createElement('div');
    reserves.className = 'market-reserves';
    for (const resourceId of ['metal', 'crystal', 'gas'] as const) {
      const item = document.createElement('span');
      item.textContent = `${RESOURCE_LABELS[resourceId]} ${state.market.reserves[resourceId]}`;
      reserves.append(item);
    }

    const form = document.createElement('form');
    form.className = 'market-form';
    const give = createResourceSelect('metal');
    const receive = createResourceSelect('crystal');
    const amount = document.createElement('input');
    amount.type = 'number';
    amount.min = '1';
    amount.value = '500';
    amount.setAttribute('aria-label', 'Количество продаваемого ресурса');
    const quote = document.createElement('output');
    quote.className = 'market-quote';
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.textContent = 'Обменять';

    const updateQuote = (): void => {
      const result = quoteMarketSwap(
        state.market,
        give.value as ResourceId,
        receive.value as ResourceId,
        Number(amount.value),
      );
      quote.textContent = result.accepted
        ? `Получишь ${result.receiveAmount} · комиссия ${result.feeAmount} · влияние ${(result.priceImpactPermille / 10).toFixed(1)}%`
        : `Сделка недоступна · ${result.rejectionCode ?? 'ошибка'}`;
      submit.disabled = !result.accepted;
    };
    give.addEventListener('change', updateQuote);
    receive.addEventListener('change', updateQuote);
    amount.addEventListener('input', updateQuote);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const result = quoteMarketSwap(
        bridge.getState().market,
        give.value as ResourceId,
        receive.value as ResourceId,
        Number(amount.value),
      );
      if (!result.accepted) return;
      const executed = bridge.execute(
        {
          type: 'MARKET_SWAP',
          empireId: 'player',
          planetId: bridge.getActivePlanetId(),
          giveResourceId: give.value as ResourceId,
          receiveResourceId: receive.value as ResourceId,
          giveAmount: Number(amount.value),
        },
        `Рынок · получено ${result.receiveAmount} ${RESOURCE_LABELS[receive.value as ResourceId]}`,
      );
      if (executed) render();
    });
    form.append(give, receive, amount, quote, submit);
    updateQuote();

    const history = document.createElement('div');
    history.className = 'market-history';
    for (const trade of state.market.trades.slice(-3).reverse()) {
      const row = document.createElement('span');
      row.textContent = `${trade.giveAmount} ${RESOURCE_LABELS[trade.giveResourceId]} → ${trade.receiveAmount} ${RESOURCE_LABELS[trade.receiveResourceId]}`;
      history.append(row);
    }
    if (state.market.trades.length === 0) {
      const empty = document.createElement('span');
      empty.textContent = 'Сделок пока нет';
      history.append(empty);
    }

    section.replaceChildren(eyebrow, heading, reserves, form, history);
  };

  render();
}
