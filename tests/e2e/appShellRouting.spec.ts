import { expect, test } from '@playwright/test';

test('Planet and Space routes restore through URL, history, breadcrumbs and reload', async ({ page }) => {
  await page.goto('/?e2e=1#/planet/missing/industry');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-shell-route-family', 'planet');
  await expect(page).toHaveURL(/#\/planet\/[^/]+\/overview$/);
  await expect(page.locator('html')).toHaveAttribute('data-shell-normalization-code', 'STALE_COLONY_CONTEXT');
  await expect(page.locator('#planet-view')).toBeVisible();
  await expect(page.locator('#galaxy-view')).toBeHidden();

  await page.locator('[data-planet-mode="industry"]').click();
  await expect(page).toHaveURL(/#\/planet\/[^/]+\/industry$/);
  await expect(page.locator('[data-planet-mode="industry"]')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#shell-breadcrumbs')).toContainText('Промышленная зона');

  await page.locator('#nav-galaxy').click();
  await expect(page).toHaveURL(/#\/space\/universe$/);
  await expect(page.locator('html')).toHaveAttribute('data-shell-route-family', 'space');
  await expect(page.locator('#galaxy-view')).toBeVisible();
  await expect(page.locator('#planet-view')).toBeHidden();
  await expect(page.locator('[data-shell-return="planet"]')).toContainText('Промышленная зона');

  await page.locator('#nav-planet').click();
  await expect(page).toHaveURL(/#\/planet\/[^/]+\/industry$/);
  await expect(page.locator('html')).toHaveAttribute('data-shell-route-family', 'planet');
  await expect(page.locator('[data-planet-mode="industry"]')).toHaveAttribute('aria-selected', 'true');

  await page.goBack();
  await expect(page).toHaveURL(/#\/space\/universe$/);
  await expect(page.locator('#galaxy-view')).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/#\/planet\/[^/]+\/industry$/);
  await expect(page.locator('#planet-view')).toBeVisible();

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-shell-route-family', 'planet');
  await expect(page).toHaveURL(/#\/planet\/[^/]+\/industry$/);
  await expect(page.locator('[data-planet-mode="industry"]')).toHaveAttribute('aria-selected', 'true');
});

test('primary family activation restores the latest valid subroute', async ({ page }) => {
  await page.goto('/?e2e=1#/operations/logistics');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page.locator('[data-operations-mode="logistics"]')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#shell-breadcrumbs')).toContainText('Логистика');

  await page.locator('#nav-reports').click();
  await expect(page).toHaveURL(/#\/reports\/all$/);
  await expect(page.locator('[data-shell-return="operations"]')).toContainText('Логистика');

  await page.locator('#nav-operations').click();
  await expect(page).toHaveURL(/#\/operations\/logistics$/);
  await expect(page.locator('[data-operations-mode="logistics"]')).toHaveAttribute('aria-selected', 'true');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page).toHaveURL(/#\/operations\/logistics$/);
  await expect(page.locator('[data-operations-mode="logistics"]')).toHaveAttribute('aria-selected', 'true');
});

test('the typed registry exposes grouped primary controls and visible keyboard order', async ({ page }) => {
  await page.goto('/?e2e=1#/space/universe');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  const ids = await page.locator('.side-rail [data-shell-screen]').evaluateAll((buttons) =>
    buttons.map((button) => button.id),
  );
  expect(ids).toEqual([
    'nav-planet',
    'nav-galaxy',
    'nav-fleet',
    'nav-operations',
    'nav-research',
    'nav-empire',
    'nav-reports',
    'nav-rating',
    'nav-system',
  ]);
  await expect(page.locator('.side-rail')).toHaveAttribute('data-active-group', 'gameplay');
  await page.locator('#nav-galaxy').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#nav-planet')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#nav-galaxy')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#nav-fleet')).toBeFocused();
});
