import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { quoteMarketSwap } from '../../src/simulation/market/market';
import { executeCommand } from '../../src/simulation/reducer';

describe('dynamic market', () => {
  it('quotes and executes a deterministic resource swap', () => {
    const state = createInitialGameState('market-swap');
    const planet = state.planets.find((candidate) => candidate.ownerEmpireId === 'player');
    expect(planet).toBeDefined();
    if (planet === undefined) return;

    const quote = quoteMarketSwap(state.market, 'metal', 'crystal', 500);
    expect(quote.accepted).toBe(true);
    expect(quote.receiveAmount).toBeGreaterThan(0);
    expect(quote.feeAmount).toBe(7);

    const result = executeCommand(state, {
      type: 'MARKET_SWAP',
      empireId: 'player',
      planetId: planet.id,
      giveResourceId: 'metal',
      receiveResourceId: 'crystal',
      giveAmount: 500,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const updated = result.value.planets.find((candidate) => candidate.id === planet.id)!;
    expect(updated.economy.resources.metal.amount).toBe(
      planet.economy.resources.metal.amount - 500,
    );
    expect(updated.economy.resources.crystal.amount).toBe(
      planet.economy.resources.crystal.amount + quote.receiveAmount,
    );
    expect(result.value.market.reserves.metal).toBe(state.market.reserves.metal + 500);
    expect(result.value.market.reserves.crystal).toBe(
      state.market.reserves.crystal - quote.receiveAmount,
    );
    expect(result.value.market.trades[0]).toMatchObject({
      id: 'trade-0',
      giveResourceId: 'metal',
      receiveResourceId: 'crystal',
      giveAmount: 500,
      receiveAmount: quote.receiveAmount,
    });
  });

  it('moves the quote after a trade in the same direction', () => {
    const state = createInitialGameState('market-price');
    const planet = state.planets.find((candidate) => candidate.ownerEmpireId === 'player')!;
    const before = quoteMarketSwap(state.market, 'metal', 'crystal', 500);
    const traded = executeCommand(state, {
      type: 'MARKET_SWAP',
      empireId: 'player',
      planetId: planet.id,
      giveResourceId: 'metal',
      receiveResourceId: 'crystal',
      giveAmount: 500,
    });
    expect(traded.ok).toBe(true);
    if (!traded.ok) return;
    const after = quoteMarketSwap(traded.value.market, 'metal', 'crystal', 500);
    expect(after.receiveAmount).toBeLessThan(before.receiveAmount);
  });

  it('rejects excessive price impact and invalid pairs', () => {
    const state = createInitialGameState('market-guard');
    expect(quoteMarketSwap(state.market, 'metal', 'metal', 500)).toMatchObject({
      accepted: false,
      rejectionCode: 'INVALID_PAIR',
    });
    expect(quoteMarketSwap(state.market, 'metal', 'crystal', 40_000)).toMatchObject({
      accepted: false,
      rejectionCode: 'PRICE_IMPACT_LIMIT',
    });
  });

  it('uses the normal resource and storage constraints', () => {
    const state = createInitialGameState('market-constraints');
    const planet = state.planets.find((candidate) => candidate.ownerEmpireId === 'player')!;
    expect(
      executeCommand(state, {
        type: 'MARKET_SWAP',
        empireId: 'player',
        planetId: planet.id,
        giveResourceId: 'gas',
        receiveResourceId: 'metal',
        giveAmount: planet.economy.resources.gas.amount + 1,
      }),
    ).toMatchObject({ ok: false, code: 'INSUFFICIENT_RESOURCES' });
  });
});
