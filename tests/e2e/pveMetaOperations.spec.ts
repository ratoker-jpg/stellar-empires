import { expect, test } from '@playwright/test';

async function expectArenaWorkspace(page: import('@playwright/test').Page): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page).toHaveURL(/#\/operations\/arena$/);
  await expect(page.locator('[data-operations-mode="arena"]')).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByTestId('pve-reputation-card')).toBeVisible();
  await expect(page.getByTestId('arena-challenge-patrol')).toBeVisible();
  await expect(page.getByTestId('arena-challenge-assault')).toBeVisible();
  await expect(page.getByTestId('arena-challenge-elite')).toBeVisible();
  await expect(page.getByText('Точные начисления')).toBeVisible();
}

test('PvE meta Operations route survives reload and browser history', async ({ page }) => {
  await page.goto('/?e2e=1#/operations/arena');
  await expectArenaWorkspace(page);

  await page.reload();
  await expectArenaWorkspace(page);

  await page.locator('[data-operations-mode="events"]').click();
  await expect(page).toHaveURL(/#\/operations\/events$/);
  await page.goBack();
  await expectArenaWorkspace(page);
});

test('PvE meta Operations remains usable on the release mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?e2e=1#/operations/arena');
  await expectArenaWorkspace(page);

  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth + 1);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.getByTestId('arena-challenge-patrol')).toBeVisible();
});
