import '../styles/accessibilityRuntime.css';

export type ViewportMode = 'desktop' | 'compact' | 'mobile';

export function getViewportMode(width: number, height: number): ViewportMode {
  if (width < 900) return 'mobile';
  if (width < 1380 || height < 760) return 'compact';
  return 'desktop';
}

export function getRovingNavigationIndex(
  currentIndex: number,
  key: string,
  count: number,
): number | undefined {
  if (count <= 0) return undefined;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  if (key === 'ArrowRight' || key === 'ArrowDown') return (currentIndex + 1) % count;
  if (key === 'ArrowLeft' || key === 'ArrowUp') return (currentIndex - 1 + count) % count;
  return undefined;
}

function ensureSkipLink(): HTMLAnchorElement {
  const existing = document.querySelector<HTMLAnchorElement>('#skip-to-game');
  if (existing !== null) return existing;
  const link = document.createElement('a');
  link.id = 'skip-to-game';
  link.className = 'skip-link';
  link.href = '#primary-game-view';
  link.textContent = 'Перейти к игровому экрану';
  document.body.prepend(link);
  return link;
}

function ensureLiveRegion(): HTMLElement {
  const existing = document.querySelector<HTMLElement>('#accessibility-live-region');
  if (existing !== null) return existing;
  const region = document.createElement('div');
  region.id = 'accessibility-live-region';
  region.className = 'sr-only';
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'true');
  document.body.append(region);
  return region;
}

function enhanceImages(root: ParentNode): void {
  for (const image of root.querySelectorAll<HTMLImageElement>('img')) {
    image.decoding = 'async';
    if (!image.classList.contains('brand-logo') && !image.classList.contains('commander-emblem')) {
      image.loading = 'lazy';
    }
  }
}

function bindRailKeyboardNavigation(): () => void {
  const rail = document.querySelector<HTMLElement>('.side-rail');
  if (rail === null) return () => undefined;
  const handler = (event: KeyboardEvent): void => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement) || !target.classList.contains('rail-button')) return;
    const buttons = Array.from(
      rail.querySelectorAll<HTMLButtonElement>('.rail-button:not(:disabled)'),
    );
    const index = buttons.indexOf(target);
    if (index < 0) return;
    const nextIndex = getRovingNavigationIndex(index, event.key, buttons.length);
    if (nextIndex === undefined) return;
    event.preventDefault();
    buttons[nextIndex]?.focus();
  };
  rail.addEventListener('keydown', handler);
  return () => rail.removeEventListener('keydown', handler);
}

function bindDialogEscape(): () => void {
  const handler = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') return;
    const dialogs = Array.from(document.querySelectorAll<HTMLDialogElement>('dialog[open]'));
    const topmost = dialogs.at(-1);
    if (topmost === undefined) return;
    event.preventDefault();
    topmost.close();
  };
  document.addEventListener('keydown', handler, true);
  return () => document.removeEventListener('keydown', handler, true);
}

export function mountAccessibilityRuntime(): () => void {
  ensureSkipLink();
  const liveRegion = ensureLiveRegion();
  const primary = document.querySelector<HTMLElement>('.game-layout');
  if (primary !== null) {
    primary.id = 'primary-game-view';
    primary.tabIndex = -1;
  }

  const updateViewportMode = (): void => {
    document.documentElement.dataset.viewportMode = getViewportMode(
      window.innerWidth,
      window.innerHeight,
    );
  };
  let resizeFrame = 0;
  const onResize = (): void => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(updateViewportMode);
  };
  window.addEventListener('resize', onResize, { passive: true });
  updateViewportMode();

  const status = document.querySelector<HTMLElement>('#app-status');
  const statusObserver = new MutationObserver(() => {
    liveRegion.textContent = status?.textContent ?? '';
  });
  if (status !== null) statusObserver.observe(status, { childList: true, subtree: true });

  enhanceImages(document);
  const imageObserver = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof HTMLElement) {
          if (node instanceof HTMLImageElement) {
            node.decoding = 'async';
            if (!node.classList.contains('brand-logo')) node.loading = 'lazy';
          }
          enhanceImages(node);
        }
      }
    }
  });
  imageObserver.observe(document.body, { childList: true, subtree: true });

  const unbindRail = bindRailKeyboardNavigation();
  const unbindEscape = bindDialogEscape();

  return () => {
    cancelAnimationFrame(resizeFrame);
    window.removeEventListener('resize', onResize);
    statusObserver.disconnect();
    imageObserver.disconnect();
    unbindRail();
    unbindEscape();
  };
}
