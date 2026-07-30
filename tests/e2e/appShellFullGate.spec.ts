import { expect, test, type Page } from '@playwright/test';

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
}

const LEGACY_DOM = [
  '#empire-overview-dialog',
  '#command-ranking-dialog',
  '#command-doctrine-dialog',
  '#fleet-doctrine-dialog',
  '#save-manager-dialog',
  '#mission-screen-dialog',
  '#operations-workspace-dialog',
  '#mission-reports-dialog',
  '#faction-preview-dialog',
  '#aegis-atlas-dialog',
  '#nav-command-doctrine',
  '#nav-fleet-doctrine',
] as const;

test('new campaign exposes immutable compressed duration expectations at release viewports', async ({ page }) => {
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const dialog = page.locator('.new-game-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[data-progression-profile="compressed-v1"]')).toBeVisible();
    const duration = dialog.locator('[data-campaign-duration-expectation="true"]');
    await expect(duration).toContainText('ориентир 12 ч · максимум 16 ч');
    await dialog.locator('.new-game-setting__select').nth(1).selectOption('10');
    await expect(duration).toContainText('ориентир 2,4 ч · максимум 3,2 ч');
    await expect(dialog).toContainText('Финальная победа и работа Врат пока не входят');
    await expectNoHorizontalOverflow(page);
  }
});

test('complete primary shell routes are canonical, grouped and modal-free', async ({ page }) => {
  await page.goto('/?e2e=1#/command/overview');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');

  await expect(page.locator('#command-view')).toBeVisible();
  await expect(page.locator('#command-overview-view')).toBeVisible();
  await expect(page.locator('#nav-empire')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.side-rail .rail-button')).toHaveCount(9);
  await expect(page.locator('.side-rail .rail-group')).toHaveCount(4);
  await expect(page.locator('.side-rail')).toHaveAttribute('data-active-group', 'development');
  await expect(page.locator('html')).toHaveAttribute('data-shell-navigation-group', 'development');
  await expect(page.locator('[data-navigation-group="development"]')).toHaveClass(/is-active/);
  await expect(page.locator('#nav-galaxy')).toContainText('Вселенная');
  await expect(page.locator('#nav-operations')).toHaveAttribute('data-shell-navigation-group', 'gameplay');
  await expect(page.locator('#nav-operations')).not.toHaveClass(/rail-button--utility/);
  for (const selector of LEGACY_DOM) await expect(page.locator(selector)).toHaveCount(0);
  await expect(page.locator('.runtime-showcase')).toHaveCount(0);

  for (const mode of ['doctrine', 'fleet-doctrine', 'upgrades', 'overview'] as const) {
    await page.locator(`[data-command-mode="${mode}"]`).click();
    await expect(page).toHaveURL(new RegExp(`#\\/command\\/${mode}$`));
    await expect(page.locator('html')).toHaveAttribute('data-command-route-mode', mode);
    await expect(page.locator(`[data-command-mode="${mode}"]`)).toHaveAttribute('aria-selected', 'true');
  }

  await page.locator('#nav-operations').click();
  await expect(page).toHaveURL(/#\/operations\/overview$/);
  await expect(page.locator('.side-rail')).toHaveAttribute('data-active-group', 'gameplay');
  await expect(page.locator('[data-navigation-group="gameplay"]')).toHaveClass(/is-active/);

  await page.locator('#nav-rating').click();
  await expect(page).toHaveURL(/#\/ranking$/);
  await expect(page.locator('#ranking-view')).toBeVisible();
  await expect(page.locator('#ranking-list-view .command-ranking-entry').first()).toBeVisible();
  await expect(page.locator('#shell-context-content')).toContainText('Место');
  await expect(page.locator('.side-rail')).toHaveAttribute('data-active-group', 'information');

  await page.locator('#nav-system').click();
  await expect(page).toHaveURL(/#\/system\/saves$/);
  await expect(page.locator('#system-view')).toBeVisible();
  await expect(page.locator('#system-saves-view')).toBeVisible();
  await expect(page.locator('.save-manager-controls')).toBeVisible();
  await expect(page.locator('.side-rail')).toHaveAttribute('data-active-group', 'utility');
  await page.locator('[data-system-mode="settings"]').click();
  await expect(page).toHaveURL(/#\/system\/settings$/);
  await expect(page.locator('#system-settings-view')).toBeVisible();
  await page.locator('[name="compact-layout"]').check();
  await expect(page.locator('html')).toHaveAttribute('data-ui-density', 'compact');
  await page.locator('[name="reduce-motion"]').check();
  await expect(page.locator('html')).toHaveAttribute('data-motion-preference', 'reduce');
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');

  await page.goBack();
  await expect(page).toHaveURL(/#\/system\/saves$/);
  await page.goForward();
  await expect(page).toHaveURL(/#\/system\/settings$/);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page).toHaveURL(/#\/system\/settings$/);
  await expect(page.locator('#system-settings-view')).toBeVisible();
  await expect(page.locator('[name="compact-layout"]')).toBeChecked();
  await expect(page.locator('[name="reduce-motion"]')).toBeChecked();
});

test('keyboard navigation follows the visible hierarchy and activates local routes', async ({ page }) => {
  await page.goto('/?e2e=1#/command/overview');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');

  await page.locator('#nav-planet').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#nav-galaxy')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/space\/universe$/);
  await expect(page.locator('#galaxy-view')).toBeVisible();

  await page.locator('#nav-galaxy').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#nav-fleet')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/fleets\/overview$/);
  await expect(page.locator('#fleets-view [data-shell-heading]')).toBeFocused();

  await page.locator('#nav-empire').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/command\/overview$/);
  await expect(page.locator('#command-view [data-shell-heading]')).toBeFocused();
  await page.locator('[data-command-mode="overview"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/#\/command\/doctrine$/);
  await expect(page.locator('[data-command-mode="doctrine"]')).toHaveAttribute('aria-selected', 'true');
  await page.locator('[data-command-mode="doctrine"]').focus();
  await page.keyboard.press('End');
  await expect(page).toHaveURL(/#\/command\/upgrades$/);
});

test('complete HUD and every primary route fit release viewports', async ({ page }) => {
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/?e2e=1#/research');
    await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
    const planetId = await page.locator('#hud-planet-selector').inputValue();
    for (const route of [
      `#/planet/${encodeURIComponent(planetId)}/overview`,
      '#/space/universe',
      '#/fleets/overview',
      '#/operations/overview',
      '#/research',
      '#/command/overview',
      '#/reports/all',
      '#/ranking',
      '#/system/settings',
    ]) {
      await page.goto(`/?e2e=1${route}`);
      await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
      await expect(page.locator('#hud-population')).toHaveAttribute('data-warning-level', /normal|warning|danger|critical/);
      await expect(page.locator('#hud-hangar')).toHaveAttribute('data-warning-level', /normal|warning|danger|critical/);
      await expect(page.locator('#hud-population-state')).not.toHaveText('');
      await expect(page.locator('#hud-hangar-state')).not.toHaveText('');
      await expect(page.locator('#shell-context-content')).not.toHaveText('');
      await expect(page.locator('.side-rail .rail-button')).toHaveCount(9);
      await expectNoHorizontalOverflow(page);
    }
  }
});
