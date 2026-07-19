# PR #31 — Transport and deployment missions

This change repairs the incomplete fleet merge from PR #29–#30 and makes fleet commands part of the single deterministic reducer used by the UI, tests, autosave and offline time advancement.

Schema v7 adds explicit `transport` and `deploy` mission state. Transport unloads cargo into an owned target using deterministic event order and storage capacity, then returns home. Deployment permanently stations the fleet on the target and changes its home planet. If ownership changes before arrival, the fleet returns automatically with its cargo intact.

The Fleet route now opens a mission composer for forming fleets, assigning cargo, sending transport/deploy missions, recalling outbound fleets and disbanding stationed fleets.
