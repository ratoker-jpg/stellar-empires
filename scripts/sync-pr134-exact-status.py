import json
from pathlib import Path

MERGE_SHA = 'aa87e764ef40444660039dc8d6a96d7f5514cc23'
HEAD_SHA = '0c5b6940ee25ca28de4ac4d194535f77b0ba332a'
CI_RUN = '30553697886'
BROWSER_RUN = '30553697703'
GRAPHIFY_RUN = '30553697767'


def replace(path: str, old: str, new: str, expected: int = 1) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    count = text.count(old)
    if count != expected:
        raise RuntimeError(f'{path}: expected {expected} matches, found {count}: {old!r}')
    file.write_text(text.replace(old, new), encoding='utf-8')


Path('docs/audits/current-execution-state.md').write_text(f'''# Current execution state

**Updated:** 2026-07-30  
**Safe to continue:** accepted final implementation only

| Field | Current value |
|---|---|
| Last merged PR | #134 `PROGRESSION-PROFILE-FOUNDATION` · `{MERGE_SHA}` |
| Runtime baseline | schema v16 / save format v3 · immutable `legacy-v1 | compressed-v1` progression identity |
| Accepted target | compressed economy, rewards, bot phases and measured campaign closure |
| Active implementation | none |
| Exact next PR | #135 `COMPRESSED-CAMPAIGN-PROGRESSION-GATE` |
| Final batch PR | #135 `COMPRESSED-CAMPAIGN-PROGRESSION-GATE` |

## Accepted sequence

```text
#133 CAMPAIGN-PROGRESSION-BALANCE-01 — merged Audit
→ #134 PROGRESSION-PROFILE-FOUNDATION — merged
→ #135 COMPRESSED-CAMPAIGN-PROGRESSION-GATE — next
```

## Accepted contract

- schema v1–v15 campaigns migrate to `legacy-v1`;
- new campaigns default to `compressed-v1`;
- profile identity is immutable, checksummed and explicit in replay inputs;
- profile-aware caps, requirements, costs and times are centralized;
- already queued cost and completion timestamps remain unchanged;
- save format remains v3;
- recommended x2 endgame-ready target is 12 real hours, hard maximum 16;
- player milestone maxima are 16 / 30 / 120 / 360 / 720 minutes;
- actual alliance/Gate victory remains deferred;
- bots retain ordinary commands and receive only deterministic phase priorities.

Authoritative files:

- `docs/audits/current-batch-audit.md`;
- `docs/audits/contracts/campaign-progression-balance-01-profile.md`;
- `docs/audits/contracts/campaign-progression-balance-01-prs.md`.

## PR #134 final evidence

```text
head {HEAD_SHA}
CI {CI_RUN} — passed
Browser E2E {BROWSER_RUN} — passed
Graphify {GRAPHIFY_RUN} — passed
review threads — none
Codex review request — no automated response returned; self-review completed
squash merge {MERGE_SHA}
```

## Foundation to preserve

- schema-v16/save-v3 dual-profile identity and validated legacy migration;
- profile participation in checksums, replay and save summaries;
- profile-aware building, research, unit, repair and upgrade calculations;
- stored queued-item cost, start and completion timestamps;
- active/offline chronological clock and fixed-point speed mapping;
- ordinary player/bot commands and visibility rules;
- navigation, intelligence, destruction/recovery and Browser E2E contracts.

## Recovery rule

Start #135 only from fresh synchronized `main`. Do not alter #134 profile identity, migration or queue-compatibility semantics. Any accepted numeric divergence must record the failing seed, amend the contract and rerun the complete matrix.
''', encoding='utf-8')

Path('docs/17-continuation-guide.md').write_text(f'''# AI Continuation Guide

**Status:** PR #134 merged; final implementation PR #135 is next  
**Updated:** 2026-07-30  
**Last merged PR:** #134 `PROGRESSION-PROFILE-FOUNDATION` · `{MERGE_SHA}`  
**Runtime baseline:** schema v16 / save format v3 / `legacy-v1 | compressed-v1` progression profiles  
**Accepted target:** compressed economy, rewards, bot phases and measured campaign closure  
**Next branch:** `agent/compressed-campaign-progression-gate`

## Repository

`ratoker-jpg/stellar-empires` · default branch `main` · GitHub Pages deployment.

Current GitHub history and actual `main` override stale prose, prior chat memory and abandoned branches.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/audits/contracts/campaign-progression-balance-01-profile.md`
6. `docs/audits/contracts/campaign-progression-balance-01-prs.md`
7. `docs/audits/evidence/campaign-progression-balance-01-baseline.md`
8. `docs/audits/evidence/campaign-progression-balance-01-candidate.md`
9. `docs/audits/evidence/campaign-progression-balance-01-source-map.md`
10. `docs/audits/evidence/campaign-progression-balance-01-graphify.md`
11. `docs/audits/completed/local-campaign-time-pacing-01.md`
12. `docs/changes/pr132-campaign-clock-offline-gate.md`
13. `docs/25a-local-campaign-world-speed-and-offline-progression.md`
14. this document
15. `docs/project-status.json`
16. `docs/roadmap-pr-index.json`
17. latest merged PRs and actual `main`

## Delivered through merged `main`

- #101–#105: complete catalog runtime art;
- #106–#110: Universe navigation/action gate;
- #111–#115: routed application shell;
- #116–#120: ordinary mission/intelligence/bot parity gate;
- #121–#123: demolition, whole-planet destruction and recovery;
- #124: local campaign product contract;
- #125–#129: navigation/usability repair;
- #130–#132: immutable settings, persistence and shared active/offline campaign time;
- #133: accepted measured progression-profile and two-PR implementation contract;
- #134: schema-v16 dual-profile foundation, legacy migration, deterministic profile consumers and profile identity UI.

## Accepted progression contract

```text
schema v16
CampaignSettings.progressionProfile = legacy-v1 | compressed-v1
schema-v15 and older saves/replays → legacy-v1
new normal campaigns → compressed-v1
save format v3 retained
complexity heavy
exactly 2 implementation PRs
```

Measured candidate at recommended x2:

```text
first combat ship        15.08 min · accepted max 16
first scout              27.85 min · accepted max 30
first colonizer         104.89 min · accepted max 120
first planet destroyer  221.53 min · accepted max 360
endgame-ready path      352.58 min · accepted max 720
```

Full deterministic endgame-ready progression targets 12 x2 real hours and has a 16-hour hard maximum. Actual alliances, Solar War, functional Gates and victory/defeat remain outside this batch.

## Ordered implementation

```text
#134 PROGRESSION-PROFILE-FOUNDATION — merged as {MERGE_SHA}
→ #135 COMPRESSED-CAMPAIGN-PROGRESSION-GATE — next
```

PR #134 delivered:

- schema-v16 immutable profile identity;
- legacy migration and compressed new-campaign default;
- explicit replay/checksum identity;
- central typed profile registry;
- profile-aware building/research/unit/defence/repair/upgrade resolution;
- profile identity in New Game, System and Saves;
- old queued-item compatibility;
- formula, migration and three-faction parity gates.

PR #135 must deliver only:

- compressed starting stocks, capacity and population;
- accepted production, storage and reward multipliers;
- consistent mission, expedition and space-object rewards;
- deterministic bot progression phases using ordinary commands;
- milestone runner and accepted seed/faction matrix;
- x1/x2/x5/x10 exact scaling equivalence;
- active/offline/save-load partition equivalence;
- 12-hour target and 16-hour hard-maximum closure;
- release-viewport Browser E2E, final change record and batch archive.

## Recovery

Start #135 from fresh synchronized `main`. Do not alter accepted profile identity or constants silently. Any required numeric divergence needs a recorded deterministic failure, explicit contract amendment and full matrix rerun.
''', encoding='utf-8')

replace(
    'docs/audits/current-batch-audit.md',
    '**Status:** accepted by Audit PR #133  \n**Audit merge:** `989c2c0b8fc3d5cfe672af267a248b6b384331cc`  \n**Updated:** 2026-07-29',
    '**Status:** implementation active; PR #134 merged and PR #135 authorized next  \n**Audit merge:** `989c2c0b8fc3d5cfe672af267a248b6b384331cc`  \n**Updated:** 2026-07-30',
)
replace(
    'docs/audits/current-batch-audit.md',
    'No third implementation PR is pre-authorized.\n',
    f'''No third implementation PR is pre-authorized.\n\n## Implementation progress\n\n```text\n#134 head {HEAD_SHA}\nCI {CI_RUN} — passed\nBrowser E2E {BROWSER_RUN} — passed\nGraphify {GRAPHIFY_RUN} — passed\nreview threads — none\nsquash merge {MERGE_SHA}\n```\n\nPR #134 delivered schema v16, dual-profile identity, legacy migration, centralized deterministic progression consumers, queue compatibility and profile identity UI.\n''',
)
replace(
    'docs/audits/current-batch-audit.md',
    'Create and execute only PR #134 `PROGRESSION-PROFILE-FOUNDATION` from fresh synchronized `main`.',
    'Create and execute only PR #135 `COMPRESSED-CAMPAIGN-PROGRESSION-GATE` from fresh synchronized `main`. Preserve all #134 migration, checksum and queued-item compatibility contracts.',
)

replace(
    'docs/27-playable-game-roadmap-v5.md',
    '**Updated:** 2026-07-29  \n**Last merged PR:** #132 `CAMPAIGN-CLOCK-OFFLINE-GATE` · `df56566ce6d311ecef81103dddb924b5da0148c1`  \n**Runtime baseline:** schema v15 / save format v3 / shared active-offline campaign clock  \n**Last completed batch:** `LOCAL-CAMPAIGN-TIME-PACING-01`  \n**Next authorized work:** Audit `CAMPAIGN-PROGRESSION-BALANCE-01`',
    f'**Updated:** 2026-07-30  \n**Last merged PR:** #134 `PROGRESSION-PROFILE-FOUNDATION` · `{MERGE_SHA}`  \n**Runtime baseline:** schema v16 / save format v3 / immutable dual progression profiles  \n**Last completed batch:** `LOCAL-CAMPAIGN-TIME-PACING-01`  \n**Next authorized work:** PR #135 `COMPRESSED-CAMPAIGN-PROGRESSION-GATE`',
)
replace('docs/27-playable-game-roadmap-v5.md', '## 3. Delivered baseline through PR #132', '## 3. Delivered baseline through PR #134')
replace('docs/27-playable-game-roadmap-v5.md', '- schema v15 immutable checksummed `CampaignSettings`;', '- schema v16 immutable checksummed `CampaignSettings` with `legacy-v1 | compressed-v1`;')
replace('docs/27-playable-game-roadmap-v5.md', '- state v1–v14 and save format v1–v2 migration to x1 using validated envelope time;', '- state v1–v15 and save format v1–v2 migration to x1 plus `legacy-v1` using validated envelope time;')
replace('docs/27-playable-game-roadmap-v5.md', '- x2 is presented as recommended;', '- x2 and `compressed-v1` are presented as recommended;')
replace(
    'docs/27-playable-game-roadmap-v5.md',
    '''### PR #132 validation

- final head `67cca4da2c401d2d9f5573e8c463dbbb570204d5`;
- CI `30488370854`;
- Browser E2E `30488370956`, 24/24 Chromium scenarios;
- Graphify `30488370908`;
- all actionable P0/P1/P2 review threads resolved;
- merge `df56566ce6d311ecef81103dddb924b5da0148c1`.

## 4. Next measured gap — progression balance

The campaign now has correct persisted identity, active time and offline continuation, but current progression values have not yet been measured or compressed for the intended complete campaign duration.

`CAMPAIGN-PROGRESSION-BALANCE-01` must audit before any value changes:

- standard complete campaign duration;
- first reconnaissance, combat and colonization timing;
- building/research/production level and queue compression;
- world-speed preset balance and x2 recommendation;
- resource income, storage and population constraints;
- fleet, planet-destroyer and eventual endgame timing;
- repetitive versus meaningful progression steps;
- player and honest-bot ability to reach the same milestones.

The audit must use the delivered fake-clock/headless and Browser E2E foundation, record exact measurements, determine complexity and authorize a bounded implementation batch.''',
    f'''### PR #134 validation

- final head `{HEAD_SHA}`;
- CI `{CI_RUN}`;
- Browser E2E `{BROWSER_RUN}`;
- Graphify `{GRAPHIFY_RUN}`;
- no unresolved review threads;
- merge `{MERGE_SHA}`.

## 4. Current measured gap — compressed campaign closure

The campaign now has schema-v16 dual-profile identity and all existing progression consumers resolve through the immutable profile. The remaining accepted work is the final #135 economy/reward/bot and measured-duration closure.

`COMPRESSED-CAMPAIGN-PROGRESSION-GATE` must deliver:

- compressed starting stocks, capacities, population and storage/production multipliers;
- consistent mission, expedition and space-object rewards;
- deterministic bot progression phases using ordinary commands;
- player and bot milestone gates across the accepted seed/faction matrix;
- exact x1/x2/x5/x10 scaling equivalence;
- active/offline/save-load partition equivalence;
- median ≤12 x2 hours and every accepted seed ≤16 x2 hours;
- release-viewport Browser E2E, change record and completed batch archive.''',
)
replace('docs/27-playable-game-roadmap-v5.md', '| M4d — Campaign progression balance | next audit authorized | separate `CAMPAIGN-PROGRESSION-BALANCE-01` audit |', '| M4d — Campaign progression balance | implementation active | Audit #133; #134 merged; #135 next |')
replace('docs/27-playable-game-roadmap-v5.md', '- the next repository PR must be an Audit PR;', '- the next repository PR must be authorized implementation PR #135;')
replace('docs/27-playable-game-roadmap-v5.md', '- old saves migrate to x1;', '- old saves migrate to x1 and `legacy-v1`; new campaigns use `compressed-v1`;')
replace('docs/27-playable-game-roadmap-v5.md', '- no numeric progression change is allowed before the progression audit merges.', '- accepted progression constants may change only through the recorded divergence rule and full matrix rerun.')
replace(
    'docs/27-playable-game-roadmap-v5.md',
    'Create Audit PR `CAMPAIGN-PROGRESSION-BALANCE-01` from fresh current `main`. Measure the full affected code, player, bot, persistence, UI and test surface; decide exact progression compression and batch complexity; do not implement balance changes in the audit itself.',
    'Create PR #135 `COMPRESSED-CAMPAIGN-PROGRESSION-GATE` from fresh synchronized `main`. Implement only the accepted economy, reward, bot-phase and measured closure contract; do not implement alliances, Solar War, functional Gates or victory/defeat.',
)

replace('docs/audits/contracts/campaign-progression-balance-01-profile.md', '**Status:** proposed for acceptance in Audit PR #133', '**Status:** accepted by Audit PR #133; profile foundation merged in PR #134')
replace('docs/audits/contracts/campaign-progression-balance-01-prs.md', '**Status:** proposed for acceptance in Audit PR #133', '**Status:** accepted by Audit PR #133; PR #134 merged and PR #135 next')
replace('docs/audits/contracts/campaign-progression-balance-01-prs.md', 'No implementation may start before Audit PR #133 merges.', f'Audit PR #133 merged. PR #134 merged as `{MERGE_SHA}`; only PR #135 remains authorized.')

project_path = Path('docs/project-status.json')
project = json.loads(project_path.read_text(encoding='utf-8'))
project.update({
    'statusVersion': 48,
    'updatedAt': '2026-07-30',
    'lastMergedPr': 134,
    'lastMergeSha': MERGE_SHA,
    'verifiedMainBaseline': f'Implementation PR #134 PROGRESSION-PROFILE-FOUNDATION merged as {MERGE_SHA} after CI {CI_RUN}, Browser E2E {BROWSER_RUN}, Graphify {GRAPHIFY_RUN} and no unresolved review threads; runtime is schema v16/save v3 with immutable legacy-v1 | compressed-v1 progression identity',
    'runtimeBaselinePr': 134,
    'runtimeBaselineSha': MERGE_SHA,
    'activePr': None,
    'activePrKind': None,
    'activeWorkItem': None,
    'nextPrAfterActive': 135,
    'nextPrKind': 'implementation',
    'nextWorkItem': 'COMPRESSED-CAMPAIGN-PROGRESSION-GATE',
    'currentMilestone': 'M4d final implementation PR #135 next',
    'nextAction': 'Create PR #135 COMPRESSED-CAMPAIGN-PROGRESSION-GATE from fresh synchronized main and implement only its accepted closure contract.',
})
project['currentBatch']['completedImplementationPrs'] = [134]
project['currentBatch']['implementationMergeShas'] = {'134': MERGE_SHA}
project['currentBatch']['status'] = 'implementation-in-progress'
implementation = project['activeImplementationState']
implementation['stateSchema'] = 16
implementation['progressionProfileImplemented'] = True
implementation['compressedProgressionImplemented'] = False
implementation['status'] = 'merged-main'
project['activeDelivery'].append({
    'pr': 134,
    'kind': 'implementation',
    'workItem': 'PROGRESSION-PROFILE-FOUNDATION',
    'status': 'merged',
    'mergeSha': MERGE_SHA,
})
project['knownLimitations'] = [
    'compressed starting economy, rewards, deterministic bot phases and full campaign-duration closure remain until PR #135',
    *project['knownLimitations'][1:],
]
project['deliveredDomains'][0] = 'deterministic schema-v16 simulation with immutable campaign and progression-profile identity'
project['deliveredDomains'][3] = 'schema v1-v15 and save format v1-v2 migration to x1 and legacy-v1 using validated envelope time'
project['deliveredDomains'].insert(4, 'central legacy-v1/compressed-v1 progression caps, requirements, costs, times and queue compatibility')
project['graphify']['lastValidation'] = f'PR #134 final head {HEAD_SHA} passed Graphify run {GRAPHIFY_RUN} before squash merge {MERGE_SHA}'
project['graphify']['lastAuditGraph'] = {
    'workflowRun': GRAPHIFY_RUN,
    'headSha': HEAD_SHA,
    'evidence': 'PR #134 Graphify workflow artifact',
}
project_path.write_text(json.dumps(project, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

roadmap_path = Path('docs/roadmap-pr-index.json')
roadmap = json.loads(roadmap_path.read_text(encoding='utf-8'))
roadmap['updatedAt'] = '2026-07-30'
roadmap['authoritativeBaseline'].update({
    'lastMergedPr': 134,
    'mergeSha': MERGE_SHA,
    'runtimeBaselinePr': 134,
    'runtimeBaselineSha': MERGE_SHA,
})
roadmap.update({
    'activePr': None,
    'activePrKind': None,
    'activeWorkItem': None,
    'nextPr': 135,
    'nextPrKind': 'implementation',
    'nextWorkItem': 'COMPRESSED-CAMPAIGN-PROGRESSION-GATE',
    'nextAction': 'Create PR #135 COMPRESSED-CAMPAIGN-PROGRESSION-GATE from fresh synchronized main and implement only its accepted closure contract.',
})
phase = next(item for item in roadmap['phases'] if item['id'] == 'campaign-progression-balance')
phase['status'] = 'implementation-in-progress'
phase['completedPrs'] = [134]
phase['implementationMergeShas'] = {'134': MERGE_SHA}
for item in roadmap['planned']:
    if item['number'] == 134:
        item['status'] = 'merged'
        item['mergeSha'] = MERGE_SHA
    elif item['number'] == 135:
        item['status'] = 'next'
roadmap_path.write_text(json.dumps(roadmap, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

for json_path in (project_path, roadmap_path):
    json.loads(json_path.read_text(encoding='utf-8'))

print('PR #134 exact-SHA status synchronization prepared successfully.')
