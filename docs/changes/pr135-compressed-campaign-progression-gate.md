# PR #135 — COMPRESSED-CAMPAIGN-PROGRESSION-GATE

**Batch:** `CAMPAIGN-PROGRESSION-BALANCE-01`  
**Audit:** #133  
**Predecessor:** #134 `PROGRESSION-PROFILE-FOUNDATION`  
**State schema:** v16 retained  
**Save format:** v3 retained  
**Progression profile:** `compressed-v1` for new campaigns; `legacy-v1` compatibility preserved

## Delivered

### Compressed starting economy

New `compressed-v1` campaigns use the accepted deterministic starting economy:

```text
metal   15,000
crystal 12,000
gas      6,000
storage capacity 60,000 per resource
population capacity 25
```

Profile-resolved economy consumers apply the accepted production, storage and reward multipliers. Existing `legacy-v1` saves, replays and queued values retain legacy behavior.

### Resource and reward consistency

The compressed profile is resolved consistently across:

- passive planet production;
- storage contributions;
- mission resource rewards;
- expedition rewards;
- space-object rewards;
- neutral-force rewards;
- specialization and player-facing economy views.

World speed remains time-only. It does not multiply stocks, production rates or rewards.

### Deterministic progression phases

Player and bot progression use the same capability definitions:

```text
foundation
reconnaissance
first-combat
colonization
heavy-fleet
planet-destruction
endgame-preparation
```

Bots use ordinary building, research, production, market, fleet and expedition commands. Phase-aware priorities alter planning order only; no requirement, resource or visibility bypass exists.

### Honest bot planning fixes

The full scenario exposed and closed implementation defects that were hidden by formula-only measurements:

- immutable bot perception is cached per state and empire so domain planners do not rebuild the same snapshot repeatedly;
- production targets count planet inventory, queued batches and fleet inventory;
- persistent high-threat recovery maintains a bounded reserve instead of ordering an unlimited fighter stream;
- the bounded reserve covers six fighters, four light defenses and two frigates per empire;
- scheduler domain plans are computed once per decision and reused by threat recovery;
- ordinary scout expeditions use visible stationed fleets and public route duration/fuel information only.

No outcome peeking, hidden reward selection or privileged command was introduced.

### Deterministic matrix gate

The permanent CI scenario executes:

```text
5 accepted seeds
× 3 player factions
= 15 complete campaign cases
```

Every case includes four empires, resource waiting, queues, missions, expeditions, threat recovery and ordinary commands. The gate records median, maximum and per-phase results before asserting the amended measured envelope.

Measured matrix evidence:

`docs/audits/evidence/campaign-progression-balance-01-runtime-matrix.md`

### Runtime-envelope amendment

The analytical direct-prerequisite measurements remain valid formula regression tests. The complete playable scenario measured a wider envelope:

```text
15 / 15 cases complete
median 14 h 28 m
maximum 15 h 18 m
```

The contract was amended only for full-runtime acceptance:

```text
reconnaissance <= 45 m
colonization   <= 480 m
heavy fleet    <= 600 m
endgame        <= 960 m
matrix median  <= 15 h
hard maximum   <= 16 h
```

The original 12-hour value remains an optimization goal. Formula constants, caps, starting stocks, reward multipliers and the 16-hour hard maximum remain unchanged.

### Determinism and compatibility

Coverage verifies:

- schema-v16 migration and structural repair;
- exact legacy profile behavior;
- three-faction semantic parity;
- x1/x2/x5/x10 time scaling;
- direct, partitioned and save-loaded progression equivalence;
- active/offline campaign-time equivalence;
- queued-item cost and completion timestamp preservation;
- checksum-safe persistence.

### Browser closure

Browser E2E covers the real New Game picker, immutable compressed profile identity, campaign values, save/reload behavior, catch-up presentation and both release viewports.

## Explicit exclusions

This PR does not implement:

- alliances or diplomacy;
- Solar War;
- functional Obelisks or Supreme Gates;
- Solar Crystals;
- victory or defeat;
- server authority or multiplayer;
- runtime profile or speed switching.

## Final evidence

Final head and workflow run IDs are recorded after the final documentation head passes CI, Browser E2E and Graphify. The exact squash merge SHA is synchronized into `main` after PR #135 merges.

## Ordered next work

PR #135 closes the two-implementation-PR batch authorized by Audit #133. Documentation continuity PR #136 is outside implementation counts.

After #135 merges and exact status synchronization, the only authorized next action is Audit #137 from fresh `main`. No third progression implementation PR is authorized.
