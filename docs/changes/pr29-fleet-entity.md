# PR #29 — Serialized fleet entity

Game-state schema v5 adds deterministic fleets owned by empires. A fleet stores its ship composition, cargo, origin, current planet, minimum speed and combined cargo capacity. Creating a fleet validates registered ships, positive quantities, inventory availability, cargo resources and capacity before moving ships and resources out of the planet.

A stationed fleet can be disbanded only on an owned planet with enough storage capacity. Ships and cargo return exactly once. Legacy schema v1–v4 saves migrate with an empty fleet collection, and save validation rejects malformed serialized fleets.
