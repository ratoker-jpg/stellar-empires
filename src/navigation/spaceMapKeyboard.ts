import type { SpaceMapRoute } from './spaceMapRoute';

export type SpaceMapKeyboardIntent =
  | { readonly type: 'move-focus'; readonly delta: -1 | 1 }
  | { readonly type: 'activate-focus' }
  | { readonly type: 'previous-page' }
  | { readonly type: 'next-page' }
  | { readonly type: 'parent' }
  | { readonly type: 'none' };

export function getSpaceMapKeyboardIntent(
  route: SpaceMapRoute,
  key: string,
): SpaceMapKeyboardIntent {
  if (key === 'Escape') return { type: 'parent' };
  if (key === 'Enter' || key === ' ') return { type: 'activate-focus' };
  if (key === 'ArrowLeft' || key === 'ArrowUp') return { type: 'move-focus', delta: -1 };
  if (key === 'ArrowRight' || key === 'ArrowDown') return { type: 'move-focus', delta: 1 };
  if (route.level === 'galaxy' && key === 'PageUp') return { type: 'previous-page' };
  if (route.level === 'galaxy' && key === 'PageDown') return { type: 'next-page' };
  return { type: 'none' };
}

export function wrapFocusIndex(current: number, delta: -1 | 1, count: number): number {
  if (!Number.isInteger(count) || count <= 0) return 0;
  return (current + delta + count) % count;
}
