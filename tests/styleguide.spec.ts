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

// Iterate over all sample sections and take a screenshot of each one.
test('UI regression test', async () => {
  const sampleSections = page.locator('.sample-section');
  await expect(sampleSections).toHaveCount(39);

  for (let i = 0; i < (await sampleSections.count()); i += 1) {
    const sampleSection = sampleSections.nth(i);
    const id = String(await sampleSection.getAttribute('id'));

    // Scroll to the section. This is technically not necessary, but it mimics
    // the user experience a little better and mimics the behavior of the fixed
    // menu + scroll-to-top button that change based on scroll position.
    await page.goto(`/ide/styleguide#${id}`);

    await expect(sampleSection).toHaveScreenshot(
      `${id.replace(/^sample-section-/, '')}.png`
    );
  }
});
