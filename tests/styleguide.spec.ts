/* eslint-disable no-await-in-loop */
import { expect, test } from '@playwright/test';

const sampleSectionIds: string[] = [
  'sample-section-typography',
  'sample-section-colors',
  'sample-section-theme-color-palette',
  'sample-section-semantic-colors',
  'sample-section-chart-colors',
  'sample-section-editor-colors',
  'sample-section-grid-colors',
  'sample-section-component-colors',
  'sample-section-buttons-regular',
  'sample-section-buttons-outline',
  'sample-section-buttons-inline',
  'sample-section-buttons-socketed',
  'sample-section-progress',
  'sample-section-alerts',
  'sample-section-inputs',
  'sample-section-item-list-inputs',
  'sample-section-draggable-lists',
  'sample-section-time-slider-inputs',
  'sample-section-dialog',
  'sample-section-modals',
  'sample-section-context-menus',
  'sample-section-dropdown-menus',
  'sample-section-navigations',
  'sample-section-tooltips',
  'sample-section-icons',
  'sample-section-editors',
  'sample-section-grids-grid',
  'sample-section-grids-static',
  'sample-section-grids-data-bar',
  'sample-section-grids-quadrillion',
  'sample-section-grids-async',
  'sample-section-grids-tree',
  'sample-section-grids-iris',
  'sample-section-charts',
  'sample-section-spectrum-buttons',
  'sample-section-spectrum-collections',
  'sample-section-spectrum-content',
  'sample-section-spectrum-forms',
  'sample-section-spectrum-overlays',
  'sample-section-spectrum-well',
];
const buttonSectionIds: string[] = [
  'sample-section-buttons-regular',
  'sample-section-buttons-outline',
  'sample-section-buttons-inline',
  'sample-section-buttons-socketed',
];

test('UI regression test - Styleguide section count', async ({ page }) => {
  await page.goto('/ide/styleguide');

  const sampleSections = await page.locator('.sample-section');

  await expect(sampleSections).toHaveCount(sampleSectionIds.length);
});

test('UI regression test - Styleguide button section count', async ({
  page,
}) => {
  await page.goto('/ide/styleguide');

  const buttonSections = await page.locator('[id^="sample-section-buttons-"]');

  await expect(buttonSections).toHaveCount(buttonSectionIds.length);
});

// Iterate over all sample sections and take a screenshot of each one.
sampleSectionIds.forEach(id => {
  test(`UI regression test - Styleguide section - ${id}`, async ({ page }) => {
    // Isolate the section
    await page.goto(`/ide/styleguide?isolateSection=true#${id}`);

    const sampleSection = page.locator(`#${id}`);
    await sampleSection.waitFor();

    await expect(sampleSection).toHaveScreenshot(
      `${id.replace(/^sample-section-/, '')}.png`
    );
  });
});

buttonSectionIds.forEach((id, i) => {
  test(`Buttons regression test - ${id}`, async ({ page }) => {
    // Isolate the section
    await page.goto(`/ide/styleguide?isolateSection=true#${id}`);

    const sampleSection = page.locator(`#${id}`);

    const buttons = sampleSection.locator('button');
    await expect(buttons, `Button section: '${id}'`).not.toHaveCount(0);

    const buttonCount = await buttons.count();

    expect(buttonCount, `Button section: '${id}'`).toBeGreaterThan(0);

    for (let j = 0; j < buttonCount; j += 1) {
      const button = buttons.nth(j);

      const isDisabled = await button.evaluate(el =>
        el.hasAttribute('disabled')
      );

      // Focus
      await button.focus();
      await expect(sampleSection).toHaveScreenshot(
        `buttons-focus-section-${i}-${j}${isDisabled ? '-disabled' : ''}.png`
      );

      if (!isDisabled) {
        await button.blur();
      }

      // Hover
      await button.hover();
      await expect(sampleSection).toHaveScreenshot(
        `buttons-hover-section-${i}-${j}${isDisabled ? '-disabled' : ''}.png`
      );
      await page.mouse.move(0, 0);

      if (!isDisabled) {
        await button.blur();
      }
    }
  });
});

test('Inputs regression test', async ({ page }) => {
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
