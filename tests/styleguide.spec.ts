/* eslint-disable no-await-in-loop */
import { expect, Page, test } from '@playwright/test';

const EXPECTED_SAMPLE_SECTION_COUNT = 41;
const EXPECTED_BUTTON_SECTION_COUNT = 4;

let page: Page;
const sampleSectionIds: string[] = [];
const buttonSectionIds: string[] = [];

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();

  await page.goto('/ide/styleguide');

  // Get the ids of the sample sections
  const sampleSections = page.locator('.sample-section');
  await expect(sampleSections).toHaveCount(EXPECTED_SAMPLE_SECTION_COUNT);

  sampleSectionIds.length = 0;
  for (let i = 0; i < EXPECTED_SAMPLE_SECTION_COUNT; i += 1) {
    const sampleSection = sampleSections.nth(i);
    const id = String(await sampleSection.getAttribute('id'));
    sampleSectionIds.push(id);
  }

  // Get the ids of the button sections
  const buttonSections = page.locator('[id^="sample-section-buttons-"]');
  await expect(buttonSections).toHaveCount(EXPECTED_BUTTON_SECTION_COUNT);

  buttonSectionIds.length = 0;
  for (let i = 0; i < EXPECTED_BUTTON_SECTION_COUNT; i += 1) {
    const buttonSection = buttonSections.nth(i);
    const id = String(await buttonSection.getAttribute('id'));
    buttonSectionIds.push(id);
  }

  await page.close();
});

test.beforeEach(async ({ browser }) => {
  page = await browser.newPage();
});

test.afterEach(async () => {
  await page.close();
});

// Iterate over all sample sections and take a screenshot of each one.
test('UI regression test - Styleguide sections', async ({ browser }) => {
  for (let i = 0; i < sampleSectionIds.length; i += 1) {
    // Can't rely on beforeEach here since we are running tests in a loop inside
    // single test
    page = await browser.newPage();

    const id = sampleSectionIds[i];

    // Isolate the section
    await page.goto(`/ide/styleguide?isolateSection=true#${id}`);

    const sampleSection = page.locator(`#${id}`);
    await sampleSection.waitFor();

    await expect(sampleSection).toHaveScreenshot(
      `${id.replace(/^sample-section-/, '')}.png`
    );

    await page.close();
  }
});

test('Buttons regression test', async ({ browser }) => {
  expect(buttonSectionIds.length).toEqual(EXPECTED_BUTTON_SECTION_COUNT);

  // Test focus and hover states for each enabled button
  for (let i = 0; i < buttonSectionIds.length; i += 1) {
    // Can't rely on beforeEach here since we are running tests in a loop inside
    // single test
    page = await browser.newPage();

    const id = buttonSectionIds[i];

    // Isolate the section
    const sectionUrl = `/ide/styleguide?isolateSection=true#${id}`;
    await page.goto(sectionUrl);

    const section = page.locator(`#${id}`);
    await section.waitFor();

    const buttons = section.locator('button');

    const buttonCount = await buttons.count();

    expect(buttonCount, `Button section: '${sectionUrl}'`).toBeGreaterThan(0);

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

    await page.close();
  }
});

test('Inputs regression test', async ({ browser }) => {
  await page.goto('/ide/styleguide?isolateSection=true#sample-section-inputs');

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
