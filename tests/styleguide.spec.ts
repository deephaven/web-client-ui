/* eslint-disable no-await-in-loop */
import { Page, expect, test } from '@playwright/test';

const sampleSectionIds: string[] = [
  // grids-grid is first because if it's not first, it hides itself
  'grids-grid',
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
  'tooltips',
  'icons',
  'editors',
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

test.describe.configure({ mode: 'serial' });

let page: Page;

async function isolateAndGetSection(sectionId: string) {
  const isolator = page.getByPlaceholder('Isolate');
  await expect(isolator).toHaveCount(1);
  await isolator.fill(sectionId);
  // sanity check
  await expect(isolator).toHaveValue(sectionId);

  const section = page.locator(`#sample-section-${sectionId}`);
  await expect(section).toHaveCount(1);
  const sectionBox = await section.boundingBox();
  await expect(sectionBox?.height).toBeGreaterThan(0);
  return section;
}

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await page.goto('/ide/styleguide?testMode=true');
});

test.afterAll(async () => {
  await page.close();
});

test('Styleguide section count', async () => {
  const sampleSections = page.locator(
    '.sample-section:not(.sample-section-e2e-ignore)'
  );
  await expect(sampleSections).toHaveCount(sampleSectionIds.length);
});

test('Styleguide button section count', async () => {
  const buttonSections = await page.locator('[id^="sample-section-buttons-"]');
  await expect(buttonSections).toHaveCount(buttonSectionIds.length);
});

test.describe('Styleguide section', () => {
  // Iterate over all sample sections and take a screenshot of each one.
  sampleSectionIds.forEach(id => {
    test(id, async () => {
      const sampleSection = await isolateAndGetSection(id);
      await expect(sampleSection).toHaveScreenshot(`${id}.png`);
    });
  });
});

test.describe('Buttons regression test', () => {
  buttonSectionIds.forEach((id, i) => {
    test(id, async () => {
      const buttonSection = await isolateAndGetSection(id);

      const buttons = buttonSection.locator('button');
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
          id === 'sample-section-buttons-inline' &&
          !isDisabled &&
          !hasTextContent;

        // Focus
        await button.focus();
        await expect(buttonSection).toHaveScreenshot(
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

        await expect(buttonSection).toHaveScreenshot(
          `buttons-hover-section-${i}-${j}${isDisabled ? '-disabled' : ''}.png`
        );
        await page.mouse.move(0, 0);

        if (!isDisabled) {
          await button.blur();
        }
      }
    });
  });
});

test('Inputs regression test', async () => {
  await isolateAndGetSection('inputs');
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
