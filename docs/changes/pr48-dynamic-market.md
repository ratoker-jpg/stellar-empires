# PR #48 — Dynamic resource market

## Delivered

- Shared deterministic liquidity pool for metal, minerals and gas.
- Constant-product swap quotes with a visible fee and price impact.
- Market reserves change after every completed trade, so repeated trades move the price.
- Maximum price-impact protection, resource affordability checks and destination storage checks.
- The player and future bots use the same `MARKET_SWAP` command and constraints.
- Market panel with current reserves, live quote and recent trade history.
- Save schema v12 with migration from v1–v11.

## Intentional limitations

- The market currently supports immediate swaps rather than persistent limit orders.
- Fees remain inside the market pool; there is no external treasury yet.
- Bot participation is added by the following planner PRs.
