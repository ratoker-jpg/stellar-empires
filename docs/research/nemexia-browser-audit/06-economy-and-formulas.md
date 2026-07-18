# 06 — Economy and formulas

Observed values are a single sample, not a formula: `(metal, minerals, gas) = (350, 250, 100)` per hour at unknown building levels. No upgrades were started and no timers were measured.

| Candidate relationship | Status | Evidence needed |
| --- | --- | --- |
| Building level → hourly output | UNKNOWN | two or more read-only level observations |
| Building level → cost/time | UNKNOWN | visible requirement cards |
| Ozone/potential modifies economy | UNKNOWN | explanatory panel or controlled observation |

Any future formula must retain the raw observations, levels, timestamp, server, source URL, and account-progress context in `data/resources.json`. Values must use named fields (`metal`, `minerals`, `gas`, `population`, `time_seconds`) rather than an unexplained display order.
