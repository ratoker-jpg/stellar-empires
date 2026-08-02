# PR #150 — PVE-META-OPERATIONS-UX

**Status:** implementation active; merge requires final code+docs gates  
**Audit:** #147 `PVE-META-FOUNDATION-01`  
**Audit squash:** `50835aeb2864b96e026a7202ad419368e934e47b`  
**Baseline:** PR #149 squash `42c484426e850b84263d4eecab63ebbb3eaafb05`  
**Schema/save:** v17 / v4 retained

## Delivered scope

- canonical `#/operations/arena` route inside the existing Operations family;
- current PvE reputation score, derived tier and next-tier progress;
- exact ordinary-PvE and Arena reputation award explanations;
- one recent reputation ledger derived from existing mission/combat/Arena histories;
- three current public Arena challenges with cycle timing, difficulty, faction and enemy summary;
- exact existing-resource entry cost, duration, victory reward and reputation reward;
- eligible owned idle stationed fleets only;
- deterministic validation through the same Arena entry command contract;
- active-entry timing and withdrawal;
- completed Arena results with losses, rewards and reputation;
- existing six Operations modes retained through an unchanged legacy workspace boundary;
- responsive desktop/tablet/mobile layout and reduced-motion handling;
- browser route, reload, history and mobile viewport coverage.

## Architecture

`src/ui/arenaOperationsPanel.ts` owns the pure view model and DOM rendering for PvE meta. Challenge generation remains read-only and public. Entry validation performs a pure dry-run against `enterArenaChallenge`; only the ordinary command path mutates state.

`src/ui/operationsWorkspace.ts` is a thin router wrapper. The previous workspace implementation is retained unchanged in `src/ui/operationsWorkspaceLegacy.ts`, limiting regression risk to the new mode boundary.

## Code-head evidence

Validated code head before documentation closure:

```text
0e14f5058a872c2bc2d7c810b8c1eee1098d7924
```

```text
CI             30760083734 — success
Browser E2E    30760083727 — success
Graphify       30760083753 — success
1 campaign day   6.071 s < 15 s
7 campaign days 29.683 s < 30 s
```

The browser suite includes direct `#/operations/arena` navigation, reload, browser history, three challenge cards, reputation presentation, release mobile viewport and reduced-motion evidence.

## Explicit exclusions retained

- bot Arena planning and final 48-hour closure;
- schema/save changes;
- separate PvE currency or Admiral services;
- multiplayer/PvP, matchmaking, rankings or seasons;
- new mechanical catalogs;
- global economy or progression rebalance;
- alliances, Solar War, Obelisks, Gates or victory/defeat.

## Next authorized work

After #150 squash-merges and its exact merge SHA is recorded, only #151 `BOT-PVE-META-GATE` may start.
