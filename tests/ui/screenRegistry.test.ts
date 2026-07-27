import { describe, expect, it } from 'vitest';
import {
  SHELL_SCREEN_REGISTRY,
  validateScreenRegistry,
} from '../../src/ui/screenRegistry';

describe('shell screen registry', () => {
  it('contains unique stable ids, elements, routes, badges and order values', () => {
    expect(validateScreenRegistry()).toEqual([]);
    expect(new Set(SHELL_SCREEN_REGISTRY.map((entry) => entry.id)).size)
      .toBe(SHELL_SCREEN_REGISTRY.length);
    expect(new Set(SHELL_SCREEN_REGISTRY.map((entry) => entry.elementId)).size)
      .toBe(SHELL_SCREEN_REGISTRY.length);
    expect(new Set(SHELL_SCREEN_REGISTRY.map((entry) => entry.routeFamily)).size)
      .toBe(SHELL_SCREEN_REGISTRY.length);
    const badgeIds = SHELL_SCREEN_REGISTRY.flatMap((entry) =>
      entry.badgeId === undefined ? [] : [entry.badgeId]);
    expect(new Set(badgeIds).size).toBe(badgeIds.length);
  });

  it('contains every implemented primary route exactly once', () => {
    expect(SHELL_SCREEN_REGISTRY.map((entry) => entry.routeFamily)).toEqual([
      'planet',
      'fleets',
      'space',
      'research',
      'command',
      'ranking',
      'operations',
      'reports',
      'system',
    ]);
    expect(SHELL_SCREEN_REGISTRY.every((entry) => entry.kind === 'route')).toBe(true);
  });

  it('keeps all implemented primary items enabled and accessible', () => {
    expect(SHELL_SCREEN_REGISTRY.find((entry) => entry.id === 'command')?.ariaLabel)
      .toBe('Командование');
    expect(SHELL_SCREEN_REGISTRY.find((entry) => entry.id === 'ranking')?.ariaLabel)
      .toBe('Рейтинг');
    expect(SHELL_SCREEN_REGISTRY.find((entry) => entry.id === 'system')?.ariaLabel)
      .toBe('Настройки');
    expect(SHELL_SCREEN_REGISTRY.find((entry) => entry.id === 'fleets')?.ariaLabel)
      .toBe('Флот');
  });
});
