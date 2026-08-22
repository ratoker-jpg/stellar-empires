import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const QUALITY_VIEWPORT = { width: 1366, height: 768 } as const;

async function openStableEmpireOverview(page: Page): Promise<void> {
  await page.setViewportSize(QUALITY_VIEWPORT);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?e2e=1#/command/overview');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page.locator('#command-overview-view')).toBeVisible();
  await expect(page.locator('.empire-colony-card')).toHaveCount(2);
}

test('empire overview has no WCAG A/AA automated accessibility violations', async ({ page }) => {
  await openStableEmpireOverview(page);

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  expect(
    results.violations,
    JSON.stringify(
      results.violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map((node) => node.target) })),
      null,
      2,
    ),
  ).toEqual([]);
});
