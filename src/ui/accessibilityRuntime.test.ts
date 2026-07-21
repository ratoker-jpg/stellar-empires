import { describe, expect, it } from 'vitest';
import { getRovingNavigationIndex, getViewportMode } from './accessibilityRuntime';

describe('accessibility runtime helpers', () => {
  it('selects stable viewport modes at supported breakpoints', () => {
    expect(getViewportMode(1920, 1080)).toBe('desktop');
    expect(getViewportMode(1366, 768)).toBe('compact');
    expect(getViewportMode(1600, 700)).toBe('compact');
    expect(getViewportMode(899, 900)).toBe('mobile');
  });

  it('supports circular arrow navigation plus Home and End', () => {
    expect(getRovingNavigationIndex(0, 'ArrowLeft', 4)).toBe(3);
    expect(getRovingNavigationIndex(3, 'ArrowRight', 4)).toBe(0);
    expect(getRovingNavigationIndex(2, 'Home', 4)).toBe(0);
    expect(getRovingNavigationIndex(1, 'End', 4)).toBe(3);
    expect(getRovingNavigationIndex(1, 'Enter', 4)).toBeUndefined();
  });
});
