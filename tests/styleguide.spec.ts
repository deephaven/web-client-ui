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
  'sample-section-golden-layout',
  'sample-section-buttons-regular',
  'sample-section-buttons-inline',
  'sample-section-buttons-socketed',
  'sample-section-links',
  'sample-section-progress',
  'sample-section-inputs',
  'sample-section-item-list-inputs',
  'sample-section-draggable-lists',
  'sample-section-time-slider-inputs',
  'sample-section-dialog',
  'sample-section-modals',
  'sample-section-context-menus',
  'sample-section-dropdown-menus',
  'sample-section-navigations',
  'sample-section-list-views',
  'sample-section-table-views',
  'sample-section-pickers',
  'sample-section-toast',
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
  'sample-section-grids-iris-compact',
  'sample-section-grids-iris-spacious',
  'sample-section-charts',
  'sample-section-error-views',
  'sample-section-xcomponents',
  'sample-section-spectrum-buttons',
  'sample-section-spectrum-collections',
  'sample-section-spectrum-content',
  'sample-section-spectrum-forms',
  'sample-section-spectrum-overlays',
  'sample-section-spectrum-well',
  'sample-section-checkbox-groups',
];
const buttonSectionIds: string[] = [
  'sample-section-buttons-regular',
  'sample-section-buttons-inline',
  'sample-section-buttons-socketed',
];

test('UI regression test - Styleguide section count', async ({ page }) => {
  await page.goto('/ide/styleguide');

  const sampleSections = await page.locator(
    '.sample-section:not(.sample-section-e2e-ignore)'
  );

  await expect(sampleSections).toHaveCount(sampleSectionIds.length, {
    timeout: 45000,
  });
});

test('UI regression test - Styleguide button section count', async ({
  page,
}) => {
  await page.goto('/ide/styleguide');

  const buttonSections = await page.locator('[id^="sample-section-buttons-"]');

  await expect(buttonSections).toHaveCount(buttonSectionIds.length, {
    timeout: 45000,
  });
});

const SECTION_TEST_TITLE_PREFIX = 'UI regression test - Styleguide section - ';

/**
 * Records canvas context loss so a failed screenshot can tell a lost backing
 * store apart from a canvas that was never drawn. The events don't bubble, so
 * they are captured on window.
 */
function recordCanvasContextEvents(): void {
  const events: { type: string; time: number; className: string }[] = [];
  Object.assign(window, { e2eCanvasContextEvents: events });
  ['contextlost', 'contextrestored'].forEach(type => {
    window.addEventListener(
      type,
      event => {
        const target = event.target as HTMLElement | null;
        events.push({
          type,
          time: performance.now(),
          className: target?.className ?? '',
        });
      },
      true
    );
  });
}

/**
 * Describes every canvas in the section, including how many of its backing
 * store pixels are drawn. A canvas with drawn pixels that screenshots as blank
 * points at the browser's compositing; one without points at the app drawing.
 */
function getSectionCanvasDiagnostics(section: Element): unknown {
  const sampleStride = 16;
  return {
    now: performance.now(),
    devicePixelRatio: window.devicePixelRatio,
    visibilityState: document.visibilityState,
    hasFocus: document.hasFocus(),
    fontsStatus: document.fonts.status,
    contextEvents:
      (window as unknown as { e2eCanvasContextEvents?: unknown })
        .e2eCanvasContextEvents ?? null,
    canvases: Array.from(section.querySelectorAll('canvas')).map(canvas => {
      const rect = canvas.getBoundingClientRect();
      const context = canvas.getContext('2d');
      let sampledPixels = 0;
      let drawnPixels = 0;
      const colors = new Set<string>();
      let readError: string | null = null;
      if (context != null && canvas.width > 0 && canvas.height > 0) {
        try {
          const { data } = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );
          for (let i = 0; i < data.length; i += 4 * sampleStride) {
            sampledPixels += 1;
            if (data[i + 3] !== 0) {
              drawnPixels += 1;
            }
            if (colors.size < 32) {
              colors.add(
                `${data[i]},${data[i + 1]},${data[i + 2]},${data[i + 3]}`
              );
            }
          }
        } catch (e) {
          readError = String(e);
        }
      }
      return {
        className: canvas.className,
        width: canvas.width,
        height: canvas.height,
        styleWidth: canvas.style.width,
        styleHeight: canvas.style.height,
        rect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        },
        isContextLost:
          (
            context as
              | (CanvasRenderingContext2D & { isContextLost?: () => boolean })
              | null
          )?.isContextLost?.() ?? null,
        sampledPixels,
        drawnPixels,
        sampleColors: Array.from(colors),
        readError,
      };
    }),
  };
}

test.afterEach(async ({ page }, testInfo) => {
  if (
    testInfo.status === testInfo.expectedStatus ||
    !testInfo.title.startsWith(SECTION_TEST_TITLE_PREFIX) ||
    page.isClosed()
  ) {
    return;
  }

  const id = testInfo.title.slice(SECTION_TEST_TITLE_PREFIX.length);
  const sampleSection = page.locator(`#${id}`);
  if ((await sampleSection.count()) === 0) {
    return;
  }

  // Diagnostics must never replace the original failure with their own
  try {
    const diagnostics = await sampleSection.evaluate(
      getSectionCanvasDiagnostics
    );
    await testInfo.attach('section-canvas-diagnostics', {
      body: JSON.stringify(diagnostics, null, 2),
      contentType: 'application/json',
    });

    // Shows whether the mismatch persisted after the assertion gave up
    await testInfo.attach('section-after-failure', {
      body: await sampleSection.screenshot({ animations: 'disabled' }),
      contentType: 'image/png',
    });
  } catch (e) {
    await testInfo.attach('section-canvas-diagnostics-error', {
      body: String(e),
      contentType: 'text/plain',
    });
  }
});

// Iterate over all sample sections and take a screenshot of each one.
sampleSectionIds.forEach(id => {
  test(`${SECTION_TEST_TITLE_PREFIX}${id}`, async ({ page }) => {
    // Fail quickly if console errors are detected
    page.on('console', msg => {
      if (msg.type() === 'error') {
        throw new Error(msg.text());
      }
    });

    await page.addInitScript(recordCanvasContextEvents);

    // Isolate the section
    await page.goto(`/ide/styleguide?isolateSection=true#${id}`);

    const sampleSection = page.locator(`#${id}`);

    await expect(sampleSection).toHaveScreenshot(
      `${id.replace(/^sample-section-/, '')}.png`,
      { timeout: 45000 }
    );
  });
});

buttonSectionIds.forEach(id => {
  test(`Buttons regression test - ${id}`, async ({ page }) => {
    // Isolate the section
    await page.goto(`/ide/styleguide?isolateSection=true#${id}`);

    const sampleSection = page.locator(`#${id}`);

    const buttons = sampleSection.locator('button');
    await expect(buttons, `Button section: '${id}'`).not.toHaveCount(0, {
      timeout: 45000,
    });

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
      await expect(sampleSection).toHaveScreenshot(
        `buttons-focus-section-${id}-${j}${isDisabled ? '-disabled' : ''}.png`
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
        `buttons-hover-section-${id}-${j}${isDisabled ? '-disabled' : ''}.png`
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

  await expect(columns).toHaveCount(6, { timeout: 45000 });

  // Test focus state for each enabled input
  const columnsCount = await columns.count();
  for (let i = 0; i < columnsCount; i += 1) {
    const column = columns.nth(i);
    const inputs = column.locator('input,select,button');

    const inputsCount = await inputs.count();
    let hiddenOffset = 0;

    for (let j = 0; j < inputsCount; j += 1) {
      const input = inputs.nth(j);

      const [tagName, type, isDisabled, isParentHidden] = await input.evaluate(
        el => [
          el.tagName.toLowerCase(),
          el.getAttribute('type'),
          el.hasAttribute('disabled'),
          el.parentElement?.hasAttribute('hidden') ?? false,
        ]
      );

      // Spectrum Radio component uses the `hidden` attribute of the wrapping
      // label to hide the input. Skip these since they aren't visible.
      if (isParentHidden) {
        hiddenOffset += 1;

        // eslint-disable-next-line no-continue
        continue;
      }

      const label = tagName === 'input' ? type ?? 'text' : tagName;

      await input.focus();

      await expect(column).toHaveScreenshot(
        `inputs-focus-col${i}-row${j - hiddenOffset}-${label}${
          isDisabled ? '-disabled' : ''
        }.png`
      );

      if (!isDisabled) {
        await input.blur();
      }
    }
  }
});

test('Dialog with Picker regression test', async ({ page }) => {
  await page.goto('/ide/styleguide?isolateSection=true#sample-section-dialog');

  const sampleSection = page.locator('#sample-section-dialog');
  await expect(sampleSection).toBeVisible({ timeout: 45000 });

  // Open the popover dialog that contains a Picker
  await sampleSection
    .getByRole('button', { name: 'Open Dialog with Picker' })
    .click();

  // Open the Picker's own overlay. Spectrum Picker renders a hidden native
  // <select> that shares the "Fruit" label with the trigger button, so
  // narrow to the button role. The name contains "Fruit" both before
  // ("Select… Fruit") and after selection ("<value> Fruit").
  const picker = page.getByRole('button', { name: /Fruit/ });
  await expect(picker).toBeVisible();
  await picker.click();

  // The Picker listbox renders in a portal, so screenshot the whole page
  const listbox = page.getByRole('listbox');
  await expect(listbox).toBeVisible();

  await expect(page).toHaveScreenshot('dialog-with-picker-open.png');

  // Select an option to verify the Picker is interactive (i.e. the outer
  // Popper does not dismiss on Picker interaction).
  await listbox.getByRole('option', { name: 'Banana' }).click();
  await expect(listbox).toBeHidden();
  await expect(picker).toContainText('Banana');
});
