# PR #46 — Planet specializations and development templates

## Delivered

- Persistent `balanced`, `resource`, `industry`, and `military` planet specializations.
- Resource-production, construction-speed, ship-production, and defense-production modifiers.
- Queue-safe specialization switching: the role cannot change while local queues are active.
- Advisory development templates that show recommended buildings without automatic construction.
- Planet-screen controls for specialization and template selection.
- Save schema v10 with migration from schema v1–v9.

## Intentional limitations

- Templates are recommendations, not an autopilot.
- All three factions still use the shared Aegis mechanical catalog.
- Planet role changes do not retroactively alter already queued durations.
