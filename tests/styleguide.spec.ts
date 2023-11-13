/* eslint-disable no-await-in-loop */
import { expect, Page, test } from '@playwright/test';

let page: Page;

test.beforeEach(async ({ browser }) => {
  page = await browser.newPage();
  await page.goto('/ide/styleguide');
});

test.afterEach(async () => {
  await page.close();
});

test('UI regression test', async () => {
  const sampleSections = page.locator('.sample-section');
  await expect(sampleSections).toHaveCount(33);

  for (let i = 0; i < (await sampleSections.count()); i += 1) {
    const sampleSection = sampleSections.nth(i);
    const id = await sampleSection.getAttribute('id');

    await page.goto(`/ide/styleguide#${id}`);

    await expect(sampleSection).toHaveScreenshot();
  }
});
