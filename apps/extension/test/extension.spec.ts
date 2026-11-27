import { test, expect, chromium, type BrowserContext } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Loads the built extension (apps/extension/dist) into Chromium and checks the paste flow on a
// stand-in page served at the chatgpt.com URL. The request is answered locally by route(), so
// nothing reaches OpenAI. All data is fictional.

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
let context: BrowserContext;

test.beforeAll(async () => {
  context = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), 'airlock-ext-')), {
    channel: process.env.AIRLOCK_EXT_CHANNEL ?? 'msedge',
    headless: true,
    args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`],
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  if (context.serviceWorkers().length === 0) await context.waitForEvent('serviceworker');
});
test.afterAll(async () => context?.close());

async function fakeChatPage() {
  const page = await context.newPage();
  await page.route('https://chatgpt.com/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><title>stand-in</title>
        <textarea id="box" aria-label="Message"></textarea>
        <script>window.pagePastes = []; document.addEventListener('paste', e => window.pagePastes.push(e.clipboardData.getData('text/plain')));</script>`,
    }),
  );
  await page.goto('https://chatgpt.com/');
  return page;
}

test('a pasted secret is cleaned before the site sees it', async () => {
  const page = await fakeChatPage();
  // A synthetic paste event is not "trusted", so the content script ignores it; use the real keyboard paste.
  await page.evaluate(() => navigator.clipboard.writeText('Email priya.shah@acme.com, key sk-ant-abcdefghijklmnopqrstuv1234'));
  await page.locator('#box').click();
  await page.keyboard.press('Control+V');
  await expect(page.locator('#box')).toHaveValue(/@[a-z]+\.example, key ‹secret-1›/);
  const value = await page.locator('#box').inputValue();
  expect(value).not.toContain('priya.shah@acme.com');
  expect(value).not.toContain('sk-ant-');
  // The site's own paste listener never received the raw text.
  expect(await page.evaluate(() => (window as unknown as { pagePastes: string[] }).pagePastes)).toEqual([]);
});

test('nothing sensitive: pasted as is', async () => {
  const page = await fakeChatPage();
  await page.evaluate(() => navigator.clipboard.writeText('Please summarise the meeting notes.'));
  await page.locator('#box').click();
  await page.keyboard.press('Control+V');
  await expect(page.locator('#box')).toHaveValue('Please summarise the meeting notes.');
});
