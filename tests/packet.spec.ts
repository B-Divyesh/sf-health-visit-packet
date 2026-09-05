import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const addResult = async (page: import('@playwright/test').Page, label = 'Vitamin D') => {
  await page.locator('#observation-form input[name="label"]').fill(label);
  await page.locator('#observation-form input[name="value"]').fill('31');
  await page.locator('#observation-form input[name="source"]').fill('Patient portal');
  await page.locator('#observation-form button[type="submit"]').click();
};

test('builds a source-labelled packet and survives an offline reload', async ({ page, context }) => {
  await page.goto('/');
  await page.locator('#profile-form input[name="name"]').fill('Avery Jones');
  await addResult(page);
  await expect(page.locator('#packet-sheet')).toContainText('Vitamin D');
  await expect(page.locator('#packet-sheet')).toContainText('Patient portal');
  await page.waitForTimeout(400);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.waitForTimeout(500);
  const cachedUrls = await page.evaluate(async () => (await Promise.all((await caches.keys()).map(async key => (await caches.open(key)).keys()))).flat().map(request => request.url));
  expect(cachedUrls.some(url => url.includes('/assets/index-') && url.endsWith('.js'))).toBeTruthy();
  await page.reload();
  await expect(page.locator('#packet-sheet')).toContainText('Vitamin D');
  await page.waitForTimeout(300);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Bring one clear page to your appointment' })).toBeVisible();
  await expect(page.locator('#packet-sheet')).toContainText('Vitamin D');
  await expect(page.locator('#offline')).toBeVisible();
});

test('removals are reversible and the restored item remains saved', async ({ page }) => {
  await page.goto('/');
  await addResult(page, 'Blood pressure');
  await page.getByRole('button', { name: 'Remove Blood pressure' }).click();
  await expect(page.locator('#packet-sheet')).not.toContainText('Blood pressure');
  await expect(page.locator('#notice')).toContainText('Entry removed from your packet.');
  await page.getByRole('button', { name: 'Undo removal' }).click();
  await expect(page.locator('#packet-sheet')).toContainText('Blood pressure');
  await expect(page.locator('#notice')).toContainText('Entry restored.');

  await page.locator('summary').filter({ hasText: 'Medicines' }).click();
  await page.locator('#medication-form input[name="name"]').fill('Atorvastatin');
  await page.locator('#medication-form input[name="dose"]').fill('10 mg');
  await page.locator('#medication-form input[name="source"]').fill('Bottle');
  await page.getByRole('button', { name: 'Add medicine' }).click();
  await page.getByRole('button', { name: 'Remove Atorvastatin' }).click();
  await page.getByRole('button', { name: 'Undo removal' }).click();
  await expect(page.locator('#packet-sheet')).toContainText('Atorvastatin');

  await page.locator('summary').filter({ hasText: 'Questions' }).click();
  await page.locator('#question-form textarea[name="question"]').fill('Should the dose change?');
  await page.getByRole('button', { name: 'Add question' }).click();
  await page.getByRole('button', { name: 'Remove question 1' }).click();
  await page.getByRole('button', { name: 'Undo removal' }).click();
  await expect(page.locator('#packet-sheet')).toContainText('Should the dose change?');
  await page.waitForTimeout(350);
  await page.reload();
  await expect(page.locator('#packet-sheet')).toContainText('Blood pressure');
  await expect(page.locator('#packet-sheet')).toContainText('Atorvastatin');
  await expect(page.locator('#packet-sheet')).toContainText('Should the dose change?');
});

test('encrypted export hides health text and restores with the correct passphrase', async ({ page }) => {
  await page.goto('/');
  await addResult(page, 'Private observation');
  await page.getByRole('button', { name: 'Download encrypted bundle' }).click();
  await page.locator('#bundle-form input[name="passphrase"]').fill('short');
  await page.getByRole('button', { name: 'Encrypt and download' }).click();
  await expect(page.locator('#bundle-dialog')).toBeVisible();
  expect(await page.locator('#bundle-form input[name="passphrase"]').evaluate((input: HTMLInputElement) => input.validity.tooShort)).toBe(true);
  await page.locator('#bundle-form input[name="passphrase"]').fill('correct horse battery');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Encrypt and download' }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const encryptedText = await readFile(downloadPath!, 'utf8');
  expect(encryptedText).not.toContain('Private observation');

  await page.getByRole('button', { name: 'Remove Private observation' }).click();
  await page.locator('#import-file').setInputFiles(downloadPath!);
  await page.locator('#restore-form input[name="passphrase"]').fill('wrong passphrase');
  await page.getByRole('button', { name: 'Restore and replace this packet' }).click();
  await expect(page.locator('#restore-error')).toContainText('Check the passphrase and file');
  await page.emulateMedia({ colorScheme: 'dark' });
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations).toEqual([]);
  await page.locator('#restore-form input[name="passphrase"]').fill('correct horse battery');
  await page.getByRole('button', { name: 'Restore and replace this packet' }).click();
  await expect(page.locator('#packet-sheet')).toContainText('Private observation');
});

test('dialog close controls bypass required-field validation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Download encrypted bundle' }).click();
  await expect(page.locator('#bundle-dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close encrypted backup' }).click();
  await expect(page.locator('#bundle-dialog')).not.toBeVisible();
  await page.locator('#import-file').setInputFiles({ name: 'packet.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ format: 'health-visit-packet.encrypted.v1', salt: 'x', iv: 'x', ciphertext: 'x' })) });
  await expect(page.locator('#restore-dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close packet restore' }).click();
  await expect(page.locator('#restore-dialog')).not.toBeVisible();
  await page.getByRole('button', { name: 'Restore a license' }).click();
  await expect(page.locator('#license-dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close license restore' }).click();
  await expect(page.locator('#license-dialog')).not.toBeVisible();
});

test('malformed import gives visible recovery instructions', async ({ page }) => {
  await page.goto('/');
  await page.locator('#import-file').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{not JSON') });
  await expect(page.locator('#notice')).toBeVisible();
  await expect(page.locator('#notice')).toContainText('Choose a Health Visit Packet encrypted JSON file and try again.');
});

test('390px layout has no overflow and visible touch targets are at least 44px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const undersized = await page.locator('a, button, input, textarea, summary').evaluateAll(elements => elements.filter(element => {
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || !(element as HTMLElement).offsetParent) return false;
    const box = element.getBoundingClientRect();
    return box.width < 44 || box.height < 44;
  }).map(element => ({ label: element.getAttribute('aria-label') || element.textContent?.trim() || element.getAttribute('name'), box: element.getBoundingClientRect().toJSON() })));
  expect(undersized).toEqual([]);
  const previewTop = await page.locator('.preview-area').evaluate(element => element.getBoundingClientRect().top);
  const editorTop = await page.locator('.editor').evaluate(element => element.getBoundingClientRect().top);
  expect(previewTop).toBeLessThan(editorTop);
});

test('390px layout keeps all text visible when text is resized to 200%', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('html').evaluate(element => { element.style.fontSize = '32px'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const clipped = await page.locator('h1, .lede, .hero-actions, .hero-facts, figcaption, #save-state').evaluateAll(elements => elements.flatMap(element => {
    const rectangles = [...element.getClientRects()];
    return rectangles.filter(rectangle => rectangle.left < -0.5 || rectangle.right > innerWidth + 0.5).map(rectangle => ({ text: element.textContent?.trim(), left: rectangle.left, right: rectangle.right }));
  }));
  expect(clipped).toEqual([]);
});

test('demo route is populated, labelled, resettable, and titled for the route', async ({ page }) => {
  await page.goto('/demo');
  await expect(page).toHaveTitle('Demo — Health Visit Packet');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('#packet-sheet')).toContainText('Maya Patel');
  await expect(page.locator('#packet-sheet')).toContainText('Northside Lab portal · 2026-08-28');
  await page.locator('#profile-form input[name="name"]').fill('Changed sample');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('#packet-sheet')).toContainText('Maya Patel');
  await expect(page.locator('#packet-sheet')).not.toContainText('Changed sample');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://health-visit-packet.sociobot.in/demo');
});

test('legal and not-found pages use the shared accessible shell', async ({ page }) => {
  for (const route of ['/privacy/', '/terms/', '/404.html']) {
    await page.goto(route);
    await expect(page.locator('header nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toContainText('Built by Param Factory');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  }
  await expect(page.getByRole('heading', { name: 'This page does not exist' })).toBeVisible();
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`has no axe WCAG A/AA violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
  });
  test(`legal pages have no axe violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    for (const route of ['/privacy/', '/terms/']) {
      await page.goto(route);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(results.violations).toEqual([]);
    }
  });
}

test('keyboard skip link and modal close work without a pointer', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to packet editor' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  await page.getByRole('button', { name: 'Download encrypted bundle' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Close encrypted backup' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#bundle-dialog')).not.toBeVisible();
});

test('invalid returned license is stripped and rejected while checkout remains correctly targeted', async ({ page }) => {
  await page.route('https://api.sociobot.in/api/v1/products/health-visit-packet/verify?license=invalid-token', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: false, reason: 'invalid' }) }));
  await page.goto('/?license=invalid-token');
  await expect.poll(() => page.url()).not.toContain('license=');
  await expect(page.getByRole('heading', { name: 'Add a personal cover note' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Buy Plus — $9 once' })).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/health-visit-packet/checkout');
  const stored = await page.evaluate(() => ({ token: localStorage.getItem('sb_license:health-visit-packet'), verdict: JSON.parse(localStorage.getItem('sb_license:health-visit-packet:verdict') || '{}') }));
  expect(stored.token).toBe('invalid-token');
  expect(stored.verdict.valid).toBe(false);
});

test('cached Plus stays accessible in dark mode without rechecking more than daily', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => {
    localStorage.setItem('sb_license:health-visit-packet', 'existing-license');
    localStorage.setItem('sb_license:health-visit-packet:verdict', JSON.stringify({ checkedAt: Date.now(), valid: true }));
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Plus is active' })).toBeVisible();
  await page.locator('#profile-form textarea[name="coverNote"]').fill('Bring prior imaging notes.');
  await expect(page.locator('.cover-note')).toContainText('Bring prior imaging notes.');
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations).toEqual([]);
});

test('service-worker update waits, offers refresh, and removes old caches', async ({ page }) => {
  const workerPath = path.resolve('dist/sw.js');
  const originalWorker = await readFile(workerPath, 'utf8');
  try {
    await page.goto('/');
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await page.evaluate(() => caches.open('health-visit-packet-obsolete-v0'));
    await writeFile(workerPath, `${originalWorker}\n// update regression ${Date.now()}\n`);
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());
    await expect(page.locator('#update-notice')).toBeVisible({ timeout: 15_000 });
    await Promise.all([
      page.waitForEvent('framenavigated'),
      page.getByRole('button', { name: 'Refresh to update' }).click(),
    ]);
    await page.waitForLoadState('domcontentloaded');
    await expect.poll(() => page.evaluate(async () => (await caches.keys()).includes('health-visit-packet-obsolete-v0'))).toBe(false);
  } finally {
    await writeFile(workerPath, originalWorker);
  }
});

test('release configuration hardens responses, MIME, and immutable assets', async () => {
  const config = JSON.parse(await readFile(path.resolve('public/staticwebapp.config.json'), 'utf8'));
  expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
  expect(config.globalHeaders['Permissions-Policy']).toContain('camera=()');
  expect(config.globalHeaders['X-Frame-Options']).toBe('DENY');
  expect(config.mimeTypes['.webmanifest']).toBe('application/manifest+json');
  expect(config.routes.find((route: { route: string }) => route.route === '/assets/*').headers['Cache-Control']).toContain('immutable');
  expect(config.routes.find((route: { route: string }) => route.route === '/sw.js').headers['Cache-Control']).toContain('no-store');
  expect(config.routes.find((route: { route: string }) => route.route === '/demo').rewrite).toBe('/index.html');
  const normalizedRoutes = config.routes.map((route: { route: string }) => route.route.replace(/\/$/, ''));
  expect(new Set(normalizedRoutes).size).toBe(normalizedRoutes.length);
  expect(config.responseOverrides['404'].rewrite).toBe('/404.html');
});

test('metadata, sitemap, and claim registry cover the public routes and tagged checks', async () => {
  const index = await readFile(path.resolve('index.html'), 'utf8');
  const sitemap = await readFile(path.resolve('public/sitemap.xml'), 'utf8');
  const claims = JSON.parse(await readFile(path.resolve('.factory/claims.json'), 'utf8')) as Array<{ id: string; test: string }>;
  const claimTests = await readFile(path.resolve('tests/claims.spec.ts'), 'utf8');
  expect(index).toContain('rel="canonical"');
  expect(index).toContain('property="og:image"');
  expect(index).toContain('name="twitter:card"');
  for (const route of ['/', '/demo', '/privacy/', '/terms/']) expect(sitemap).toContain(`health-visit-packet.sociobot.in${route}`);
  expect(new Set(claims.map(claim => claim.id)).size).toBe(claims.length);
  for (const claim of claims) {
    expect(claim.test).toContain(`@claim:${claim.id}`);
    expect(claimTests.match(new RegExp(`@claim:${claim.id}(?:\\s|\\b)`, 'g'))).toHaveLength(1);
  }
});

test('terms identify the merchant of record and refund revocation', async ({ page }) => {
  await page.goto('/terms/');
  await expect(page.locator('main')).toContainText('merchant of record');
  await expect(page.locator('main')).toContainText('refunded purchase revokes its license');
});
