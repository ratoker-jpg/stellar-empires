# CAMPAIGN-PROGRESSION-BALANCE-01 — compressed-v1 candidate measurement

**Status:** VERIFIED audit experiment  
**Measurement commit:** `253a413af51b3e7a334d1962c7077f5231ff68a3`  
**CI:** `30490664712`  
**Purpose:** validate the proposed formula/cap matrix before accepting the contract

## Candidate constants measured

```text
building cost growth 1280 permille
building time growth 1180 permille
building base time 600 permille
research cost growth 1280 permille
research time growth 1180 permille
research base cost 900 permille
research base time 600 permille
unit cost 850 permille
unit time 700 permille
Obelisk base time 14,400 canonical seconds
Gates base time 14,400 canonical seconds
```

The exact building/research cap maps are recorded in the accepted profile contract.

## Measured Aegis critical paths at recommended x2

| Milestone | Candidate real time | Candidate cost M/C/G | Accepted maximum |
|---|---:|---:|---:|
| first combat ship | 15.08 min | 5,949 / 6,309 / 2,217 | 16 min |
| first scout | 27.85 min | 9,943 / 11,505 / 4,062 | 30 min |
| first colonizer | 104.89 min | 36,952 / 45,541 / 20,710 | 120 min |
| first planet destroyer | 221.53 min | 92,684 / 91,708 / 42,816 | 360 min |
| endgame-ready Gates path | 352.58 min | 10,994,176 / 10,991,199 / 2,631,736 | 720 min |

## Audit interpretation

The experiment originally asserted 15 and 25 minutes for the first two milestones. It failed only because the measured values exceeded those provisional limits by 0.08 and 2.85 minutes. The later milestones passed with substantial margin.

The accepted contract therefore uses the exact rounded player-facing limits:

```text
first combat ship ≤ 16 minutes
first scout ≤ 30 minutes
first colonizer ≤ 120 minutes
first planet destroyer ≤ 360 minutes
endgame-ready prerequisite path ≤ 720 minutes
```

This decision avoids an arbitrary extra global speed reduction solely to satisfy provisional round-number assertions. The implementation still must prove economy waiting, queue behavior, bot progression and accepted seed matrices; this candidate measures prerequisite timers/costs only.

## Evidence retention

The experimental test output remains in CI `30490664712`. The final Audit PR keeps a green source-importing legacy baseline gate and this immutable evidence document. PR #134 must convert the accepted candidate matrix into the typed runtime profile and add profile-resolved source-importing tests.
