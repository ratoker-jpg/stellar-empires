import { expect, test, type Page } from '@playwright/test';

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
}

test('Empire Overview exposes colony roles, health and resource flow at release viewports', async ({ page }) => {
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/?e2e=1#/command/overview');
    await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
    await expect(page.locator('#command-overview-view')).toBeVisible();
    await expect(page.locator('.empire-overview-summary')).toBeVisible();
    await expect(page.locator('.empire-resource-grid > div')).toHaveCount(3);
    await expect(page.locator('.empire-colony-card')).toHaveCount(2);
    await expect(page.locator('.empire-colony-role').first()).toContainText('Роль:');
    await expect(page.locator('.empire-colony-flow').first()).toBeVisible();
    await expect(page.locator('.empire-colony-flow [data-resource-id]')).toHaveCount(6);
    await expect(page.locator('.empire-health-list').first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});
