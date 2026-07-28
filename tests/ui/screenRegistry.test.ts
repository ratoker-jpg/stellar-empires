import { describe, expect, it } from 'vitest';
import {
  SHELL_NAVIGATION_GROUPS,
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

  it('orders every route through the player-centered hierarchy', () => {
    expect(SHELL_NAVIGATION_GROUPS.map((group) => group.id)).toEqual([
      'gameplay',
      'development',
      'information',
      'utility',
    ]);
    expect(SHELL_SCREEN_REGISTRY.map((entry) => entry.routeFamily)).toEqual([
      'planet',
      'space',
      'fleets',
      'operations',
      'research',
      'command',
      'reports',
      'ranking',
      'system',
    ]);
    expect(SHELL_SCREEN_REGISTRY.every((entry) => entry.kind === 'route')).toBe(true);
  });

  it('promotes operations and reduces low-frequency route competition', () => {
    expect(SHELL_SCREEN_REGISTRY.find((entry) => entry.id === 'operations')?.group)
      .toBe('gameplay');
    expect(SHELL_SCREEN_REGISTRY.find((entry) => entry.id === 'space')).toMatchObject({
      label: 'Вселенная',
      ariaLabel: 'Вселенная и галактики',
      group: 'gameplay',
    });
    expect(SHELL_SCREEN_REGISTRY.find((entry) => entry.id === 'ranking')?.group)
      .toBe('information');
    expect(SHELL_SCREEN_REGISTRY.find((entry) => entry.id === 'system')?.group)
      .toBe('utility');
  });

  it('keeps all implemented destinations accessible', () => {
    expect(SHELL_SCREEN_REGISTRY.find((entry) => entry.id === 'command')?.ariaLabel)
      .toBe('Командование');
    expect(SHELL_SCREEN_REGISTRY.find((entry) => entry.id === 'ranking')?.ariaLabel)
      .toBe('Рейтинг');
    expect(SHELL_SCREEN_REGISTRY.find((entry) => entry.id === 'system')?.ariaLabel)
      .toBe('Настройки');
    expect(SHELL_SCREEN_REGISTRY.find((entry) => entry.id === 'fleets')?.ariaLabel)
      .toBe('Флоты');
  });
});
