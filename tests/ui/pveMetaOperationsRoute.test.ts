import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  OPERATIONS_SHELL_MODES,
  parseAppShellRoute,
  serializeAppShellRoute,
} from '../../src/ui/appShellRoute';

describe('PvE meta Operations route', () => {
  it('keeps Arena inside the canonical Operations route family', () => {
    const state = createInitialGameState('pve-meta-operations-route');
    expect(OPERATIONS_SHELL_MODES).toContain('arena');
    const route = { family: 'operations', mode: 'arena' } as const;
    const hash = '#/operations/arena';
    expect(serializeAppShellRoute(route)).toBe(hash);
    expect(parseAppShellRoute(hash, state)).toEqual({
      route,
      canonicalHash: hash,
      error: null,
    });
  });
});
