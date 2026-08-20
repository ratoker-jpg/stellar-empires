# Execution Roadmap Stellar Empires — current entrypoint

**Status:** Release 1.0 closed; post-1.0 implementation not yet authorized  
**Updated:** 2026-08-20  
**Verified release main:** `1f7298a602062837ec6bb8e3778d408ada26051c`  
**Last merged release PR:** #171 `RELEASE-1.0-CLOSURE`  
**Runtime:** schema v19 / save format v6

## Authoritative files

```text
AGENTS.md
docs/28-audit-first-autonomous-delivery-protocol.md
docs/audits/current-execution-state.md
docs/audits/current-batch-audit.md
docs/project-status.json
docs/roadmap-pr-index.json
docs/29-post-1.0-nemexia-reference-roadmap.md
docs/27-playable-game-roadmap-v5.md   # historical Release 1.0 roadmap
```

Actual GitHub state wins over stale prose.

## Release 1.0 boundary

M1–M9 are complete. PR #171 closed the accepted M9 release-candidate batch and generated fresh `main`:

`1f7298a602062837ec6bb8e3778d408ada26051c`

The Release 1.0 runtime remains schema v19 / save format v6. No fifth M9 implementation PR is authorized.

## Post-1.0 entrypoint

The owner has supplied `ratoker-jpg/Nemexia_auto_v2` and a structured Nemexia research snapshot as reference sources for future Stellar improvements.

They are not implementation contracts. The next product action must be a separate docs-only Audit:

`POST-1.0-NEMEXIA-PARITY-AUDIT`

That Audit must compare the current Stellar implementation with the reference evidence, preserve provenance, classify candidates as `KEEP_STELLAR`, `ADAPT_FROM_NEMEXIA`, `RESEARCH` or `REJECT`, and propose the first bounded implementation batch.

## Delivery model

```text
Audit PR (docs only)
→ controller review
→ Audit merge only after approval
→ 4 implementation PRs by default
   or max 6 only for explicitly justified light/independent work
→ batch report
→ controller MERGE / FIX / STOP-RE-AUDIT decision
```

Implementation is not authorized before the Audit is accepted.

## Permanent boundaries

- do not directly port browser automation, Tkinter, DOM selectors, CAPTCHA or raid/farm tooling from Nemexia;
- do not promote user memory, heuristics or hypotheses into game formulas;
- keep Stellar-native architecture and deterministic/save/performance/browser gates;
- any unplanned schema/save migration or guessed combat/economy formula requires re-audit;
- every dependent branch starts from the latest merged `main`.

## Next action

After this docs-only control-plane update merges, start exactly one new docs-only `POST-1.0-NEMEXIA-PARITY-AUDIT` from fresh `main`. Do not implement product changes in that Audit PR.
