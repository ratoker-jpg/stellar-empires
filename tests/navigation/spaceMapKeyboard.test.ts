import { describe, expect, it } from 'vitest';
import {
  getSpaceMapKeyboardIntent,
  wrapFocusIndex,
} from '../../src/navigation/spaceMapKeyboard';

describe('Space Map keyboard parity', () => {
  it('maps keyboard actions to the same activation and page intents as pointer controls', () => {
    const galaxy = { level: 'galaxy', galaxy: 1, page: 1 } as const;
    expect(getSpaceMapKeyboardIntent(galaxy, 'Enter')).toEqual({ type: 'activate-focus' });
    expect(getSpaceMapKeyboardIntent(galaxy, 'PageUp')).toEqual({ type: 'previous-page' });
    expect(getSpaceMapKeyboardIntent(galaxy, 'PageDown')).toEqual({ type: 'next-page' });
    expect(getSpaceMapKeyboardIntent(galaxy, 'Escape')).toEqual({ type: 'parent' });
  });

  it('wraps focus deterministically across 20, 9 and 24 nodes', () => {
    expect(wrapFocusIndex(0, -1, 20)).toBe(19);
    expect(wrapFocusIndex(8, 1, 9)).toBe(0);
    expect(wrapFocusIndex(23, 1, 24)).toBe(0);
  });
});
