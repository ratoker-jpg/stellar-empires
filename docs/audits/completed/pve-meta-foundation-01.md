# Completed audit — PVE-META-FOUNDATION-01

**Status:** implementation complete pending PR #151 squash merge  
**Audit PR:** #147 · `50835aeb2864b96e026a7202ad419368e934e47b`  
**Complexity:** medium  
**Roadmap milestone:** M6b — bounded PvE meta foundation  
**Runtime baseline:** schema v17 / save format v4

## Accepted sequence

```text
#148 PVE-REPUTATION-FOUNDATION 430265b061764145e4e3ea1470d545f2ef82d0fa
→ #149 ARENA-PVE-CHALLENGES 42c484426e850b84263d4eecab63ebbb3eaafb05
→ #150 PVE-META-OPERATIONS-UX 39b85fe057d2cbf1fcff6b949a14bc62c7dbde63
→ #151 BOT-PVE-META-GATE — final validated head 016065dce161309899e0893bfa27c85bb2ba2e1c
```

Exactly four implementation PRs were authorized and delivered. No fifth implementation PR belongs to this batch.

## Delivered outcome

### Persistent reputation

- one non-purchasable PvE reputation score per empire;
- Recruit, Ranger, Vanguard and Warden tiers at 0/100/300/700;
- deterministic ordinary-PvE and Arena victory awards;
- atomic duplicate/zero-award protection;
- one controlled schema v17/save v4 migration from v16/v3.

### Local deterministic Arena

- exactly three public challenges per six-hour cycle;
- patrol, assault and elite difficulties;
- existing faction fleets, resources and combat resolver;
- one active entry per empire;
- owned idle stationed fleets only;
- persistent losses, survivors, costs and victory-only rewards;
- explicit withdrawal and bounded newest-64 history;
- direct/save continuation compatibility.

### Operations UX

- canonical `#/operations/arena` route inside the existing Operations family;
- reputation, tier, progress and exact award rules;
- current public challenges, cycle timing, enemy summaries, costs and rewards;
- eligible fleet selection and deterministic validation messages;
- active entry, withdrawal and result history;
- desktop/mobile/reload/history/reduced-motion Browser coverage.

### Honest bot parity and closure

- public challenge data and owned state only;
- planet-destruction capability gate;
- ordinary PvE and all higher scheduler priorities retained ahead of Arena;
- canonical `ENTER_ARENA_CHALLENGE` execution;
- 40% gas reserve;
- one Arena command maximum per decision;
- Aegis, Synod and Veyra legal-command evidence;
- hidden player state does not affect planning;
- exact complete-state equality after 48 campaign hours across direct, six-hour chunked, save/load and offline runtime partitions.

## Final code-head evidence

```text
Head           016065dce161309899e0893bfa27c85bb2ba2e1c
CI             30762140802 — success
Graphify       30762140796 — success
Browser E2E    30762140792 — code-head run; final documentation-head success required
1 campaign day     6.099 s < 15 s
7 campaign days   28.838 s < 30 s
```

## Permanent invariants

- schema v17/save v4 remains the batch baseline;
- no separate PvE currency or Admiral services;
- Arena remains local deterministic PvE, not multiplayer authority;
- player and bots use the same commands, costs, fleets and timing;
- bot planning uses public data plus owned state only;
- histories remain bounded;
- progression, Browser, Graphify and performance gates remain mandatory.

## Deferred work

- alliances and Solar War;
- functional Obelisks and Gates;
- deterministic victory/defeat;
- release onboarding, final balance and release hardening.

These items require a later accepted Audit PR. No implementation after #151 is authorized by this archive.

## Exact squash synchronization

The generated squash SHA for final PR #151 cannot be embedded in its own commit. The immediately following Audit PR must record the exact #151 squash SHA in this archive, `docs/project-status.json`, `docs/roadmap-pr-index.json` and batch history before authorizing any new implementation.
