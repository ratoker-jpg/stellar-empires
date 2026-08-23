# Audit batch history

This file is the compact historical index for completed roadmap audit batches. Generated closure squash SHAs may be recorded by the next Audit or by an explicitly permitted docs-only post-closure record because a closure PR cannot self-reference its future squash commit.

| Batch ID | Complexity | Audit PR | Implementation PRs | Outcome | Archived audit |
|---|---:|---:|---|---|---|
| `COMPLETE-ENDGAME-01` | medium | #152 | #153–#156 | completed | `docs/audits/completed/complete-endgame-01.md` |
| `COMPLETE-ENDGAME-02` | medium | #157 | #158–#161 | completed | `docs/audits/completed/complete-endgame-02.md` |
| `COMPLETE-ENDGAME-03` | medium | #162 | #163–#166 | completed; #166 squash recorded by M9 Audit | `docs/audits/completed/complete-endgame-03.md` |
| `M9-RELEASE-CANDIDATE` | medium | #167 | #168–#171 | completed; Release 1.0 closure #171 → `1f7298a602062837ec6bb8e3778d408ada26051c` | `docs/audits/completed/m9-release-candidate.md` |
| `POST-1.0-NEMEXIA-PARITY` | bounded-sequential | #173 | #174–#177 | completed; #177 closure → `53cf207f30f1a51f864d77f61969937e0d1ad59c` | `docs/audits/completed/post-1.0-nemexia-parity.md` |
| `POST-1.0-BOT-STRATEGY-DIFFERENTIATION` | bounded-sequential | #178 | #179–#181 | closure staged in #181 / complete upon controller-approved merge | `docs/audits/completed/post-1.0-bot-strategy-differentiation.md` |

## Current boundary

```text
POST-1.0-BOT-STRATEGY-DIFFERENTIATION → CLOSURE STAGED IN #181
Audit #178 → 4b96d457fad1577a0663210864381a0d3a33cb77
#179 → 7620975e1cd604c8bcdce0bac748e32e276061db
#180 → f0cfcb7d2944b8380cf8b3157ae1570bbbbb17cd
#181 → final implementation / closure PR; merge SHA unknown until merge
schema v19 / save v6 / migration none
active implementation PR → #181 closure only
further implementation authorized → false
PR4 → not authorized / does not exist
next valid action → controller review/merge decision for #181
next valid category after merge → fresh docs-only Audit from new main
```

Actual GitHub state is authoritative while #181 remains open. The batch is not GitHub-complete and no #181 squash SHA exists in this record yet.

## Recording rules

- Audit PR numbers and generated merge SHAs are immutable once recorded.
- A closure PR may record itself by PR number while deferring its generated squash SHA to the next Audit or an explicitly authorized docs-only post-closure record.
- Actual GitHub state is authoritative if a closure document is viewed before its PR has merged.
- Do not append a future implementation batch until its Audit has been accepted.
- For dependent implementation PRs, every successor branch must start from the latest merged `main`; controller approval/merge checkpoint therefore occurs before the dependent successor begins.
- Closing an audited batch does not itself authorize another implementation PR or feature batch.
