import { expect, test } from '@playwright/test';

test('builds a source-labelled packet and survives an offline reload', async ({ page, context }) => {
  await page.goto('/');
  await page.locator('#profile-form input[name="name"]').fill('Avery Jones');
  await page.locator('#observation-form input[name="label"]').fill('Vitamin D');
  await page.locator('#observation-form input[name="value"]').fill('31');
  await page.locator('#observation-form input[name="source"]').fill('Patient portal');
  await page.locator('#observation-form button[type="submit"]').click();
  await expect(page.locator('#packet-sheet')).toContainText('Vitamin D');
  await expect(page.locator('#packet-sheet')).toContainText('Patient portal');
  await page.waitForTimeout(400); // local IndexedDB save is batched after editing
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.waitForTimeout(500); // worker receives and caches this app shell's assets
  const cachedUrls = await page.evaluate(async () => (await Promise.all((await caches.keys()).map(async key => (await caches.open(key)).keys()))).flat().map(request => request.url));
  expect(cachedUrls.some(url => url.includes('/assets/index-') && url.endsWith('.js'))).toBeTruthy();

  // Give the registered worker one controlled reload to cache built assets.
  await page.reload();
  await expect(page.locator('#packet-sheet')).toContainText('Vitamin D');
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'You’re offline.' })).toBeVisible();
});
