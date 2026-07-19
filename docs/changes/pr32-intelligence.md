# PR #32 — Intelligence and counter-intelligence

Schema v8 adds per-empire intelligence observations and detection alerts. A scout mission may target any occupied planet but requires a dedicated scout ship. Arrival produces a deterministic snapshot whose reveal level depends on scout composition and sensor research: ownership, economy/buildings, then defenses and stationed fleets.

Observations keep their original snapshot and expire after a level-dependent lifetime. Counter-intelligence combines target sensor research and sensor-array infrastructure with a seeded detection roll. Detected missions create a defender alert with confidence-based source attribution. Scout fleets return automatically after observation, and all reports survive autosave, import/export and offline time advancement.
