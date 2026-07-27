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

  it('contains every implemented primary route exactly once', () => {
    const routed = SHELL_SCREEN_REGISTRY.filter((entry) => entry.kind === 'route');
    expect(routed.map((entry) => entry.routeFamily)).toEqual([
      'planet',
      'fleets',
      'space',
      'research',
      'operations',
      'reports',
    ]);
    expect(new Set(routed.map((entry) => entry.routeFamily)).size).toBe(routed.length);
  });

  it('keeps later command and system work as compatibility entries', () => {
    expect(SHELL_SCREEN_REGISTRY.find((entry) => entry.id === 'command')?.kind).toBe('legacy');
    expect(SHELL_SCREEN_REGISTRY.find((entry) => entry.id === 'ranking')?.kind).toBe('legacy');
    expect(SHELL_SCREEN_REGISTRY.find((entry) => entry.id === 'system')?.kind).toBe('legacy');
  });

  it('preserves accessible labels required by compatibility screens', () => {
    expect(SHELL_SCREEN_REGISTRY.find((entry) => entry.id === 'fleets')?.ariaLabel)
      .toBe('Флот');
    expect(SHELL_SCREEN_REGISTRY.find((entry) => entry.id === 'research')?.ariaLabel)
      .toBe('Исследования');
    expect(SHELL_SCREEN_REGISTRY.find((entry) => entry.id === 'operations')?.ariaLabel)
      .toBe('Операционный центр');
    expect(SHELL_SCREEN_REGISTRY.find((entry) => entry.id === 'system')?.ariaLabel)
      .toBe('Настройки');
  });
});
