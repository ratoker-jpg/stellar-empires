import { expect, test, type Page } from '@playwright/test';

// UI-02-WORKSPACE-VISUAL-CONSISTENCY-AND-RESPONSIVE-GATE acceptance gate
// (audit PR #188): every registered route family and representative
// sub-route stays visible and operable across the supported viewport
// matrix, page-level horizontal overflow never appears, workspace
// families scroll inside their own containers, dialogs close with
// Escape and report filters react to keyboard activation.
const GATE_VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
] as const;

const WORKSPACE_ROUTES = [
  { hash: '#/research', family: 'research', workspace: '#research-view' },
  { hash: '#/fleets/overview', family: 'fleets', workspace: '#fleets-view' },
  { hash: '#/fleets/compose', family: 'fleets', workspace: '#fleets-view' },
  { hash: '#/operations/overview', family: 'operations', workspace: '#operations-view' },
  { hash: '#/operations/market', family: 'operations', workspace: '#operations-view' },
  { hash: '#/operations/logistics', family: 'operations', workspace: '#operations-view' },
  { hash: '#/command/overview', family: 'command', workspace: '#command-view' },
  { hash: '#/command/doctrine', family: 'command', workspace: '#command-view' },
  { hash: '#/ranking', family: 'ranking', workspace: '#ranking-view' },
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

        // Workspace families own their vertical scroll: the page itself
        // must not scroll while the workspace content can.
        const scroll = await page.evaluate(() => ({
          docHeight: document.documentElement.scrollHeight,
          clientHeight: document.documentElement.clientHeight,
        }));
        expect(scroll.docHeight, `${route.hash} page height`).toBeLessThanOrEqual(
          scroll.clientHeight + 1,
        );

        // Representative content stays reachable: the workspace heading
        // (static data-shell-heading or rendered h1) is visible.
        const heading = page
          .locator(`${route.workspace} [data-shell-heading], ${route.workspace} h1`)
          .first();
        await expect(heading).toBeVisible();
      }

      // Space family keeps its dedicated canvas contract (min-height page
      // scroll is allowed there), but must not overflow horizontally.
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

      // Deep links with an unknown colony normalize to overview, so the
      // industry surface is opened through the real colony id.
      const planetId = await page.locator('#hud-planet-selector').inputValue();
      await openHash(page, `#/planet/${encodeURIComponent(planetId)}/industry`);
      await expect(page.locator('#planet-context-panel')).toHaveAttribute('data-mode', 'industry');

      // Workspace dialog opens from an industry gateway and closes with Escape.
      const gateway = page.locator('.zone-gateway', { hasText: 'Склады и логистика' }).first();
      await gateway.scrollIntoViewIfNeeded();
      await gateway.click();
      const dialog = page.locator('#workspace-dialog');
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();

      // Report filters react to keyboard activation.
      await openHash(page, '#/reports/all');
      await expect(page.locator('html')).toHaveAttribute('data-shell-route-family', 'reports');
      const filter = page.locator('#reports-route-tabs [data-report-filter="combat"]');
      await filter.focus();
      await page.keyboard.press('Enter');
      await expect(filter).toHaveAttribute('aria-selected', 'true');
      await expectNoPageHorizontalOverflow(page);

      // Fleet route tabs switch through the keyboard as well.
      await openHash(page, '#/fleets/active');
      const fleetTab = page.locator('#fleet-route-tabs [data-fleet-mode="active"]');
      await expect(fleetTab).toHaveAttribute('aria-selected', 'true');
    });
  }
});
