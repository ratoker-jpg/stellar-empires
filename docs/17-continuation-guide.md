# AI Continuation Guide

**Status:** Audit #116 batch completed through PR #120  
**Updated:** 2026-07-27  
**Active implementation batch:** none  
**Next repository action:** new Audit PR only

## Repository

`ratoker-jpg/stellar-empires` · default branch `main` · GitHub Pages deployment.

GitHub history and current `main` override stale prose, prior chat memory and abandoned branches.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/audits/completed/ordinary-missions-intelligence-01.md`
6. `docs/project-status.json`
7. `docs/roadmap-pr-index.json`
8. `docs/27-playable-game-roadmap-v5.md`
9. latest merged pull requests and actual `main`

## Completed product state

- #101–#105: complete catalog runtime art;
- #106–#110: schema-v14 Universe navigation and action gate;
- #111–#115: coherent routed application shell and browser/accessibility gate;
- #116–#120: shared ordinary mission rules, deterministic espionage/counter-intelligence, routed redacted reports and honest bot parity gate.

## Audit #116 result

The six ordinary missions share one reducer/UI/bot availability contract. Flight slots, scout composition, deterministic intelligence tiers, cooldown, detection, probe survival, reports, incoming visibility and bot decision boundaries are complete without a schema change. Bots can scout unknown or stale targets and attack only after their own current level-three observation. The combined sequence passes save/load, unit and Browser E2E gates.

## Invariants

- schema remains v14;
- reducer remains authoritative;
- no hidden bot state or bot-only command;
- route/report presentation remains derived;
- no hidden foreign owner, fleet or cargo leakage;
- every implementation batch requires an accepted audit first.

## Immediate route

Create a new Audit PR from exact post-#120 `main`. Do not create implementation PR #121 until that audit is accepted.
