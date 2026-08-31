import { expect, test, type Page } from '@playwright/test';

// UI-01-SHELL-PLANET-COMMAND-CENTRE acceptance gate (audit PR #188):
// every planet zone opens, colony switching works, a building action is
// reachable, and no page-level horizontal overflow appears across the
// supported viewport matrix.
const COMMAND_CENTRE_VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
] as const;

const ZONE_TARGETS = ['resource', 'industry', 'military'] as const;

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

async function expectPlanetRegionsVisible(page: Page): Promise<void> {
  const regions = await page.evaluate(() => {
    const selectors = ['#planet-context-panel', '#planet-building-grid', '#planet-details-card'];
    return selectors.flatMap((selector) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (element === null || element.hidden || element.getClientRects().length === 0) return [];
      const rect = element.getBoundingClientRect();
      return [{
        selector,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        height: rect.height,
        viewportWidth: window.innerWidth,
      }];
    });
  });
  expect(regions.length).toBeGreaterThan(0);
  for (const region of regions) {
    expect(region.right, `${region.selector} right edge`).toBeLessThanOrEqual(region.viewportWidth + 1);
    expect(region.height, `${region.selector} height`).toBeGreaterThan(0);
  }
}

async function openZone(page: Page, zone: (typeof ZONE_TARGETS)[number]): Promise<void> {
  await page.locator(`[data-planet-mode="${zone}"]`).click();
  await expect(page.locator(`[data-planet-mode="${zone}"]`)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#planet-zone-stage')).toBeVisible();
  const nodes = page.locator('#planet-building-grid .planet-building-node');
  await expect(nodes.first()).toBeVisible();
  expect(await nodes.count()).toBeGreaterThan(0);
  await expectNoPageHorizontalOverflow(page);
}

test.describe('planet command centre viewport matrix', () => {
  for (const viewport of COMMAND_CENTRE_VIEWPORTS) {
    test(`planet zones, colony switch and building action work at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/?e2e=1#/planet/missing/overview');
      await expectReady(page);
      await expect(page.locator('html')).toHaveAttribute('data-shell-route-family', 'planet');
      await expect(page.locator('#planet-view')).toBeVisible();
      await expectNoPageHorizontalOverflow(page);

      // Direct zone targets stay available from the planet command centre.
      for (const zone of ZONE_TARGETS) {
        await openZone(page, zone);
        await page.locator('#planet-building-grid .planet-building-node__selector').first().click();
        await expect(page.locator('#planet-details-card .planet-primary-action')).toBeVisible();
        await expectNoPageHorizontalOverflow(page);
      }

      // Building action is reachable and produces a visible queue entry.
      await openZone(page, 'resource');
      await page.locator('#planet-building-grid .planet-building-node__selector').first().click();
      const action = page.locator('#planet-details-card .planet-primary-action');
      await expect(action).toBeEnabled();
      await action.scrollIntoViewIfNeeded();
      await action.click();
      await expect(page.locator('#planet-build-queue .planet-queue-slot.is-active')).toHaveCount(1);

      // Colony switch keeps HUD, header and route in sync.
      const secondaryId = await page.locator('html').getAttribute('data-e2e-secondary-planet-id');
      expect(secondaryId).toBeTruthy();
      const homeId = await page.locator('#hud-planet-selector').inputValue();
      const homeName = await page.locator('#planet-name').textContent();
      await page.locator('#planet-selector').selectOption(secondaryId!);
      await expect(page).toHaveURL(new RegExp(`#\\/planet\\/${encodeURIComponent(secondaryId!)}`));
      await expect(page.locator('#hud-planet-selector')).toHaveValue(secondaryId!);
      await expect(page.locator('#planet-name')).not.toHaveText(homeName ?? '');
      await expectNoPageHorizontalOverflow(page);
      await page.locator('#planet-selector').selectOption(homeId);
      await expect(page.locator('#planet-name')).toHaveText(homeName ?? '');

      // Galaxy stays a sibling context action from any planet view and the
      // canonical Planet primary destination restores the remembered context.
      await page.locator('#planet-galaxy-action').click();
      await expect(page.locator('html')).toHaveAttribute('data-shell-route-family', 'space');
      await page.locator('#nav-planet').click();
      await expect(page.locator('html')).toHaveAttribute('data-shell-route-family', 'planet');
      await expect(page.locator('#nav-planet')).toHaveAttribute('aria-current', 'page');

      // Planet workspace exposes its own visible breadcrumb path.
      const crumbs = page.locator('#planet-breadcrumbs');
      await expect(crumbs).toBeVisible();
      await expect(crumbs).toContainText(homeName ?? '');

      // Zone tabs keep roving-tabindex keyboard behaviour.
      await page.locator('[data-planet-mode="resource"]').focus();
      await page.keyboard.press('ArrowRight');
      await expect(page.locator('[data-planet-mode="industry"]')).toHaveAttribute('aria-selected', 'true');

      await expectPlanetRegionsVisible(page);
    });
  }
});
