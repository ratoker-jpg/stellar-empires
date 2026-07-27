import { expect, test } from '@playwright/test';

test('Planet and Space routes restore through URL, history and reload', async ({ page }) => {
  await page.goto('/?e2e=1#/planet/missing/industry');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-shell-route-family', 'planet');
  await expect(page).toHaveURL(/#\/planet\/[^/]+\/overview$/);
  await expect(page.locator('#planet-view')).toBeVisible();
  await expect(page.locator('#galaxy-view')).toBeHidden();
  const initialChecksum = await page.locator('html').getAttribute('data-state-checksum');

  await page.locator('[data-planet-mode="industry"]').click();
  await expect(page).toHaveURL(/#\/planet\/[^/]+\/industry$/);
  await expect(page.locator('[data-planet-mode="industry"]')).toHaveAttribute('aria-selected', 'true');

  await page.locator('#nav-galaxy').click();
  await expect(page).toHaveURL(/#\/space\/universe$/);
  await expect(page.locator('html')).toHaveAttribute('data-shell-route-family', 'space');
  await expect(page.locator('#galaxy-view')).toBeVisible();
  await expect(page.locator('#planet-view')).toBeHidden();

  await page.locator('#nav-planet').click();
  await expect(page).toHaveURL(/#\/planet\/[^/]+\/overview$/);
  await expect(page.locator('html')).toHaveAttribute('data-shell-route-family', 'planet');

  await page.goBack();
  await expect(page).toHaveURL(/#\/space\/universe$/);
  await expect(page.locator('#galaxy-view')).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/#\/planet\/[^/]+\/overview$/);
  await expect(page.locator('#planet-view')).toBeVisible();

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-shell-route-family', 'planet');
  await expect(page).toHaveURL(/#\/planet\/[^/]+\/overview$/);
  await expect(page.locator('html')).toHaveAttribute('data-state-checksum', initialChecksum ?? '');
});

test('the typed registry exposes stable primary controls and keyboard order', async ({ page }) => {
  await page.goto('/?e2e=1#/space/universe');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  const ids = await page.locator('.side-rail > .rail-button').evaluateAll((buttons) =>
    buttons.map((button) => button.id),
  );
  expect(ids.slice(0, 6)).toEqual([
    'nav-planet',
    'nav-fleet',
    'nav-galaxy',
    'nav-research',
    'nav-empire',
    'nav-rating',
  ]);
  await page.locator('#nav-galaxy').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#nav-fleet')).toBeFocused();
});
