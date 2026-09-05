import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

const APP_ORIGIN = 'http://127.0.0.1:4173';

const addResult = async (
  page: import('@playwright/test').Page,
  { label = 'Vitamin B12', value = '412', source = 'Riverside Lab portal', date = '2026-09-01' } = {},
) => {
  await page.locator('#observation-form input[name="label"]').fill(label);
  await page.locator('#observation-form input[name="value"]').fill(value);
  await page.locator('#observation-form input[name="source"]').fill(source);
  await page.locator('#observation-form input[name="date"]').fill(date);
  await page.locator('#observation-form button[type="submit"]').click();
};

const waitForSave = async (page: import('@playwright/test').Page) => {
  await expect(page.locator('#save-state')).toContainText(/Saved/);
};

const encryptedDownload = async (page: import('@playwright/test').Page, passphrase: string) => {
  await page.getByRole('button', { name: 'Download encrypted bundle' }).click();
  await page.locator('#bundle-form input[name="passphrase"]').fill(passphrase);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Encrypt and download' }).click();
  return pending;
};

test('@claim:demo-isolation keeps sample changes away from real data and clears the demo', async ({ page }) => {
  await page.goto('/');
  await page.locator('#profile-form input[name="name"]').fill('Real packet owner');
  await waitForSave(page);

  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('#packet-sheet')).toContainText('Maya Patel');
  await expect(page.locator('#packet-sheet')).not.toContainText('Real packet owner');
  await page.locator('#profile-form input[name="name"]').fill('Changed demo owner');
  await waitForSave(page);

  const stored = await page.evaluate(async () => {
    const read = (name: string) => new Promise<{ profile?: { name?: string } } | undefined>((resolve, reject) => {
      const open = indexedDB.open(name, 1);
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const request = open.result.transaction('packet').objectStore('packet').get('current');
        request.onsuccess = () => { const value = request.result; open.result.close(); resolve(value); };
        request.onerror = () => reject(request.error);
      };
    });
    return { real: await read('health-visit-packet'), demo: await read('demo:health-visit-packet') };
  });
  expect(stored.real?.profile?.name).toBe('Real packet owner');
  expect(stored.demo?.profile?.name).toBe('Changed demo owner');

  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#packet-sheet')).toContainText('Real packet owner');
  await expect.poll(() => page.evaluate(async () => (await indexedDB.databases()).map(database => database.name))).not.toContain('demo:health-visit-packet');
});

test('@claim:local-packet keeps a unique health value inside the browser', async ({ page }) => {
  const requests: Array<{ url: string; body: string | null }> = [];
  page.on('request', request => requests.push({ url: request.url(), body: request.postData() }));
  await page.goto('/demo');
  await addResult(page, { label: 'Local-only marker', value: '47' });
  await waitForSave(page);
  const saved = await page.evaluate(() => new Promise<{ observations: Array<{ label: string }> }>((resolve, reject) => {
    const open = indexedDB.open('demo:health-visit-packet', 1);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction('packet').objectStore('packet').get('current');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    };
  }));
  expect(saved.observations.some(entry => entry.label === 'Local-only marker')).toBe(true);
  expect(requests.filter(request => new URL(request.url).origin !== APP_ORIGIN)).toEqual([]);
  expect(requests.some(request => request.body?.includes('Local-only marker'))).toBe(false);
});

test('@claim:indexeddb-storage stores the demo packet in its database without license state', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('#profile-form textarea[name="reason"]').fill('Confirm IndexedDB storage.');
  await waitForSave(page);
  const state = await page.evaluate(async () => ({
    databases: (await indexedDB.databases()).map(database => database.name),
    localKeys: Object.keys(localStorage),
    sessionKeys: Object.keys(sessionStorage),
  }));
  expect(state.databases).toContain('demo:health-visit-packet');
  expect(state.databases).not.toContain('health-visit-packet');
  expect(state.localKeys.filter(key => key.startsWith('sb_license:'))).toEqual([]);
  expect(state.sessionKeys).toEqual([]);
});

test('@claim:no-tracking loads no account, analytics, remote font, or third-party script', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/demo');
  await expect(page.locator('input[type="email"], input[name="account"], [data-analytics]')).toHaveCount(0);
  const resources = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name));
  expect([...requests, ...resources].filter(url => new URL(url).origin !== APP_ORIGIN)).toEqual([]);
  expect(await page.locator('script[src^="http"], link[href^="http"][rel="stylesheet"]').count()).toBe(0);
});

test('@claim:offline-reload keeps the demo usable offline in its own browser context', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto('/demo');
    await page.locator('#profile-form textarea[name="reason"]').fill('Offline sample marker');
    await waitForSave(page);
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await context.setOffline(true);
    await page.reload();
    await expect(page).toHaveTitle('Demo — Health Visit Packet');
    await expect(page.locator('#packet-sheet')).toContainText('Offline sample marker');
    await expect(page.locator('#offline')).toBeVisible();
  } finally {
    await context.close();
  }
});

test('@claim:source-date keeps a selected value beside its source and date', async ({ page }) => {
  await page.goto('/demo');
  await addResult(page, { label: 'Ferritin', value: '64', source: 'Riverside Lab portal', date: '2026-09-01' });
  const preview = page.locator('#packet-sheet');
  await expect(preview).toContainText('Ferritin');
  await expect(preview).toContainText('64');
  await expect(preview).toContainText('Riverside Lab portal · 2026-09-01');
});

test('@claim:reload-persistence keeps edits after a full reload', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('#profile-form textarea[name="reason"]').fill('Discuss the sleep log at this visit.');
  await waitForSave(page);
  await page.reload();
  await expect(page.locator('#packet-sheet')).toContainText('Discuss the sleep log at this visit.');
});

test('@claim:print-pdf shows the sharing warning before invoking browser print', async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { printCalls?: number }).printCalls = 0;
    window.print = () => { (window as Window & { printCalls?: number }).printCalls = ((window as Window & { printCalls?: number }).printCalls || 0) + 1; };
  });
  await page.goto('/demo');
  const panel = page.locator('.export-panel');
  await expect(panel).toContainText('remove anything you do not want to share');
  await expect(panel).toContainText('save the printout as a PDF');
  await page.getByRole('button', { name: 'Print or save as PDF' }).click();
  await expect.poll(() => page.evaluate(() => (window as Window & { printCalls?: number }).printCalls)).toBe(1);
});

test('@claim:json-export downloads a complete plain JSON packet', async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/demo');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download plain JSON' }).click();
  const download = await pending;
  const file = await download.path();
  const exported = JSON.parse(await readFile(file!, 'utf8')) as { profile: { name: string }; observations: unknown[]; medications: unknown[]; questions: unknown[] };
  expect(exported.profile.name).toBe('Maya Patel');
  expect(exported.observations).toHaveLength(2);
  expect(exported.medications).toHaveLength(2);
  expect(exported.questions).toHaveLength(2);
});

test('@claim:encrypted-hides-data hides a unique health value in the downloaded file', async ({ page }) => {
  await page.goto('/demo');
  await addResult(page, { label: 'Private zinc marker', value: '83' });
  const download = await encryptedDownload(page, 'claim test passphrase');
  const file = await download.path();
  const raw = await readFile(file!, 'utf8');
  const parsed = JSON.parse(raw) as { format: string; ciphertext: string };
  expect(parsed.format).toBe('health-visit-packet.encrypted.v1');
  expect(parsed.ciphertext.length).toBeGreaterThan(100);
  expect(raw).not.toContain('Private zinc marker');
  expect(raw).not.toContain('Maya Patel');
});

test('@claim:encrypted-restore restores a removed entry from the encrypted bundle', async ({ page }) => {
  await page.goto('/demo');
  const download = await encryptedDownload(page, 'restore claim passphrase');
  const file = await download.path();
  await page.getByRole('button', { name: 'Remove HbA1c' }).click();
  await expect(page.locator('#packet-sheet')).not.toContainText('HbA1c');
  await page.locator('#import-file').setInputFiles(file!);
  await page.locator('#restore-form input[name="passphrase"]').fill('restore claim passphrase');
  await page.getByRole('button', { name: 'Restore and replace this packet' }).click();
  await expect(page.locator('#packet-sheet')).toContainText('HbA1c');
});

test('@claim:passphrase-private sends no passphrase and rejects the wrong one', async ({ page }) => {
  const requests: Array<{ url: string; body: string | null }> = [];
  page.on('request', request => requests.push({ url: request.url(), body: request.postData() }));
  await page.goto('/demo');
  const download = await encryptedDownload(page, 'not sent anywhere');
  const file = await download.path();
  await page.locator('#import-file').setInputFiles(file!);
  await page.locator('#restore-form input[name="passphrase"]').fill('wrong passphrase');
  await page.getByRole('button', { name: 'Restore and replace this packet' }).click();
  await expect(page.locator('#restore-error')).toContainText('Check the passphrase and file');
  expect(requests.some(request => request.url.includes('not%20sent%20anywhere') || request.body?.includes('not sent anywhere'))).toBe(false);
  expect(requests.filter(request => new URL(request.url).origin !== APP_ORIGIN)).toEqual([]);
});

test('@claim:reversible-removals restores one result, medicine, and question with Undo', async ({ page }) => {
  await page.goto('/demo');
  for (const accessibleName of ['Remove HbA1c', 'Remove Metformin', 'Remove question 1']) {
    await page.getByRole('button', { name: accessibleName }).click();
    await page.getByRole('button', { name: 'Undo removal' }).click();
  }
  await expect(page.locator('#packet-sheet')).toContainText('HbA1c');
  await expect(page.locator('#packet-sheet')).toContainText('Metformin');
  await expect(page.locator('#packet-sheet')).toContainText('Could any medicine contribute');
});

test('@claim:plus-price exposes the $9 one-time offer and registered hosted checkout', async ({ page, request }) => {
  await page.goto('/demo');
  const buy = page.getByRole('link', { name: 'Buy Plus — $9 once' });
  await expect(buy).toBeVisible();
  const href = await buy.getAttribute('href');
  const response = await request.get(href!, { maxRedirects: 0 });
  expect(response.status()).toBe(303);
  expect(response.headers().location).toMatch(/^https:\/\/checkout\.dodopayments\.com\/session\//);
});

test('@claim:plus-cover-note adds the paid note to the printable packet', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sb_license:health-visit-packet', 'fixture-entitlement');
    localStorage.setItem('sb_license:health-visit-packet:verdict', JSON.stringify({ checkedAt: Date.now(), valid: true }));
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Plus is active' })).toBeVisible();
  await page.locator('#profile-form textarea[name="coverNote"]').fill('Please review the attached home readings first.');
  await expect(page.locator('.cover-note')).toContainText('Please review the attached home readings first.');
});

test('@claim:free-core keeps building, safety, backup, export, and accessibility available without a license', async ({ page }) => {
  await page.goto('/demo');
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('sb_license:')))).toEqual([]);
  await addResult(page, { label: 'Free builder marker' });
  await expect(page.getByRole('button', { name: 'Print or save as PDF' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Download encrypted bundle' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Download plain JSON' })).toBeEnabled();
  await expect(page.locator('.export-panel')).toContainText('remove anything you do not want to share');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('@claim:license-handling strips the URL, sends only the token, and caches the result', async ({ page }) => {
  let verificationCount = 0;
  const verificationRequests: Array<{ method: string; url: string; body: string | null }> = [];
  await page.route('https://api.sociobot.in/api/v1/products/health-visit-packet/verify?license=claim-license', route => {
    verificationCount += 1;
    const request = route.request();
    verificationRequests.push({ method: request.method(), url: request.url(), body: request.postData() });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: false, reason: 'invalid' }) });
  });
  await page.goto('/');
  await page.locator('#profile-form input[name="name"]').fill('Private health name');
  await waitForSave(page);
  await page.goto('/?license=claim-license');
  await expect.poll(() => verificationCount).toBe(1);
  await expect(page).not.toHaveURL(/license=/);
  expect(verificationRequests).toEqual([{ method: 'GET', url: 'https://api.sociobot.in/api/v1/products/health-visit-packet/verify?license=claim-license', body: null }]);
  const cached = await page.evaluate(() => JSON.parse(localStorage.getItem('sb_license:health-visit-packet:verdict') || '{}'));
  expect(cached.valid).toBe(false);
  expect(cached.checkedAt).toBeGreaterThan(0);
  await page.reload();
  expect(verificationCount).toBe(1);
});

test('@claim:no-health-server sends no packet entry in any request', async ({ page }) => {
  const requests: Array<{ method: string; url: string; body: string | null }> = [];
  page.on('request', request => requests.push({ method: request.method(), url: request.url(), body: request.postData() }));
  await page.goto('/demo');
  await addResult(page, { label: 'Never-upload-this-marker', value: '9281' });
  await waitForSave(page);
  expect(requests.some(request => request.body?.includes('Never-upload-this-marker') || request.url.includes('Never-upload-this-marker'))).toBe(false);
  expect(requests.filter(request => request.method !== 'GET')).toEqual([]);
  expect(requests.filter(request => new URL(request.url).origin !== APP_ORIGIN)).toEqual([]);
});

test('@claim:no-portal-advice preserves copied values without portal or model requests', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/demo');
  await addResult(page, { label: 'Copied marker', value: '117 exact', source: 'Example portal label', date: '2026-09-03' });
  await expect(page.locator('#packet-sheet')).toContainText('117 exact');
  await expect(page.locator('#packet-sheet')).toContainText('Example portal label · 2026-09-03');
  expect(requests.some(url => /openai|sociobot\.in\/v1|portal/i.test(new URL(url).hostname))).toBe(false);
});
