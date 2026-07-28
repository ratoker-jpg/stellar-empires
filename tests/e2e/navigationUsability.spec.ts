import { expect, test, type Page } from '@playwright/test';

const RELEASE_VIEWPORTS = [
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
] as const;

const PRIMARY_WORKSPACES = [
  ['nav-planet', 'planet', '#planet-view'],
  ['nav-galaxy', 'space', '#galaxy-view'],
  ['nav-fleet', 'fleets', '#fleets-view'],
  ['nav-operations', 'operations', '#operations-view'],
  ['nav-research', 'research', '#research-view'],
  ['nav-empire', 'command', '#command-view'],
  ['nav-reports', 'reports', '#reports-view'],
  ['nav-rating', 'ranking', '#ranking-view'],
  ['nav-system', 'system', '#system-view'],
] as const;

const LEGACY_COMPETING_LAUNCHERS = [
  '#mission-screen-dialog',
  '#operations-workspace-dialog',
  '#mission-reports-dialog',
  '#galaxy-intel-dialog',
  '#expedition-dialog',
  '#space-objects-dialog',
  '#world-events-dialog',
  '#research-screen-dialog',
  '#ship-production-dialog',
  '#defense-production-dialog',
  '#ship-upgrades-dialog',
  '#nav-expeditions',
  '#nav-space-objects',
  '#nav-world-events',
] as const;

async function expectReady(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
}

async function expectChecksum(page: Page, checksum: string | null): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-state-checksum', checksum ?? '');
}

async function expectReleaseLayout(page: Page, activeWorkspace: string): Promise<void> {
  const layout = await page.evaluate((selector) => {
    const workspace = document.querySelector<HTMLElement>(selector);
    const rect = workspace?.getBoundingClientRect();
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      workspaceHidden: workspace?.hidden ?? true,
      workspaceWidth: rect?.width ?? 0,
      workspaceHeight: rect?.height ?? 0,
    };
  }, activeWorkspace);
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
  expect(layout.workspaceHidden).toBe(false);
  expect(layout.workspaceWidth).toBeGreaterThan(0);
  expect(layout.workspaceHeight).toBeGreaterThan(0);
}

async function runAcceptedTaskBudgets(page: Page): Promise<void> {
  await page.goto('/?e2e=1#/planet/missing/overview');
  await expectReady(page);
  const checksum = await page.locator('html').getAttribute('data-state-checksum');
  const planetId = await page.locator('#hud-planet-selector').inputValue();

  // Active colony → Research: two purposeful actions.
  await page.locator('[data-planet-mode="industry"]').click();
  await page.getByRole('button', { name: /^Исследовательский комплекс/ }).click();
  await expect(page).toHaveURL(/#\/research$/);
  await expect(page.locator('#research-view')).toBeVisible();
  await expect(page.locator('[data-shell-return="planet"]')).toBeVisible();
  await expectReleaseLayout(page, '#research-view');

  // One return action restores the exact originating colony and zone.
  await page.locator('[data-shell-return="planet"]').click();
  await expect(page).toHaveURL(new RegExp(`#\\/planet\\/${encodeURIComponent(planetId)}\\/industry$`));

  // Exact local development destinations require one gateway action from their relevant zone.
  await page.getByRole('button', { name: /^Орбитальная верфь/ }).click();
  await expect(page).toHaveURL(/\/industry\?surface=shipyard$/);
  await expect(page.locator('#ship-production-view')).toBeVisible();
  await expectReleaseLayout(page, '#planet-view');

  await page.locator('[data-development-surface="zone"]').click();
  await page.getByRole('button', { name: /^Модернизация кораблей/ }).click();
  await expect(page).toHaveURL(/\/industry\?surface=upgrades$/);
  await expect(page.locator('#ship-upgrades-view')).toBeVisible();
  await expectReleaseLayout(page, '#planet-view');

  await page.locator('[data-planet-mode="military"]').click();
  await page.getByRole('button', { name: /^Планетарная оборона/ }).click();
  await expect(page).toHaveURL(/\/military\?surface=defense$/);
  await expect(page.locator('#defense-production-view')).toBeVisible();
  await expectReleaseLayout(page, '#planet-view');

  // One visible selector action keeps the equivalent local task on another valid colony.
  const planetIds = await page.locator('#hud-planet-selector option').evaluateAll(
    (options) => options.map((option) => (option as HTMLOptionElement).value),
  );
  expect(planetIds.length).toBeGreaterThanOrEqual(2);
  const sourcePlanetId = await page.locator('#hud-planet-selector').inputValue();
  const targetPlanetId = planetIds.find((candidate) => candidate !== sourcePlanetId);
  expect(targetPlanetId).toBeDefined();
  await page.goto(
    `/?e2e=1#/planet/${encodeURIComponent(sourcePlanetId)}/industry?surface=shipyard`,
  );
  await expectReady(page);
  await expect(page.locator('#ship-production-view')).toBeVisible();
  await page.locator('#hud-planet-selector').selectOption(targetPlanetId!);
  await expect(page).toHaveURL(
    new RegExp(`#\\/planet\\/${encodeURIComponent(targetPlanetId!)}\\/industry\\?surface=shipyard$`),
  );
  await expect(page.locator('#ship-production-view')).toBeVisible();
  await expectReleaseLayout(page, '#planet-view');

  // Operations overview → exact operation mode: one action.
  await page.goto('/?e2e=1#/operations/overview');
  await expectReady(page);
  await page.getByRole('button', { name: /^Логистика/ }).click();
  await expect(page).toHaveURL(/#\/operations\/logistics$/);
  await expectReleaseLayout(page, '#operations-view');

  // Returning to the latest valid subroute costs one primary activation.
  await page.locator('#nav-reports').click();
  await expect(page).toHaveURL(/#\/reports\/all$/);
  await page.locator('#nav-operations').click();
  await expect(page).toHaveURL(/#\/operations\/logistics$/);
  await expect(page.locator('[data-operations-mode="logistics"]')).toHaveAttribute('aria-selected', 'true');
  await expectReleaseLayout(page, '#operations-view');

  await expectChecksum(page, checksum);
}

test('every primary destination is reachable without a competing legacy launcher', async ({ page }) => {
  await page.goto('/?e2e=1#/planet/missing/overview');
  await expectReady(page);
  const checksum = await page.locator('html').getAttribute('data-state-checksum');

  for (const [buttonId, family, workspace] of PRIMARY_WORKSPACES) {
    await page.locator(`#${buttonId}`).click();
    await expect(page.locator('html')).toHaveAttribute('data-shell-route-family', family);
    await expect(page.locator(workspace)).toBeVisible();
    await expect(page.locator(`#${buttonId}`)).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('#shell-breadcrumbs')).not.toBeEmpty();
    await expectChecksum(page, checksum);
  }

  for (const selector of LEGACY_COMPETING_LAUNCHERS) {
    await expect(page.locator(selector)).toHaveCount(0);
  }
});

test('accepted task budgets pass at both release viewports', async ({ page }) => {
  for (const viewport of RELEASE_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await runAcceptedTaskBudgets(page);
  }
});

test('keyboard, history, reload and reduced motion remain equivalent', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize(RELEASE_VIEWPORTS[0]);
  await page.goto('/?e2e=1#/operations/market');
  await expectReady(page);
  const checksum = await page.locator('html').getAttribute('data-state-checksum');

  await page.locator('#nav-operations').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#nav-fleet')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/fleets\/overview$/);
  await expect(page.locator('#fleets-view')).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/#\/operations\/market$/);
  await expect(page.locator('[data-operations-mode="market"]')).toHaveAttribute('aria-selected', 'true');
  await page.goForward();
  await expect(page).toHaveURL(/#\/fleets\/overview$/);

  await page.reload();
  await expectReady(page);
  await expect(page).toHaveURL(/#\/fleets\/overview$/);
  await expectChecksum(page, checksum);

  for (const viewport of RELEASE_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await expectReleaseLayout(page, '#fleets-view');
  }
});
