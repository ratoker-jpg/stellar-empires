import { describe, expect, it } from 'vitest';
import {
  SHELL_SCREEN_REGISTRY,
  validateScreenRegistry,
} from '../../src/ui/screenRegistry';

describe('shell screen registry', () => {
  it('contains unique stable ids, elements and order values', () => {
    expect(validateScreenRegistry()).toEqual([]);
    expect(new Set(SHELL_SCREEN_REGISTRY.map((entry) => entry.id)).size)
      .toBe(SHELL_SCREEN_REGISTRY.length);
    expect(new Set(SHELL_SCREEN_REGISTRY.map((entry) => entry.elementId)).size)
      .toBe(SHELL_SCREEN_REGISTRY.length);
  });

  it('contains Planet, Space and Research as canonical route families', () => {
    const routed = SHELL_SCREEN_REGISTRY.filter((entry) => entry.kind === 'route');
    expect(routed.map((entry) => entry.routeFamily)).toEqual(['planet', 'space', 'research']);
  });

  it('preserves accessible labels required by compatibility screens', () => {
    expect(SHELL_SCREEN_REGISTRY.find((entry) => entry.id === 'fleets')?.ariaLabel)
      .toBe('Флот');
    expect(SHELL_SCREEN_REGISTRY.find((entry) => entry.id === 'research')?.ariaLabel)
      .toBe('Исследования');
    expect(SHELL_SCREEN_REGISTRY.find((entry) => entry.id === 'system')?.ariaLabel)
      .toBe('Настройки');
  });
});
