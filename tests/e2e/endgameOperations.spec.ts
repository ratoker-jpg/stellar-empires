import { expect, test, type Page } from '@playwright/test';

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
}

test('alliance and Solar War actions use canonical Operations routes and survive reload', async ({ page }) => {
  await page.goto('/?e2e=1#/operations/alliances');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page).toHaveURL(/#\/operations\/alliances$/);
  await expect(page.locator('[data-operations-mode="alliances"]')).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.locator('[data-testid="endgame-participation-summary"]')).toContainText(
    'участвует самостоятельно',
  );
  await expect(page.locator('[data-testid="endgame-participation-summary"]')).toContainText(
    'Одиночное участие разрешено',
  );

  const createForm = page.locator('[data-testid="alliance-create-form"]');
  await createForm.getByLabel('Название публичного альянса').fill('E2E Solar Union');
  await expect(createForm.locator('[data-testid="alliance-name-feedback"]')).toHaveAttribute(
    'data-valid',
    'true',
  );
  await createForm.getByRole('button', { name: 'Создать альянс' }).click();
  await expect(page.locator('[data-testid="alliance-public-list"] .is-current')).toContainText(
    'E2E Solar Union',
  );

  await page.locator('[data-operations-mode="solar-war"]').click();
  await expect(page).toHaveURL(/#\/operations\/solar-war$/);
  await expect(page.locator('[data-testid="solar-war-cycle"]')).toBeVisible();
  await expect(page.locator('[data-testid="solar-war-entry"]')).toContainText(
    'E2E Solar Union',
  );
  const fleetId = await page.locator('html').getAttribute('data-e2e-solar-war-fleet-id');
  expect(fleetId).not.toBeNull();
  const fleetSelect = page.locator('[data-testid="solar-war-fleet-select"]');
  await fleetSelect.selectOption(fleetId!);
  await expect(page.locator('[data-testid="solar-war-entry-feedback"]')).toHaveAttribute(
    'data-valid',
    'true',
  );
  await page.locator('[data-testid="solar-war-enter"]').click();
  await expect(page.locator('[data-testid="solar-war-entry"]')).toContainText(fleetId!);
  await expect(page.locator('[data-testid="hud-solar-war-indicator"]')).toHaveAttribute(
    'data-active-entry',
    'true',
  );
  await expect(page.locator('#app-status')).toHaveText('Сохранено локально');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page).toHaveURL(/#\/operations\/solar-war$/);
  await expect(page.locator('[data-testid="solar-war-entry"]')).toContainText(fleetId!);
  await expect(page.locator('[data-testid="hud-solar-war-indicator"]')).toHaveAttribute(
    'data-active-entry',
    'true',
  );

  await page.locator('[data-operations-mode="alliances"]').click();
  await page.locator('[data-testid="alliance-leave"]').click();
  await expect(page.locator('[data-testid="endgame-participation-summary"]')).toContainText(
    'участвует самостоятельно',
  );
  await expect(page.locator('#app-status')).toHaveText('Сохранено локально');

  await page.locator('[data-operations-mode="solar-war"]').click();
  await expect(page.locator('[data-testid="solar-war-entry"]')).toContainText(fleetId!);
  await page.goBack();
  await expect(page).toHaveURL(/#\/operations\/alliances$/);
  await page.goForward();
  await expect(page).toHaveURL(/#\/operations\/solar-war$/);
});

test('endgame Reports filter and Operations surfaces remain responsive and reduced-motion safe', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    for (const route of [
      '#/operations/alliances',
      '#/operations/solar-war',
      '#/reports/endgame',
    ]) {
      await page.goto(`/?e2e=1${route}`);
      await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
      await expectNoHorizontalOverflow(page);
    }
  }

  await expect(page).toHaveURL(/#\/reports\/endgame$/);
  await expect(page.locator('[data-report-filter="endgame"]')).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.locator('#reports-view')).toBeVisible();
});
