const { test, expect } = require('@playwright/test');

test.describe('smoke', () => {
  test('home loads and browse links work', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /find trusted businesses/i })).toBeVisible();

    await Promise.all([
      page.waitForURL(/\/categories/),
      page.getByRole('link', { name: /browse categories/i }).click(),
    ]);
    await expect(page).toHaveURL(/\/categories/);
    await expect(page.getByRole('heading', { name: /^categories$/i })).toBeVisible();

    await page.goto('/');
    await Promise.all([
      page.waitForURL(/\/companies/),
      page.getByRole('link', { name: /explore companies/i }).click(),
    ]);
    await expect(page).toHaveURL(/\/companies/);
    await expect(page.getByRole('heading', { name: /browse companies/i })).toBeVisible();
  });

  test('uppercase route redirects to lowercase', async ({ page }) => {
    await page.goto('/Categories');
    await expect(page).toHaveURL(/\/categories$/);
    await expect(page.getByRole('heading', { name: /^categories$/i })).toBeVisible();
  });

  test('countries api responds', async ({ request }) => {
    const response = await request.get('/api/countries');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.defaultCountry).toBeTruthy();
    expect(Array.isArray(body.countries)).toBeTruthy();
    expect(body.countries.length).toBeGreaterThan(0);
  });

  test('add company dialog allows selecting non-default category', async ({ page }) => {
    await page.goto('/companies?add=1');
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/add a company/i)).toBeVisible();

    const categoryTrigger = dialog.getByRole('combobox').first();
    await categoryTrigger.click();
    await page.getByRole('option', { name: 'Bank', exact: true }).click();
    await expect(categoryTrigger).toContainText('Bank');
  });
});
