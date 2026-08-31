import { expect, test, type Page } from '@playwright/test';

// NAV-V2-02-REFERENCE-ROUTE-COMPOSITION-QA acceptance gate (Audit #199):
// the canonical shell and all representative reference surfaces stay visible,
// usable and horizontally bounded across the release viewport matrix.
const GATE_VIEWPORTS = [
  { width: 1672, height: 941 },
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
] as const;

const WORKSPACE_ROUTES = [
  { hash: '#/research', family: 'research', workspace: '#research-view' },
  { hash: '#/fleets/overview', family: 'fleets', workspace: '#fleets-view' },
  { hash: '#/fleets/compose', family: 'fleets', workspace: '#fleets-view' },
  { hash: '#/fleets/active', family: 'fleets', workspace: '#fleets-view' },
  { hash: '#/fleets/battles', family: 'fleets', workspace: '#fleets-view' },
  { hash: '#/operations/overview', family: 'operations', workspace: '#operations-view' },
  { hash: '#/operations/events', family: 'operations', workspace: '#operations-view' },
  { hash: '#/operations/arena', family: 'operations', workspace: '#operations-view' },
  { hash: '#/operations/solar-war', family: 'operations', workspace: '#operations-view' },
  { hash: '#/operations/market', family: 'operations', workspace: '#operations-view' },
  { hash: '#/operations/logistics', family: 'operations', workspace: '#operations-view' },
  { hash: '#/command/overview', family: 'command', workspace: '#command-view' },
  { hash: '#/command/doctrine', family: 'command', workspace: '#command-view' },
  { hash: '#/command/upgrades', family: 'command', workspace: '#command-view' },
  { hash: '#/ranking', family: 'ranking', workspace: '#ranking-view' },
  { hash: '#/reports/all', family: 'reports', workspace: '#reports-view' },
  { hash: '#/reports/combat', family: 'reports', workspace: '#reports-view' },
  { hash: '#/system/saves', family: 'system', workspace: '#system-view' },
  { hash: '#/system/settings', family: 'system', workspace: '#system-view' },
] as const;

async function expectReady(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
}

async function expectNoPageHorizontalOverflow(page: Page): Promise<void> {
  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
}

async function openHash(page: Page, hash: string): Promise<void> {
  await page.evaluate((target) => {
    window.location.hash = target;
  }, hash);
}

test.describe('workspace responsive gate', () => {
  for (const viewport of GATE_VIEWPORTS) {
    test(`every route family stays usable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/?e2e=1#/planet/missing/overview');
      await expectReady(page);

      for (const route of WORKSPACE_ROUTES) {
        await openHash(page, route.hash);
        await expect(page.locator('html')).toHaveAttribute('data-shell-route-family', route.family);
        await expect(page.locator(route.workspace)).toBeVisible();
        await expectNoPageHorizontalOverflow(page);

        const scroll = await page.evaluate(() => ({
          docHeight: document.documentElement.scrollHeight,
          clientHeight: document.documentElement.clientHeight,
        }));
        expect(scroll.docHeight, `${route.hash} page height`).toBeLessThanOrEqual(
          scroll.clientHeight + 1,
        );

        const heading = page
          .locator(`${route.workspace} [data-shell-heading], ${route.workspace} h1`)
          .first();
        await expect(heading).toBeVisible();
      }

      await openHash(page, '#/space');
      await expect(page.locator('html')).toHaveAttribute('data-shell-route-family', 'space');
      await expect(page.locator('#galaxy-view')).toBeVisible();
      await expectNoPageHorizontalOverflow(page);
    });
  }

  for (const viewport of GATE_VIEWPORTS) {
    test(`dialogs and keyboard filters stay operable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/?e2e=1#/planet/missing/overview');
      await expectReady(page);

      const planetId = await page.locator('#hud-planet-selector').inputValue();
      await openHash(page, `#/planet/${encodeURIComponent(planetId)}/industry`);
      await expect(page.locator('#planet-context-panel')).toHaveAttribute('data-mode', 'industry');

      const gateway = page.locator('.zone-gateway', { hasText: 'Склады и логистика' }).first();
      await gateway.scrollIntoViewIfNeeded();
      await gateway.click();
      const dialog = page.locator('#workspace-dialog');
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();

      await openHash(page, '#/reports/all');
      await expect(page.locator('html')).toHaveAttribute('data-shell-route-family', 'reports');
      const filter = page.locator('#reports-route-tabs [data-report-filter="combat"]');
      await filter.focus();
      await page.keyboard.press('Enter');
      await expect(filter).toHaveAttribute('aria-selected', 'true');
      await expectNoPageHorizontalOverflow(page);

      await openHash(page, '#/fleets/active');
      const fleetTab = page.locator('#fleet-route-tabs [data-fleet-mode="active"]');
      await expect(fleetTab).toHaveAttribute('aria-selected', 'true');
    });
  }

  test('reference composition exposes staged fleet, science detail and canonical settings categories', async ({ page }) => {
    await page.setViewportSize({ width: 1672, height: 941 });
    await page.goto('/?e2e=1#/research');
    await expectReady(page);

    await expect(page.locator('#research-category-tabs [data-research-category]')).toHaveCount(6);
    await expect(page.locator('#research-detail-panel')).toBeVisible();
    await expect(page.locator('#research-detail-panel h2')).toBeVisible();
    await page.locator('#research-category-tabs [data-research-category="weapons"]').click();
    await expect(page.locator('#research-category-tabs [data-research-category="weapons"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#research-screen-grid .research-card').first()).toBeVisible();

    await openHash(page, '#/fleets/compose');
    await expect(page.locator('.mission-workspace > .mission-create')).toBeVisible();
    await expect(page.locator('.mission-workspace > .mission-fleet-list')).toBeVisible();

    await openHash(page, '#/system/settings');
    const categories = page.locator('.system-settings-categories [data-settings-category]');
    await expect(categories).toHaveCount(6);
    await page.locator('[data-settings-category="campaign"]').click();
    await expect(page.locator('[data-settings-category="campaign"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-settings-panel="campaign"]')).toBeVisible();
    await expect(page.locator('[data-open-saves]')).toBeVisible();

    const planetId = await page.locator('#hud-planet-selector').inputValue();
    for (const mode of ['resource', 'industry', 'military'] as const) {
      await openHash(page, `#/planet/${encodeURIComponent(planetId)}/${mode}`);
      await expect(page.locator('#planet-context-panel')).toHaveAttribute('data-mode', mode);
      await expectNoPageHorizontalOverflow(page);
    }
    await openHash(page, `#/planet/${encodeURIComponent(planetId)}/industry?surface=upgrades`);
    await expect(page.locator('html')).toHaveAttribute('data-planet-development-surface', 'upgrades');
    await expectNoPageHorizontalOverflow(page);
  });
});
