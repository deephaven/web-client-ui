/* eslint-disable no-await-in-loop */
import { expect, Locator, Page, test } from '@playwright/test';
import { HIDE_FROM_E2E_TESTS_CLASS } from './utils';

let page: Page;
let sampleSections: Locator;

test.beforeEach(async ({ browser }, testInfo) => {
  page = await browser.newPage();
  await page.goto('/ide/styleguide');

  sampleSections = page.locator('.sample-section');
  await expect(sampleSections).toHaveCount(39);

  const hide = await page.locator(`.${HIDE_FROM_E2E_TESTS_CLASS}`).all();

  hide.forEach(locator =>
    locator.evaluate(el => {
      // eslint-disable-next-line no-param-reassign
      el.style.opacity = '0';
    })
  );
});

test.afterEach(async () => {
  await page.close();
});

// Iterate over all sample sections and take a screenshot of each one.
test('UI regression test - Styleguide sections', async () => {
  const sampleSectionCount = await sampleSections.count();

  for (let i = 0; i < sampleSectionCount; i += 1) {
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

  // Test focus and hover states for each enabled button
  const buttonSectionCount = await buttonSections.count();
  for (let i = 0; i < buttonSectionCount; i += 1) {
    const section = buttonSections.nth(i);
    const buttons = section.locator('button');

    const buttonCount = await buttons.count();

    for (let j = 0; j < buttonCount; j += 1) {
      const button = buttons.nth(j);

      const isDisabled = await button.evaluate(el =>
        el.hasAttribute('disabled')
      );

      // Focus
      await button.focus();
      await expect(section).toHaveScreenshot(
        `buttons-focus-section-${i}-${j}${isDisabled ? '-disabled' : ''}.png`
      );

      if (!isDisabled) {
        await button.blur();
      }

      // Hover
      await button.hover();
      await expect(section).toHaveScreenshot(
        `buttons-hover-section-${i}-${j}${isDisabled ? '-disabled' : ''}.png`
      );
      await page.mouse.move(0, 0);

      if (!isDisabled) {
        await button.blur();
      }
    }
  }
});

test('Inputs regression test', async () => {
  await page.goto('/ide/styleguide#sample-section-inputs');

  const columns = page.locator('#sample-section-inputs .col');

  await expect(columns).toHaveCount(7);

  // Test focus state for each enabled input
  const columnsCount = await columns.count();
  for (let i = 0; i < columnsCount; i += 1) {
    const column = columns.nth(i);
    const inputs = column.locator('input,select,button');

    const inputsCount = await inputs.count();
    for (let j = 0; j < inputsCount; j += 1) {
      const input = inputs.nth(j);

      const [tagName, type, isDisabled] = await input.evaluate(el => [
        el.tagName.toLowerCase(),
        el.getAttribute('type'),
        el.hasAttribute('disabled'),
      ]);

      const label = tagName === 'input' ? type ?? 'text' : tagName;

      await input.focus();

      await expect(column).toHaveScreenshot(
        `inputs-focus-col${i}-row${j}-${label}${
          isDisabled ? '-disabled' : ''
        }.png`
      );

      if (!isDisabled) {
        await input.blur();
      }
    }
  }
});
