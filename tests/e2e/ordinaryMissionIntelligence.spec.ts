import { expect, test } from '@playwright/test';

const BOT_GATE_TIMEOUT = 45_000;

test('ordinary mission intelligence bot gate is deterministic through save and attack', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/?e2e=1&botGate=1#/reports/intelligence');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');

  await expect(page.locator('html')).toHaveAttribute(
    'data-e2e-bot-gate-scout-reason',
    'mission-scout-selected',
    { timeout: BOT_GATE_TIMEOUT },
  );
  await expect(page.locator('html')).toHaveAttribute(
    'data-e2e-bot-gate-attack-reason',
    'mission-attack-selected',
  );
  await expect(page.locator('html')).toHaveAttribute('data-e2e-bot-gate-observation-level', '3');
  await expect(page.locator('html')).toHaveAttribute('data-e2e-bot-gate-schema-version', '20');
  await expect(page.locator('html')).toHaveAttribute('data-e2e-bot-gate-deterministic', 'true');
  const gateChecksum = await page.locator('html').getAttribute('data-e2e-bot-gate-checksum');
  expect(gateChecksum).toMatch(/^[0-9a-f]{8}$/);

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page).toHaveURL(/#\/reports\/intelligence$/);
  await expect(page.locator('html')).toHaveAttribute(
    'data-e2e-bot-gate-checksum',
    gateChecksum ?? '',
    { timeout: BOT_GATE_TIMEOUT },
  );
});
