// 08-02 browser validation for sparkline rendering
// Run with: npx playwright test verify-sparkline-08-02.spec.js --reporter=list
import { test, expect } from '@playwright/test';

async function login(page) {
  await page.goto('/login');
  const emailInput = page.locator('input[type="email"]');
  if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await emailInput.fill('test@example.com');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  } else {
    await page.goto('/dashboard');
  }
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

test.use({
  baseURL: 'http://localhost:3000',
});

test('sparkline renders on daily dashboard', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard?period=last-month');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const containerCount = await page.locator('.recharts-responsive-container').count();
  expect(containerCount).toBeGreaterThanOrEqual(9);

  await page.screenshot({ path: '.playwright-mcp/verify-08-02-daily.png' });
});

test('sparkline renders on weekly dashboard', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard?tab=weekly&period=this-month');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const containerCount = await page.locator('.recharts-responsive-container').count();
  expect(containerCount).toBeGreaterThanOrEqual(9);

  await page.screenshot({ path: '.playwright-mcp/verify-08-02-weekly.png' });
});

test('theme switch keeps chart containers mounted', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard?period=last-month');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  await page.screenshot({ path: '.playwright-mcp/verify-08-02-light.png' });

  const buttons = await page.locator('button').all();
  for (const btn of buttons) {
    const html = await btn.innerHTML();
    if (html.includes('sun') || html.includes('moon')) {
      await btn.click();
      await page.waitForTimeout(1000);
      break;
    }
  }

  await page.screenshot({ path: '.playwright-mcp/verify-08-02-dark.png' });

  const darkContainerCount = await page.locator('.recharts-responsive-container').count();
  expect(darkContainerCount).toBeGreaterThanOrEqual(9);
});
