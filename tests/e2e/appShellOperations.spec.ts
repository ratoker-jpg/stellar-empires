import { expect, test, type Page } from '@playwright/test';

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
}

const LEGACY_TOP_LEVEL_DIALOGS = [
  '#mission-screen-dialog',
  '#operations-workspace-dialog',
  '#mission-reports-dialog',
  '#galaxy-intel-dialog',
  '#expedition-dialog',
  '#space-objects-dialog',
  '#world-events-dialog',
] as const;

test('Fleet, Operations and Reports are canonical routed workspaces', async ({ page }) => {
  await page.goto('/?e2e=1#/fleets/overview');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');

  await expect(page.locator('#fleets-view')).toBeVisible();
  await expect(page.locator('#nav-fleet')).toHaveAttribute('aria-current', 'page');
  for (const selector of LEGACY_TOP_LEVEL_DIALOGS) {
    await expect(page.locator(selector)).toHaveCount(0);
  }
  await expect(page.locator('#nav-expeditions, #nav-space-objects, #nav-world-events')).toHaveCount(0);
  for (const id of ['nav-fleet', 'nav-operations', 'nav-reports']) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }

  for (const mode of ['compose', 'active', 'battles', 'overview'] as const) {
    await page.locator(`[data-fleet-mode="${mode}"]`).click();
    await expect(page).toHaveURL(new RegExp(`#\\/fleets\\/${mode}$`));
    await expect(page.locator('html')).toHaveAttribute('data-fleet-route-mode', mode);
    await expect(page.locator(`[data-fleet-mode="${mode}"]`)).toHaveAttribute('aria-selected', 'true');
  }

  await page.locator('#nav-operations').click();
  await expect(page).toHaveURL(/#\/operations\/overview$/);
  await expect(page.locator('#operations-view')).toBeVisible();
  await expect(page.locator('.galaxy-intel-workspace')).toBeVisible();
  for (const mode of ['expeditions', 'objects', 'events', 'market', 'logistics', 'overview'] as const) {
    await page.locator(`[data-operations-mode="${mode}"]`).click();
    await expect(page).toHaveURL(new RegExp(`#\\/operations\\/${mode}$`));
    await expect(page.locator('html')).toHaveAttribute('data-operations-route-mode', mode);
    await expect(page.locator(`[data-operations-mode="${mode}"]`)).toHaveAttribute('aria-selected', 'true');
  }

  await page.locator('#nav-reports').click();
  await expect(page).toHaveURL(/#\/reports\/all$/);
  await expect(page.locator('#reports-view')).toBeVisible();
  for (const filter of ['combat', 'expedition', 'object', 'event', 'all'] as const) {
    await page.locator(`[data-report-filter="${filter}"]`).click();
    await expect(page).toHaveURL(new RegExp(`#\\/reports\\/${filter}$`));
    await expect(page.locator('html')).toHaveAttribute('data-report-route-filter', filter);
    await expect(page.locator(`[data-report-filter="${filter}"]`)).toHaveAttribute('aria-selected', 'true');
  }

  await page.goBack();
  await expect(page).toHaveURL(/#\/reports\/event$/);
  await page.goForward();
  await expect(page).toHaveURL(/#\/reports\/all$/);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page).toHaveURL(/#\/reports\/all$/);
  await expect(page.locator('html')).toHaveAttribute('data-report-route-filter', 'all');
  await expect(page.locator('#reports-view')).toBeVisible();
});

test('target handoff is presentation-only and repeated activation does not duplicate UI', async ({ page }) => {
  await page.goto('/?e2e=1#/operations/overview');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-send-fleet-command-count', '0');

  const detail = {
    targetId: 'planet-e2e-target',
    label: 'Тестовая цель',
    mission: 'scout',
    source: 'galaxy-intel',
  };
  await page.evaluate((target) => {
    window.dispatchEvent(new CustomEvent('stellar:fleet-mission-target', { detail: target }));
    window.dispatchEvent(new CustomEvent('stellar:fleet-mission-target', { detail: target }));
  }, detail);

  await expect(page).toHaveURL(/#\/fleets\/compose$/);
  await expect(page.locator('#fleets-view')).toBeVisible();
  await expect(page.locator('[data-testid="mission-target-notice"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="mission-target-notice"]')).toContainText('Тестовая цель');
  await expect(page.locator('html')).toHaveAttribute('data-send-fleet-command-count', '0');
  await expect(page.locator('#mission-screen-dialog')).toHaveCount(0);
});

test('operation workspaces fit release viewports', async ({ page }) => {
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    for (const route of [
      '#/fleets/compose',
      '#/operations/overview',
      '#/operations/objects',
      '#/operations/market',
      '#/operations/logistics',
      '#/reports/all',
    ]) {
      await page.goto(`/?e2e=1${route}`);
      await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
      await expectNoHorizontalOverflow(page);
    }
  }
});
