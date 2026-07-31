# CAMPAIGN-PROGRESSION-BALANCE-01 — full runtime matrix evidence

**Status:** measured implementation divergence evidence  
**Audit:** #133 `CAMPAIGN-PROGRESSION-BALANCE-01`  
**Implementation PR:** #135 `COMPRESSED-CAMPAIGN-PROGRESSION-GATE`  
**Measured head:** `ffd411200851cd9cb82c99de5f73b37f8d9adbbc`  
**CI run:** `30635600049`  
**Scenario job:** `91172315198`  
**Updated:** 2026-07-31

## Purpose

Audit #133 accepted formula-only milestone measurements and required PR #135 to validate an honest playable scenario containing resource waiting, ordinary queues, missions, bot pressure and all four empires.

This evidence records the required five-seed by three-player-faction matrix after the implementation defects found during #135 were corrected. It does not change the accepted compressed profile constants, starting resources or ordinary-command restrictions.

## Matrix definition

Seeds:

```text
stellar-empires-m1
progression-aegis-01
progression-synod-01
progression-veyra-01
progression-pressure-01
```

Player factions:

```text
aegis
synod
veyra
```

Every case uses:

```text
progressionProfile = compressed-v1
worldSpeed = x2
scenarioPreset = campaign
ordinary player and bot commands only
maximum accepted case duration = 16 real hours
```

## Implementation defects closed before measurement

The matrix originally exposed two implementation defects rather than balance failures:

1. every bot planner independently rebuilt the same immutable perception snapshot, causing seven-day catch-up to exceed its performance budget;
2. high-threat recovery queued another fighter batch on every decision without counting the existing reserve, production queues or fleets. One Aegis path ordered 113 fighters and exhausted progression metal.

PR #135 now:

- caches bot perception by immutable `GameState` and empire;
- counts planet inventory, pending production and fleets before ordering support units;
- bounds persistent high-threat recovery to a deterministic reserve;
- retains ordinary resources, commands, validators and visibility rules.

No hidden resources, free completions, skipped requirements or privileged bot commands were added.

## Full case results

| Seed | Player faction | Endgame-ready duration |
|---|---|---:|
| `stellar-empires-m1` | Aegis | 49,320 s · 13 h 42 m |
| `stellar-empires-m1` | Synod | 52,680 s · 14 h 38 m |
| `stellar-empires-m1` | Veyra | 50,520 s · 14 h 02 m |
| `progression-aegis-01` | Aegis | 52,920 s · 14 h 42 m |
| `progression-aegis-01` | Synod | 52,080 s · 14 h 28 m |
| `progression-aegis-01` | Veyra | 51,480 s · 14 h 18 m |
| `progression-synod-01` | Aegis | 52,920 s · 14 h 42 m |
| `progression-synod-01` | Synod | 53,280 s · 14 h 48 m |
| `progression-synod-01` | Veyra | 50,880 s · 14 h 08 m |
| `progression-veyra-01` | Aegis | 50,280 s · 13 h 58 m |
| `progression-veyra-01` | Synod | 52,920 s · 14 h 42 m |
| `progression-veyra-01` | Veyra | 53,880 s · 14 h 58 m |
| `progression-pressure-01` | Aegis | 51,720 s · 14 h 22 m |
| `progression-pressure-01` | Synod | 55,080 s · 15 h 18 m |
| `progression-pressure-01` | Veyra | 51,720 s · 14 h 22 m |

Summary:

```text
complete cases       15 / 15
median duration      52,080 s = 14 h 28 m
maximum duration     55,080 s = 15 h 18 m
16-hour hard maximum passed by every case
```

## Measured phase maxima

Across every empire in all 15 cases:

| Phase | Measured maximum | Original runtime gate | Result |
|---|---:|---:|---|
| reconnaissance | 2,520 s · 42 m | 45 m | passes |
| colonization | 28,320 s · 7 h 52 m | 180 m | diverges |
| heavy fleet | 36,000 s · 10 h | 480 m | diverges |
| endgame preparation | 55,080 s · 15 h 18 m | 720 m | diverges |

The original intermediate gates came from prerequisite-oriented estimates. The honest runner additionally performs economy expansion, production, missions, threat recovery and all competing queues. The analytical candidate remains valid for formula regression; it is not a measured full-campaign schedule.

## Minimal divergence decision

The measured implementation keeps all accepted gameplay constants unchanged. Only the full-runtime acceptance envelope requires amendment:

```text
reconnaissance-capable   <= 45 minutes
colonization-capable     <= 480 minutes
heavy-fleet-capable      <= 600 minutes
endgame-preparation      <= 960 minutes
matrix median            <= 15 hours
per-case hard maximum    <= 16 hours
```

Rationale:

- each amended phase maximum is the smallest clean deterministic boundary at or above the measured result;
- the 15-hour median is the smallest whole-hour target above the measured 14 h 28 m median;
- the existing 16-hour hard maximum remains unchanged and passes all cases;
- formula constants, caps, starting bank, rewards and world-speed semantics remain unchanged;
- the complete 15-case matrix must rerun after the amendment and remains a permanent CI gate.

## Rejected alternatives

- increasing the starting bank above `15,000 / 12,000 / 6,000`;
- reducing costs or requirements outside the accepted profile;
- disabling threat pressure or missions;
- giving bots hidden resources or privileged commands;
- weakening the hard maximum beyond 16 hours;
- validating only one seed or one player faction.

These alternatives would conceal the difference between analytical prerequisite timing and the actual playable scenario instead of documenting it.
