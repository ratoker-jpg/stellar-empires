import { expect, test } from '@playwright/test';

const REPORT_ID = 'report-e2e-map-backlink';

test('planet destruction report preserves evidence and its map backlink', async ({ page }) => {
  await page.goto('/?e2e=1#/reports/combat');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');

  const card = page.locator(`[data-report-id="${REPORT_ID}"]`);
  await expect(card).toBeVisible();
  const siege = card.locator('.mission-demolition-details');
  await expect(siege).toBeVisible();
  await expect(siege.locator('summary')).toContainText('уничтожена');
  await siege.locator('summary').click();
  await expect(siege.locator('h4')).toHaveText('Планета уничтожена');
  await expect(siege).toContainText('итог 3%');

  const galaxy = await page.locator('html').getAttribute('data-e2e-target-galaxy');
  const system = await page.locator('html').getAttribute('data-e2e-target-system');
  const position = await page.locator('html').getAttribute('data-e2e-target-position');
  await card.locator(`[data-report-map-link="${REPORT_ID}"]`).click();
  await expect(page).toHaveURL(
    new RegExp(`#\\/space\\/solar\\/${galaxy}\\/${system}\\/${position}$`),
  );

  await page.goBack();
  await expect(page).toHaveURL(/#\/reports\/combat$/);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page.locator(`[data-report-id="${REPORT_ID}"] .mission-demolition-details`)).toBeVisible();
});
