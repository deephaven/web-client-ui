/* eslint-disable no-await-in-loop */
import { expect, Locator, Page, test } from '@playwright/test';

let page: Page;
let sampleSections: Locator;

test.beforeEach(async ({ browser }) => {
  page = await browser.newPage();
  await page.goto('/ide/styleguide');

  sampleSections = page.locator('.sample-section');
  await expect(sampleSections).toHaveCount(39);
});

test.afterEach(async () => {
  await page.close();
});

// Iterate over all sample sections and take a screenshot of each one.
test('UI regression test', async () => {
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

test('Buttons regression test', async () => {
  await page.goto('/ide/styleguide#sample-section-buttons-regular');

  const buttonSections = page.locator('[id^="sample-section-buttons-"]');

  await expect(buttonSections).toHaveCount(4);

  for (let i = 0; i < (await buttonSections.count()); i += 1) {
    const section = buttonSections.nth(i);
    const buttons = section.locator('button');

    for (let j = 0; j < (await buttons.count()); j += 1) {
      const button = buttons.nth(j);

      await button.focus({ timeout: 500 });
      await expect(section).toHaveScreenshot(
        `buttons-focus-section-${i}-${j}.png`
      );
      await button.blur({ timeout: 500 });

      await button.hover({ timeout: 500 });
      await expect(section).toHaveScreenshot(
        `buttons-hover-section-${i}-${j}.png`
      );
      await button.blur({ timeout: 500 });
    }
  }
});

test('Inputs regression test', async () => {
  await page.goto('/ide/styleguide#sample-section-inputs');

  const columns = page.locator('#sample-section-inputs .col');

  await expect(columns).toHaveCount(7);

  for (let i = 0; i < (await columns.count()); i += 1) {
    const column = columns.nth(i);
    const inputs = column.locator('input,select,button');

    for (let j = 0; j < (await inputs.count()); j += 1) {
      const input = inputs.nth(j);

      const tagName = await input.evaluate(el => el.tagName);
      const type =
        tagName === 'INPUT'
          ? await input.getAttribute('type')
          : tagName.toLowerCase();

      await input.focus({ timeout: 500 });

      await expect(column).toHaveScreenshot(
        `inputs-col${i}-row${j}-${type ?? 'text'}-focus.png`
      );

      await input.blur({ timeout: 500 });
    }
  }
});
