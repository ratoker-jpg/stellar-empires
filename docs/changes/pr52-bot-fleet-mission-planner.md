# PR #52 — Bot fleet and mission planner

## Delivered

- Deterministic fleet formation from ships and cargo available on bot-owned planets.
- Mission selection for transport, recycling, colonization, scouting, favorable attacks and defensive deployment.
- Every candidate is validated through the same `CREATE_FLEET` and `SEND_FLEET` domain functions used by the player.
- Target selection uses bot perception, public colony locations, public galaxy topology and bot-owned debris only.
- Attacks require current level-three intelligence and a favorable perceived power ratio.
- Fleet decisions include stable reason codes and explanations.
- Tests cover fleet creation, stale-intelligence refresh, inter-colony transport, colonization, risk-gated attacks and determinism.

## Intentional limitations

- The planner returns one command per planning step and is not yet executed automatically.
- Unknown empty locations are not scout mission targets because the current scout command targets developed planet states.
- Fleet splitting, reinforcement merging and simultaneous multi-fleet plans remain later orchestration work.
