import '../styles/accessibilityRuntime.css';

export type ViewportMode = 'desktop' | 'compact' | 'mobile';

export function getViewportMode(
  width: number,
  height: number,
  forceCompact = false,
): ViewportMode {
  if (width < 900) return 'mobile';
  if (forceCompact || width < 1380 || height < 760) return 'compact';
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
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopImmediatePropagation();
      target.click();
      return;
    }
    const buttons = Array.from(rail.querySelectorAll<HTMLButtonElement>('.rail-button:not(:disabled)'));
    const index = buttons.indexOf(target);
    if (index < 0) return;
    const nextIndex = getRovingNavigationIndex(index, event.key, buttons.length);
    if (nextIndex === undefined) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    buttons[nextIndex]?.focus();
  };
  rail.addEventListener('keydown', handler);
  return () => rail.removeEventListener('keydown', handler);
}

function bindTablistKeyboardNavigation(): () => void {
  const handler = (event: KeyboardEvent): void => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement) || target.getAttribute('role') !== 'tab') return;
    const tablist = target.closest<HTMLElement>('[role="tablist"]');
    if (tablist === null) return;
    const tabs = Array.from(tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'));
    const index = tabs.indexOf(target);
    if (index < 0) return;
    const nextIndex = getRovingNavigationIndex(index, event.key, tabs.length);
    if (nextIndex === undefined) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const next = tabs[nextIndex];
    next?.focus();
    next?.click();
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
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

  const updatePresentationMode = (): void => {
    const forceCompact = document.documentElement.dataset.uiDensity === 'compact';
    document.documentElement.dataset.viewportMode = getViewportMode(
      window.innerWidth,
      window.innerHeight,
      forceCompact,
    );
    const reduced = document.documentElement.dataset.motionPreference === 'reduce' ||
      matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.dataset.reducedMotion = String(reduced);
  };
  const onResize = (): void => {
    updatePresentationMode();
  };
  window.addEventListener('resize', onResize, { passive: true });
  updatePresentationMode();
  const preferenceObserver = new MutationObserver(updatePresentationMode);
  preferenceObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-ui-density', 'data-motion-preference'],
  });

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
  const unbindTabs = bindTablistKeyboardNavigation();
  const unbindEscape = bindDialogEscape();

  return () => {
    window.removeEventListener('resize', onResize);
    preferenceObserver.disconnect();
    statusObserver.disconnect();
    imageObserver.disconnect();
    unbindRail();
    unbindTabs();
    unbindEscape();
  };
}
