import { expect, test, type Page } from '@playwright/test';

const SOLAR_COORDINATES = [
  [23, 5], [160, -33], [296, -58], [433, -58], [554, -58], [690, -33],
  [827, 5], [316, 72], [534, 72], [-44, 139], [76, 139], [196, 139],
  [654, 139], [774, 139], [894, 139], [316, 208], [534, 208], [23, 275],
  [160, 313], [296, 338], [433, 338], [554, 338], [690, 313], [827, 275],
] as const;

async function waitForLevel(page: Page, level: string): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-space-map-level', level);
}

async function logicalCanvasClick(page: Page, x: number, y: number): Promise<void> {
  const canvas = page.locator('#phaser-game canvas');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  if (box === null) throw new Error('Phaser canvas has no bounding box.');
  await page.mouse.click(box.x + (x / 1280) * box.width, box.y + (y / 720) * box.height);
}

async function targetCoordinate(page: Page): Promise<{ galaxy: number; system: number; position: number }> {
  return page.locator('html').evaluate((element) => ({
    galaxy: Number(element.dataset.e2eTargetGalaxy),
    system: Number(element.dataset.e2eTargetSystem),
    position: Number(element.dataset.e2eTargetPosition),
  }));
}

test('new game → map target → reload-safe composer → report backlink → history', async ({ page }) => {
  await page.goto('/?e2e=1#/space/universe');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await waitForLevel(page, 'universe');
  await logicalCanvasClick(page, 718, 321);
  await expect(page).toHaveURL(/#\/space\/galaxy\/1\/page\/1$/);
  await waitForLevel(page, 'galaxy');

  const target = await targetCoordinate(page);
  await page.locator('#space-map-galaxy-input').fill(String(target.galaxy));
  await page.locator('#space-map-system-input').fill(String(target.system));
  await page.locator('#space-map-position-input').fill(String(target.position));
  await page.locator('#space-map-coordinate-form button[type="submit"]').click();
  await expect(page).toHaveURL(new RegExp(`#\\/space\\/solar\\/${target.galaxy}\\/${target.system}\\/${target.position}$`));
  await waitForLevel(page, 'solar-system');

  const [slotX, slotY] = SOLAR_COORDINATES[target.position - 1]!;
  await logicalCanvasClick(page, 155 + slotX + 60, 160 + slotY + 60);
  const details = page.locator('#space-map-selection-details');
  await expect(details).toHaveAttribute('data-intel-quality', 'fresh');
  await expect(details).toHaveAttribute('data-relation', 'hostile');
  await expect(page.locator('html')).toHaveAttribute('data-send-fleet-command-count', '0');

  await page.locator('[data-action-id="mission-scout"]').click();
  await expect(page).toHaveURL(/#\/fleets\/compose$/);
  await expect(page.locator('#fleets-view')).toBeVisible();
  await expect(page.locator('#mission-screen-dialog')).toHaveCount(0);
  await expect(page.locator('[data-testid="mission-target-notice"]')).toBeVisible();
  const targetId = await page.locator('html').getAttribute('data-e2e-target-id');
  await expect(page.locator('[data-testid="mission-target-fleet-e2e-player"]')).toHaveValue(targetId ?? '');
  await expect(page.locator('[data-shell-return="space"]')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-send-fleet-command-count', '0');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page).toHaveURL(/#\/fleets\/compose$/);
  await expect(page.locator('[data-testid="mission-target-notice"]')).toBeVisible();
  await expect(page.locator('[data-testid="mission-target-fleet-e2e-player"]')).toHaveValue(targetId ?? '');
  await expect(page.locator('[data-clear-prepared-target]')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-send-fleet-command-count', '0');

  await page.locator('[data-testid="mission-send-fleet-e2e-player"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-send-fleet-command-count', '1');
  await expect(page.locator('[data-testid="mission-target-notice"]')).toHaveCount(0);

  await page.locator('#nav-galaxy').click();
  await expect(page).toHaveURL(new RegExp(`#\\/space\\/solar\\/${target.galaxy}\\/${target.system}\\/${target.position}$`));
  await waitForLevel(page, 'solar-system');
  await expect(page.locator('#app-status')).toContainText(/Сохранено|Флот отправлен/);

  await page.locator('#nav-reports').click();
  await expect(page).toHaveURL(/#\/reports\/all$/);
  await expect(page.locator('#reports-view')).toBeVisible();
  await expect(page.locator('#mission-reports-dialog')).toHaveCount(0);
  await page.locator('[data-report-map-link="report-e2e-map-backlink"]').click();
  await expect(page).toHaveURL(new RegExp(`#\\/space\\/solar\\/${target.galaxy}\\/${target.system}\\/${target.position}$`));
  await waitForLevel(page, 'solar-system');
  await expect(page.locator('[data-shell-return="reports"]')).toBeVisible();
  await page.locator('[data-shell-return="reports"]').click();
  await expect(page).toHaveURL(/#\/reports\/all$/);
  await expect(page.locator('#reports-view')).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`#\\/space\\/solar\\/${target.galaxy}\\/${target.system}\\/${target.position}$`));
  await page.goForward();
  await expect(page).toHaveURL(/#\/reports\/all$/);

  await page.waitForTimeout(1_000);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-send-fleet-command-count', '1');
  await expect(page).toHaveURL(/#\/reports\/all$/);

  const network = await page.evaluate(() => {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const universe = entries.filter((entry) => entry.name.includes('/assets/generated/universe/'));
    return {
      count: universe.length,
      unique: new Set(universe.map((entry) => entry.name)).size,
      transfer: universe.reduce((sum, entry) => sum + (entry.transferSize || entry.encodedBodySize), 0),
      decoded: Number(document.documentElement.dataset.spaceMapDecodedBytes ?? 0),
    };
  });
  expect(network.count).toBe(network.unique);
  expect(network.transfer).toBeLessThanOrEqual(16 * 1024 * 1024);
  expect(network.decoded).toBeLessThanOrEqual(20 * 1024 * 1024);

  for (const viewport of [{ width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    const layout = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      canvas: document.querySelector('#phaser-game canvas')?.getBoundingClientRect().toJSON(),
    }));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
    expect(layout.canvas?.width ?? 0).toBeGreaterThan(0);
    expect(layout.canvas?.height ?? 0).toBeGreaterThan(0);
  }
});

test('keyboard path and reduced motion remain equivalent', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?e2e=1#/space/universe');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await waitForLevel(page, 'universe');
  await logicalCanvasClick(page, 640, 360);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/space\/galaxy\/1\/page\/1$/);
  await waitForLevel(page, 'galaxy');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/space\/solar\/1\/1\/1$/);
  await waitForLevel(page, 'solar-system');
  await expect(page.locator('html')).toHaveAttribute('data-space-map-transition-ms', '0');
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/#\/space\/galaxy\/1\/page\/1$/);
});
