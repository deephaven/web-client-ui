/* eslint-disable no-await-in-loop */
import { Page, expect, test } from '@playwright/test';

const sampleSectionIds: string[] = [
  'typography',
  'colors',
  'theme-color-palette',
  'semantic-colors',
  'chart-colors',
  'editor-colors',
  'grid-colors',
  'component-colors',
  'golden-layout',
  'buttons-regular',
  'buttons-outline',
  'buttons-inline',
  'buttons-socketed',
  'links',
  'progress',
  'inputs',
  'item-list-inputs',
  'draggable-lists',
  'time-slider-inputs',
  'dialog',
  'modals',
  'context-menus',
  'dropdown-menus',
  'navigations',
  'list-views',
  'pickers',
  'tooltips',
  'icons',
  'editors',
  'grids-grid',
  'grids-static',
  'grids-data-bar',
  'grids-quadrillion',
  'grids-async',
  'grids-tree',
  'grids-iris',
  'charts',
  'spectrum-buttons',
  'spectrum-collections',
  'spectrum-content',
  'spectrum-forms',
  'spectrum-overlays',
  'spectrum-well',
];

const buttonSectionIds: string[] = [
  'buttons-regular',
  'buttons-outline',
  'buttons-inline',
  'buttons-socketed',
];

async function goToStyleguide(page: Page) {
  await test.step('Go to styleguide', async () => {
    await page.goto('/ide/styleguide');
    await expect(page.locator('.style-guide-container')).toHaveCount(1, {
      timeout: 45000,
    });
  });
}

test('UI regression - Section counts', async ({ page }) => {
  await goToStyleguide(page);

  await expect(
    page.locator('.sample-section:not(.sample-section-e2e-ignore)')
  ).toHaveCount(sampleSectionIds.length);
  await expect(page.locator('[id^="sample-section-buttons-"]')).toHaveCount(
    buttonSectionIds.length
  );
});

test('UI regression - Styleguide sections', async ({ page }) => {
  await goToStyleguide(page);

  for (let i = 0; i < sampleSectionIds.length; i += 1) {
    const id = sampleSectionIds[i];
    await test.step(`Section - ${id}`, async () => {
      await page.goto(`/ide/styleguide#${id}`);

      const sampleSection = page.locator(`#sample-section-${id}`);
      const box = await sampleSection.boundingBox({ timeout: 45000 });
      expect(box?.height).toBeGreaterThan(0);

      await expect.soft(sampleSection).toHaveScreenshot(`${id}.png`);
    });
  }
});

test('Buttons regression test', async ({ page }) => {
  await goToStyleguide(page);

  for (let i = 0; i < buttonSectionIds.length; i += 1) {
    const id = buttonSectionIds[i];
    await test.step(id, async () => {
      await page.goto(`/ide/styleguide#${id}`);

      const sampleSection = page.locator(`#sample-section-${id}`);

      const buttons = sampleSection.locator('button');
      await expect(buttons, `Button section: '${id}'`).not.toHaveCount(0);

      const buttonCount = await buttons.count();

      expect(buttonCount, `Button section: '${id}'`).toBeGreaterThan(0);

      for (let j = 0; j < buttonCount; j += 1) {
        const button = buttons.nth(j);

        const { hasTextContent, isDisabled } = await button.evaluate(
          (el: HTMLButtonElement) => ({
            hasTextContent: el.textContent !== '',
            isDisabled: el.hasAttribute('disabled'),
          })
        );

        const isIconOnlyButton =
          id === 'buttons-inline' && !isDisabled && !hasTextContent;

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

        if (isIconOnlyButton) {
          await expect(page.locator('.tooltip-content')).toHaveCount(1);
        }

        await expect(sampleSection).toHaveScreenshot(
          `buttons-hover-section-${i}-${j}${isDisabled ? '-disabled' : ''}.png`
        );
        await page.mouse.move(0, 0);

        if (!isDisabled) {
          await button.blur();
        }
      }
    });
  }
});

test('Inputs regression test', async ({ page }) => {
  await page.goto('/ide/styleguide#inputs');

  const columns = page.locator('#sample-section-inputs .col');

  await expect(columns).toHaveCount(6, { timeout: 45000 });

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
