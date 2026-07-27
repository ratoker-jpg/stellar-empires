import { expect, test } from '@playwright/test';

test('ordinary mission intelligence bot gate is deterministic through save and attack', async ({ page }) => {
  await page.goto('/?e2e=1#/reports/intelligence');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  const checksum = await page.locator('html').getAttribute('data-state-checksum');
  const gateChecksum = await page.locator('html').getAttribute('data-e2e-bot-gate-checksum');

  await expect(page.locator('html')).toHaveAttribute(
    'data-e2e-bot-gate-scout-reason',
    'mission-scout-selected',
  );
  await expect(page.locator('html')).toHaveAttribute(
    'data-e2e-bot-gate-attack-reason',
    'mission-attack-selected',
  );
  await expect(page.locator('html')).toHaveAttribute('data-e2e-bot-gate-observation-level', '3');
  await expect(page.locator('html')).toHaveAttribute('data-e2e-bot-gate-schema-version', '14');
  await expect(page.locator('html')).toHaveAttribute('data-e2e-bot-gate-deterministic', 'true');
  expect(gateChecksum).toMatch(/^[0-9a-f]{8}$/);

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-state-checksum', checksum ?? '');
  await expect(page.locator('html')).toHaveAttribute(
    'data-e2e-bot-gate-checksum',
    gateChecksum ?? '',
  );
});
