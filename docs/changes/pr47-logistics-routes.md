# PR #47 — Persistent interplanetary logistics routes

## Delivered

- Persistent resource routes between owned colonies.
- Configurable resource, shipment amount, origin reserve, interval and priority.
- Deterministic execution interleaved with normal simulation events.
- Capacity and reserve protection with explicit miss reasons.
- Pause, resume and delete commands.
- Route management panel in the command shell.
- Save schema v11 with migration from v1–v10.

## Intentional limitations

- Routes abstract the recurring cargo service and do not reserve an individual cargo ship yet.
- A route moves only one resource type.
- Missing endpoints are reported but routes are not automatically deleted.
