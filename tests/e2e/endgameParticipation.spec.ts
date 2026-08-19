import { expect, test, type Page } from '@playwright/test';

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
}

test('endgame participation closes through canonical Operations, HUD and Reports surfaces', async ({ page }) => {
  await page.goto('/?e2e=1#/operations/alliances');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page).toHaveURL(/#\/operations\/alliances$/);
  await expect(page.locator('[data-testid="endgame-participation-summary"]')).toContainText(
    'Одиночное участие разрешено',
  );

  const createForm = page.locator('[data-testid="alliance-create-form"]');
  await createForm.getByLabel('Название публичного альянса').fill('x');
  await expect(createForm.locator('[data-testid="alliance-name-feedback"]')).toHaveAttribute(
    'data-valid',
    'false',
  );
  await expect(createForm.getByRole('button', { name: 'Создать альянс' })).toBeDisabled();

  await createForm.getByLabel('Название публичного альянса').fill('Closure Solar Union');
  await expect(createForm.locator('[data-testid="alliance-name-feedback"]')).toHaveAttribute(
    'data-valid',
    'true',
  );
  await createForm.getByRole('button', { name: 'Создать альянс' }).click();
  await expect(page.locator('[data-testid="alliance-public-list"] .is-current')).toContainText(
    'Closure Solar Union',
  );

  await page.locator('[data-operations-mode="solar-war"]').click();
  await expect(page).toHaveURL(/#\/operations\/solar-war$/);
  const fleetId = await page.locator('html').getAttribute('data-e2e-solar-war-fleet-id');
  expect(fleetId).not.toBeNull();
  await page.locator('[data-testid="solar-war-fleet-select"]').selectOption(fleetId!);
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
  await expect(page.locator('[data-testid="solar-war-enter"]')).toHaveCount(0);
  await expect(page.locator('#app-status')).toHaveText('Сохранено локально');

  await page.goto('/?e2e=1#/reports/endgame');
  await expect(page).toHaveURL(/#\/reports\/endgame$/);
  await expect(page.locator('[data-report-filter="endgame"]')).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.locator('#reports-view')).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/#\/operations\/solar-war$/);
  await expect(page.locator('[data-testid="solar-war-entry"]')).toContainText(fleetId!);
  await page.goForward();
  await expect(page).toHaveURL(/#\/reports\/endgame$/);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('html')).toHaveAttribute('data-viewport-mode', 'mobile');
  await expectNoHorizontalOverflow(page);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page).toHaveURL(/#\/reports\/endgame$/);
  await expect(page.locator('html')).toHaveAttribute('data-viewport-mode', 'mobile');
  await expectNoHorizontalOverflow(page);

  await page.goto('/?e2e=1#/operations/solar-war');
  await expect(page.locator('[data-testid="solar-war-entry"]')).toContainText(fleetId!);
  await expect(page.locator('[data-testid="hud-solar-war-indicator"]')).toHaveAttribute(
    'data-active-entry',
    'true',
  );
});
