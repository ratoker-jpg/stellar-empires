# CAMPAIGN-PROGRESSION-BALANCE-01 — authorized implementation sequence

**Status:** proposed for acceptance in Audit PR #133  
**Complexity:** heavy  
**Authorized implementation PRs:** exactly 2  
**Expected numbers:** #134–#135

No implementation may start before Audit PR #133 merges.

## PR #134 — PROGRESSION-PROFILE-FOUNDATION

### Goal

Introduce deterministic versioned progression identity and make every current progression consumer resolve values through that identity without yet claiming final campaign balance closure.

### Required delivery

- schema v16 `CampaignSettings.progressionProfile`;
- `legacy-v1 | compressed-v1` validation and formatting;
- schema v1–v15 migration to `legacy-v1`;
- new normal campaign default `compressed-v1`;
- explicit replay/profile inputs and checksum coverage;
- central typed progression-profile registry containing all accepted constants;
- profile-aware building/research/unit/defence/repair/upgrade definitions and calculations;
- profile-aware requirement and cap resolution;
- profile identity in New Game, System and save summaries;
- old queued items preserve stored cost/target/completion time;
- no runtime profile switching;
- source-importing formula/parity/migration tests;
- documentation/change record.

### Boundaries

This PR may deliver the accepted profile values because they are inseparable from the dual-profile architecture, but it does not close economy/reward/bot/full-duration balance. It must not implement alliances, Solar War, Gates operation or victory.

### Merge gates

- all schema/save/replay migrations green;
- legacy-v1 reproduces PR #132 formula/catalog outputs;
- compressed-v1 resolves all three factions with no requirement above cap;
- CI, Browser E2E, Graphify and review green.

## PR #135 — COMPRESSED-CAMPAIGN-PROGRESSION-GATE

### Goal

Complete the accepted compressed profile across economy, rewards, bots and measured progression, then prove the endgame-ready campaign envelope.

### Required delivery

- compressed starting stocks, capacity and population;
- production/storage/reward multipliers from the accepted profile;
- mission/expedition/space-object reward consumers updated consistently;
- deterministic bot progression phases and ordinary-command priorities;
- repair/upgrade/Commander compatibility where applicable;
- player UI resolved values and duration expectations;
- deterministic milestone runner for player and all bots;
- accepted seed matrix for x2 target/hard maximum;
- exact x1/x2/x5/x10 scaling equivalence;
- active/offline/save-load partition equivalence;
- release-viewport Browser E2E;
- final change record and batch archive.

### Accepted seed matrix

At minimum:

```text
stellar-empires-m1
progression-aegis-01
progression-synod-01
progression-veyra-01
progression-pressure-01
```

Each seed runs with every player faction at recommended x2. The test harness may use deterministic policy drivers, but they must issue ordinary player/bot commands and must not grant hidden resources or skip requirements.

### Closure criteria

- every player critical-path milestone passes its maximum;
- every bot phase passes its maximum;
- median accepted seed reaches endgame-ready progression state within 12 x2 real-hour equivalents;
- every accepted seed remains ≤16 x2 hours;
- no legacy-v1 checksum/replay regression;
- no elapsed time or failed command is silently skipped;
- all CI, Browser E2E, Graphify and review gates green.

## Divergence rule

If implementation evidence proves an accepted numeric constant creates a deterministic deadlock or makes a hard gate impossible, the implementation PR must:

1. record the failing seed and measurement;
2. amend the contract file explicitly;
3. explain the smallest numeric change;
4. rerun the full seed/profile matrix;
5. obtain green automated review before merge.

Unrecorded tuning drift is prohibited.

## After #135

After exact-SHA synchronization, the next work must be selected by a fresh audit. Likely candidates are multi-colony economy/logistics coherence or the deferred alliance/endgame runtime; neither is authorized by this batch.
