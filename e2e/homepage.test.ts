import { test, expect } from '@playwright/test';

test('homepage loads key elements', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/KeyLingo/);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('text=KeyLingo.')).toBeVisible();
});

test('homepage has language selectors', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('a[href="/en"]')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('a[href="/nl"]')).toBeVisible({ timeout: 8000 });
});

test('practice page loads', async ({ page }) => {
  await page.goto('/en/practice');
  await expect(page.locator('h1')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('select[id="vocabulary-language"]')).toBeVisible({ timeout: 8000 });
});

test('reflex page loads', async ({ page }) => {
  await page.goto('/en/reflex');
  await expect(page.locator('h1')).toBeVisible({ timeout: 8000 });
});

test('vocabulary page loads', async ({ page }) => {
  await page.goto('/en/vocabulary');
  await expect(page.locator('h1')).toBeVisible({ timeout: 8000 });
});

test('progress page loads', async ({ page }) => {
  await page.goto('/en/progress');
  await expect(page.locator('text=Progress')).toBeVisible({ timeout: 8000 });
});

test('settings page loads', async ({ page }) => {
  await page.goto('/en/settings');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 8000 });
});

test('arabic language page loads', async ({ page }) => {
  await page.goto('/ar');
  await expect(page.locator('h1')).toBeVisible({ timeout: 8000 });
});