import { test, expect } from '@playwright/test';

// End-to-end flows (BRIEF §11.4). They run without a Firebase config, so they exercise the
// reduced-protection path: rule checks only, consent required before any cloud call.
// All data is fictional.

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test('chat: reduced protection shows the live preview and holds back without consent', async ({ page }) => {
  await page.goto('/chat');
  await expect(page.getByText(/not available on this browser \(reduced protection\)/i)).toBeVisible();
  const input = page.getByLabel('Message input');
  await input.fill('Email priya.shah@acme.com or call 98200 12345 about the invoice.');
  await expect(page.getByText(/2 sensitive details will be swapped/i)).toBeVisible();
  await page.getByRole('button', { name: 'Send' }).click();
  const turn = page.locator('.turn').first();
  await expect(turn).toContainText('Held back');
  await expect(turn).toContainText(/Send rule-cleaned text/i);
  await expect(turn.locator('.turn-scrubbed')).not.toContainText('priya.shah@acme.com');
  await expect(turn.locator('.turn-scrubbed')).toContainText('.example');
});

test('chat: an API key is withheld and the user is offered to send without it', async ({ page }) => {
  await page.goto('/chat');
  await page.getByLabel('Message input').fill('Debug this: key sk-ant-abcdefghijklmnopqrstuv1234 fails.');
  await page.getByRole('button', { name: 'Send' }).click();
  const turn = page.locator('.turn').first();
  await expect(turn.locator('.turn-scrubbed')).toContainText('‹secret-1›');
  await expect(turn.getByRole('button', { name: 'Send without the secret' })).toBeVisible();
});

test('clipboard: clean and copy, then restore an answer, and a receipt is kept', async ({ page }) => {
  await page.goto('/clipboard');
  await page.getByLabel('Text to clean').fill('Please draft a reply to priya.shah@acme.com and call 98200 12345.');
  await page.getByRole('button', { name: 'Clean and copy' }).click();
  await expect(page.getByText(/Copied\. We swapped 2 sensitive details/)).toBeVisible();
  const cleaned = (await page.locator('.clipboard-restored-output').innerText()).trim();
  expect(cleaned).not.toContain('priya.shah@acme.com');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(cleaned);

  const standInEmail = cleaned.match(/[\w.]+@[\w]+\.example/)![0];
  await page.getByLabel("The AI's answer").fill(`Sure. I wrote to ${standInEmail} for you.`);
  await page.getByRole('button', { name: 'Restore' }).click();
  await expect(page.locator('.clipboard-restored-output')).toContainText('priya.shah@acme.com');

  await page.goto('/receipts');
  await expect(page.getByText('What was sent')).toBeVisible();
  await expect(page.locator('.receipt-view-payload')).toContainText(standInEmail);
});

test('benchmark: rules only catches every structured secret', async ({ page }) => {
  await page.goto('/bench');
  await page.getByRole('button', { name: 'Run benchmark' }).click();
  await expect(page.locator('.bench-results')).toBeVisible();
  const row = page.locator('.bench-results tr', { hasText: /^aadhaar/ });
  await expect(row).toContainText(/0 of \d+ leaked, recall 100%/);
});
