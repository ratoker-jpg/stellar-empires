import { expect, test, type Page } from '@playwright/test';

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
}

test('intelligence reports route is canonical, private and checksum-neutral', async ({ page }) => {
  await page.goto('/?e2e=1#/reports/intelligence');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  const checksum = await page.locator('html').getAttribute('data-state-checksum');

  await expect(page).toHaveURL(/#\/reports\/intelligence$/);
  await expect(page.locator('#reports-view')).toBeVisible();
  await expect(page.locator('[data-report-filter="intelligence"]')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-report-id="intelligence-observation-intel-e2e-target"]')).toBeVisible();
  await expect(page.locator('[data-report-id="intelligence-observation-intel-e2e-target"]')).toContainText('Разведка планеты');

  const incoming = page.locator('[data-incoming-contact-id="incoming-fleet-e2e-incoming"]');
  await expect(incoming).toBeVisible();
  await expect(incoming).toContainText('Неизвестный контакт');
  await expect(incoming).toContainText('ETA');
  await expect(incoming).not.toContainText('Источник:');
  await expect(incoming).not.toContainText('Атака');
  await expect(incoming.locator('p')).toHaveCount(1);

  await page.locator('[data-report-filter="intelligence"]').focus();
  await page.keyboard.press('Home');
  await expect(page).toHaveURL(/#\/reports\/all$/);
  await page.locator('[data-report-filter="all"]').focus();
  await page.keyboard.press('End');
  await expect(page).toHaveURL(/#\/reports\/intelligence$/);

  const galaxy = await page.locator('html').getAttribute('data-e2e-target-galaxy');
  const system = await page.locator('html').getAttribute('data-e2e-target-system');
  const position = await page.locator('html').getAttribute('data-e2e-target-position');
  await page.locator('[data-report-map-link="intelligence-observation-intel-e2e-target"]').click();
  await expect(page).toHaveURL(new RegExp(`#\\/space\\/solar\\/${galaxy}\\/${system}\\/${position}$`));
  await page.goBack();
  await expect(page).toHaveURL(/#\/reports\/intelligence$/);
  await expect(page.locator('html')).toHaveAttribute('data-state-checksum', checksum ?? '');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page).toHaveURL(/#\/reports\/intelligence$/);
  await expect(page.locator('[data-report-filter="intelligence"]')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-state-checksum', checksum ?? '');
});

test('intelligence presentation fits release viewports', async ({ page }) => {
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/?e2e=1#/reports/intelligence');
    await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
    await expect(page.locator('.incoming-intelligence-section')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});
