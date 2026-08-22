# Audit batch history

This file is the compact historical index for completed roadmap audit batches. Generated closure squash SHAs may be recorded by the next Audit or by an explicitly permitted docs-only post-closure record because a closure PR cannot self-reference its future squash commit.

| Batch ID | Complexity | Audit PR | Implementation PRs | Outcome | Archived audit |
|---|---:|---:|---|---|---|
| `COMPLETE-ENDGAME-01` | medium | #152 | #153–#156 | completed | `docs/audits/completed/complete-endgame-01.md` |
| `COMPLETE-ENDGAME-02` | medium | #157 | #158–#161 | completed | `docs/audits/completed/complete-endgame-02.md` |
| `COMPLETE-ENDGAME-03` | medium | #162 | #163–#166 | completed; #166 squash recorded by M9 Audit | `docs/audits/completed/complete-endgame-03.md` |
| `M9-RELEASE-CANDIDATE` | medium | #167 | #168–#171 | completed; Release 1.0 closure #171 → `1f7298a602062837ec6bb8e3778d408ada26051c` | `docs/audits/completed/m9-release-candidate.md` |
| `POST-1.0-NEMEXIA-PARITY` | bounded-sequential | #173 | #174–#177 | implementation complete in #177; closure pending controller merge; generated #177 squash deferred | `docs/audits/completed/post-1.0-nemexia-parity.md` |

## Current boundary

```text
POST-1.0-NEMEXIA-PARITY
Audit #173 → 817a014ef958be4c54f2bd5b54a68890f358d53a
#174 → 200456244d3a7efcbb197f7734a97adf622fad76
#175 → 415a3aa814d759d1f76a986003ad7e9d06e0e8fa
#176 → c2012c76397c0a56bce85c470334850f7be4bd3e
#177 → active final implementation / batch closure; generated squash pending controller review/merge
schema v19 / save v6 / migration none
next valid action → controller review/merge #177, then controller batch-closure / roadmap decision
PR5 / new feature implementation → not authorized
```

PR #177 is allowed to record its own batch/closure PR number while deferring the generated squash SHA that cannot exist until after merge. Actual GitHub state remains authoritative if this record is read before the controller merges #177.

## Recording rules

- Audit PR numbers and generated merge SHAs are immutable once recorded.
- A closure PR may record itself by PR number while deferring its generated squash SHA to the next Audit or an explicitly authorized docs-only post-closure record.
- Actual GitHub state is authoritative if a closure document is viewed before its PR has merged.
- Do not append a future implementation batch until its Audit has been accepted.
- For dependent implementation PRs, every successor branch must start from the latest merged `main`; controller approval/merge checkpoint therefore occurs before the dependent successor begins.
- Closing an audited batch does not itself authorize PR5 or another feature batch.