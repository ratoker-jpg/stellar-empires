# Current execution state

**Updated:** 2026-08-21  
**Safe to continue:** controller review / merge decision only  
**Phase:** `POST-1.0-PR2-COMBAT-IDENTITY-DOCTRINE` final handoff  
**Runtime:** schema v19 / save format v6 unchanged  
**Migration:** none  
**Release:** 1.0.0 closed

| Field | Current value |
|---|---|
| Accepted Audit authority | #173 `POST-1.0-NEMEXIA-PARITY-AUDIT` — merged |
| Accepted predecessor | #174 `POST-1.0-PR1-ORGANIC-LATE-GAME-CLOSURE` — merged |
| Exact PR2 starting `main` | `200456244d3a7efcbb197f7734a97adf622fad76` |
| Active implementation PR | #175 `POST-1.0-PR2-COMBAT-IDENTITY-DOCTRINE` |
| Implementation branch | `agent/post-1.0-combat-identity-doctrine` |
| PR2 state | implementation + evidence complete / final controller review |
| Organic Fresh Game → Terminal | remains green |
| Save/load combat replay | proven |
| Defender permutation stability | proven |
| Target state schema | 19 — unchanged |
| Target save format | 6 — unchanged |
| Migration | none |
| PR3 / PR4 | not started |

## PR2 final verdict

`POST-1.0-PR2-COMBAT-IDENTITY-DOCTRINE` is implementation- and evidence-complete for controller review under the merged Audit #173 authority and after merged predecessor #174.

The work is intentionally bounded to the two accepted combat determinism defects. No combat redesign, balance expansion, bot work, PR3 or PR4 work was added.

## Fixed findings

### A. Attacker identity contribution collision

Before PR2 the attack seed used:

```text
state.seed ^ eventSequence ^ attackerFleet.id.length
```

Different stable fleet IDs with the same string length therefore contributed the same attacker-identity value to the battle seed.

### B. Deterministic full stable fleet-ID contribution

PR2 replaces the length-only contribution with a deterministic FNV-1a-style unsigned 32-bit contribution derived from the full stable attacker fleet ID.

The implementation is deterministic and local to the combat boundary:

- no `Math.random()`;
- no timestamp/process-dependent hash;
- no array-index identity;
- no persisted battle-seed field;
- no schema or save-format change.

### C. Defender doctrine depended on `state.fleets` order

Multi-fleet defense already pooled all eligible defender units, but doctrine metadata came from:

```text
defenderFleets[0]
```

That meant array order could change combat semantics even when the same eligible defender fleets were present.

### D. Stable primary defender rule

PR2 now selects exactly one primary defender as:

```text
lexicographically smallest eligible defender fleet.id
```

The selection is deterministic and independent of `state.fleets` ordering.

### E. One primary owns all defender doctrine identity

The same selected primary defender determines:

- formation;
- target priority;
- commander;
- defender command-combat fleet identity.

This removes mixed identity/doctrine selection and makes the doctrine source explicit and stable.

### F. Pooled units and casualty redistribution unchanged

PR2 intentionally preserves the existing pooled-defense model:

- all eligible defender ship units are still pooled into combat;
- planetary defenses remain part of the same defender unit set;
- `redistributeDefenderShips()` was not changed;
- casualty redistribution semantics were not redesigned.

The defender permutation regression proves that the same defender set produces the same authoritative BattleReport regardless of the eligible fleet-array permutation used by the regression.

## Regression-first evidence

### Equal-length attacker fleet IDs

The test-only red regression used two different equal-length IDs:

```text
attack-id-a
attack-id-b
```

On the pre-fix runtime both resolved to the same battle seed contribution path and produced the same report seed (`2831578435` in the red CI evidence), proving the length-only collision.

After the fix the regression is green: identical IDs replay identically while selected different equal-length IDs contribute different deterministic values.

### Deterministic hash vectors

Golden vectors lock the chosen full-ID contribution behavior:

```text
attack-id-a → 2303295411
attack-id-b → 2320073030
```

These vectors protect deterministic cross-run behavior from accidental implementation drift.

### Defender permutation regression

The regression executes the same eligible defender set in both orders:

```text
[defender-b, defender-a]
[defender-a, defender-b]
```

Before the fix, `[defender-b, defender-a]` selected `screen` from array position zero instead of canonical `defender-a` doctrine.

After the fix both permutations use the lexicographically smallest primary defender and produce the same BattleReport, including stable:

- `wedge` formation;
- `capitals` target priority;
- `commander.shared.executor` commander identity;
- winner / rounds / remaining units;
- debris, plunder, demolition and destruction report content.

### Real save/load combat replay

PR2 includes a bounded persistence regression through the real save pipeline:

```text
createSaveEnvelope
→ serializeSave
→ parseSaveJson
→ resolveAttackMission
```

The post-load combat resolution matches the direct resolution. No new persisted combat state is required.

## Organic campaign regression status

The accepted organic Fresh Game → Terminal path from PR1 remains green with the PR2 combat seed/doctrine correction applied.

The PR2 exact-head validation also preserves the existing terminal determinism and bounded faction matrix gates. PR2 does not reopen PR1 progression/content work.

## Schema / save impact

- state schema: **v19**, unchanged;
- save format: **v6**, unchanged;
- migration: **none**.

## Graphify / dependency boundary

Graphify confirms `resolveAttackMission()` remains the bounded combat integration hub reached from fleet event execution and connected to battle resolution, commander/command effects, debris/plunder, demolition/destruction and destroyed-planet reconciliation.

The accepted fixes therefore stay inside the existing combat boundary. No new combat subsystem or cross-domain architecture was introduced.

## Intentional omissions

PR2 intentionally does **not** include:

- PR1 economy, Obelisk, storage or organic-progression changes;
- a combat-system redesign;
- casualty redistribution redesign;
- fleet pooling redesign;
- combat balance tuning;
- bot behavior changes;
- PR3 advertised-effect truth work;
- PR4 tooling-quality work;
- schema changes;
- save-format changes;
- migration work.

PR3 and PR4 are **not started**.

## Material divergence

None discovered for the accepted PR2 scope.

The regression-first work exposed exactly the two Audit-authorized defects and the bounded implementation resolved them without requiring redistribution, persistence, architecture or balance expansion.

## Control-plane validation

Runtime/content review has passed. The implementation head before this final handoff docs update (`ce5d5a2ebdbf3f9d234da9ff33db78399540bc04`) had controller-confirmed green:

- CI #2125;
- Graphify #1276;
- Browser E2E #1355;
- organic Fresh Game → Terminal;
- terminal determinism;
- bounded faction matrix;
- zero unresolved review threads;
- `mergeable=true`.

Because this final handoff changes the PR head, the new docs-only exact head must receive fresh CI, Graphify and Browser E2E before PR #175 is marked Ready for review.

## Controller handoff

PR #175 is the only active implementation PR for this handoff. Runtime/content has passed; only final control-plane settlement remains.

When the final docs-only exact head has green CI, Graphify and Browser E2E, preserves the organic terminal gates, has zero unresolved review threads and remains mergeable, mark PR #175 **Ready for review** and stop for controller review / merge decision.

Do **not** merge autonomously. Do **not** create PR3 or PR4.
