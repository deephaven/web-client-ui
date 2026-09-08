import { test, expect, type Locator, type Page } from '@playwright/test';
import { gotoPage, openPlot, openTable } from './utils';
// nested row/column layout of placeholder panels that these tests drive
import testLayout from './deephaven-app-layout.test.json';

/** localStorage key the app persists its workspace under */
const WORKSPACE_STORAGE_KEY = 'deephaven.WorkspaceStorage';

/**
 * Build a persisted workspace that holds the test layout in place of the
 * default one, so a fresh page boots straight into it without going through
 * the import UI. Mirrors the shape `LocalWorkspaceStorage` writes.
 *
 * @returns The serialized workspace to store under `WORKSPACE_STORAGE_KEY`
 */
function makeTestLayoutWorkspace(): string {
  const { layoutConfig, filterSets, links } = testLayout;

  return JSON.stringify({
    data: {
      settings: {},
      layoutConfig,
      filterSets,
      links,
      closed: [],
      pluginDataMap: {},
    },
  });
}

// doesn't execute any server commands, safe to run in parallel
test.describe.configure({ mode: 'parallel' });

type BoundingBox = { x: number; y: number; width: number; height: number };

function isSameBox(a: BoundingBox, b: BoundingBox): boolean {
  return (
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
  );
}

/**
 * Measure an element once its box has stopped changing.
 *
 * Intersection handles are swept and recreated when the splitter topology
 * changes and repositioned on the following animation frame, so a single read
 * can return null for a detached node or a position that is still settling.
 * Two consecutive identical reads mean the layout has settled.
 *
 * @param locator Element to measure
 * @returns The element's settled bounding box
 */
async function stableBoundingBox(locator: Locator): Promise<BoundingBox> {
  let previous: BoundingBox | null | undefined;
  let current: BoundingBox | null | undefined;

  await expect
    .poll(async () => {
      previous = current;
      current = await locator.boundingBox();
      return (
        current != null && previous != null && isSameBox(previous, current)
      );
    })
    .toBe(true);

  if (current == null) {
    throw new Error('Element never reported a bounding box');
  }

  return current;
}

/**
 * Wait for an open modal to finish sliding into place and return it.
 *
 * The dialog mounts stationary and invisible, then slides down 50px as it
 * fades in. Playwright's stability check can pass during the stationary phase,
 * so a click issued then puts mousedown on the button and mouseup wherever the
 * dialog has moved to, and no click event reaches the button.
 *
 * @param page Page showing the modal
 * @returns The settled modal
 */
async function waitForModalSettled(page: Page): Promise<Locator> {
  const modal = page.locator('.modal.show');
  await expect(modal).toBeVisible();

  const dialog = modal.locator('.modal-dialog');
  await expect
    .poll(() => dialog.evaluate(el => getComputedStyle(el).transform))
    .toBe('none');

  return modal;
}

test.describe('tests golden-layout operations', () => {
  // Every test gets its own context whose persisted workspace already holds
  // the test layout, so tests share no state and can run in any order on any
  // worker.
  test.use({
    storageState: async ({ baseURL }, use) => {
      if (baseURL == null) {
        throw new Error('baseURL is required to seed the workspace');
      }

      await use({
        cookies: [],
        origins: [
          {
            origin: new URL(baseURL).origin,
            localStorage: [
              {
                name: WORKSPACE_STORAGE_KEY,
                value: makeTestLayoutWorkspace(),
              },
            ],
          },
        ],
      });
    },
  });

  test.beforeEach(async ({ page }) => {
    await gotoPage(page, '');

    // the seeded workspace means the layout is present on first render
    await expect(
      page.locator('.lm_tab').filter({ has: page.getByText('test-a') })
    ).toHaveCount(1);
  });

  test('golden-layout renders the test layout', async ({ page }) => {
    // general overall visual check of layout
    await expect(page.locator('.lm_root')).toHaveScreenshot();
  });

  test('golden-layout can maximize the first stack', async ({ page }) => {
    await page.getByTitle('Maximize').first().click();
    // visual check for maximized tab
    await expect(page.locator('.lm_root')).toHaveScreenshot();

    // minimizing restores the stack
    await page.getByTitle('Minimize').first().click();
    await expect(page.getByTitle('Minimize')).toHaveCount(0);
  });

  test('golden-layout can use additional tabs menu', async ({ page }) => {
    // open the first additional tab drop down
    await page.getByTitle('Additional tabs').first().click();

    // check snapshot
    await expect(
      page.locator('.lm_tabdropdown_list').locator('visible=true')
    ).toHaveScreenshot();

    // test search
    await page
      .getByPlaceholder('Find tab...')
      .locator('visible=true')
      .fill('test-z');

    // check that drop-down is filtered screenshot
    await expect(
      page.locator('.lm_tabdropdown_list').locator('visible=true')
    ).toHaveScreenshot();

    await page
      .locator('.lm_tabdropdown_list')
      .locator('visible=true')
      .getByText('test-z')
      .click();

    // check that it is shown in header as expected
    // and visuals are styled correctly, scrolled into view etc
    await expect(page.locator('.lm_header').first()).toHaveScreenshot();

    // check that the selected panel is open
    await expect(
      page.locator('.test-z-component').locator('.panel-placeholder')
    ).toHaveText('Component "test-z" is not registered.');
  });

  test('golden-layout can close a tab', async ({ page }) => {
    await page
      .locator('.lm_tab')
      .filter({ has: page.getByText('test-y') })
      .getByLabel('Close tab')
      .click();

    // check that the selected panel is open
    await expect(page.getByText('test-y')).toHaveCount(0);

    // check middle click closes tab
    await page
      .locator('.lm_tab')
      .filter({ has: page.getByText('test-x') })
      .getByLabel('Close tab')
      .click({ button: 'middle' });

    // check that the selected panel is open
    await expect(page.getByText('test-x')).toHaveCount(0);
  });

  test('golden-layout can drag tab to left edge', async ({ page }) => {
    const dragTab = await page
      .locator('.lm_tab')
      .filter({ has: page.getByText('test-z') });

    const dropTargetIndicator = page.locator('.lm_dropTargetIndicator');

    // manual drag so we can take screenshot of indicator
    await dragTab.hover();
    await page.mouse.down();
    await page.mouse.move(10, 100);

    // check that the drop target indicator is visible
    await expect(dropTargetIndicator).toBeVisible();

    // remove the marching ants animation so we can take consistent screen shot
    await dropTargetIndicator.evaluate(element => {
      // eslint-disable-next-line no-param-reassign
      element.style.animation = 'none';
    });

    // check the drop indicator
    await expect(dropTargetIndicator).toHaveScreenshot();

    // check the drag proxy
    await expect(page.locator('.lm_dragProxy')).toHaveScreenshot();

    // drop item
    await page.mouse.up();

    // check new layout
    await expect(page.locator('.lm_root')).toHaveScreenshot();
  });

  test('intersection handle resizes both axes at once', async ({ page }) => {
    // The imported nested row/column layout produces at least one crossing
    // handle where a row splitter meets a column splitter.
    const handle = page.locator('.lm_intersection_splitter').first();
    await expect(handle).toBeVisible();

    const before = await stableBoundingBox(handle);

    const startX = before.x + before.width / 2;
    const startY = before.y + before.height / 2;

    // Drag the crossing diagonally so both the row and column boundaries move.
    await handle.hover();
    await page.mouse.down();
    await page.mouse.move(startX + 80, startY + 80, { steps: 10 });
    await page.mouse.up();

    // After the drop the crossing - and therefore its handle - has moved on
    // both axes, proving a simultaneous 2D resize rather than a 1D one.
    await expect
      .poll(async () => {
        const after = await handle.boundingBox();
        if (after == null) return null;
        return {
          movedX: Math.abs(after.x - before.x) > 10,
          movedY: Math.abs(after.y - before.y) > 10,
        };
      })
      .toEqual({ movedX: true, movedY: true });
  });

  test('dragging a 1D splitter over an intersection does not highlight the cross', async ({
    page,
  }) => {
    const handle = page.locator('.lm_intersection_splitter').first();
    await expect(handle).toBeVisible();
    const handleBox = await stableBoundingBox(handle);

    // Grab a 1D splitter and drag it across the intersection point.
    const splitter = page.locator('.lm_splitter').first();
    await splitter.hover();
    await page.mouse.down();
    await page.mouse.move(
      handleBox.x + handleBox.width / 2,
      handleBox.y + handleBox.height / 2,
      { steps: 10 }
    );

    // While a 1D drag passes over a crossing, the intersection handle stays
    // inert - it must not add its cross highlight (`.lm_intersection_line`).
    await expect(page.locator('.lm_splitter.lm_intersection_line')).toHaveCount(
      0
    );

    await page.mouse.up();
  });

  test('golden-layout can reset layout', async ({ page }) => {
    /**
     * Open panels menu, reset layout, confirm or cancel "Reset Layout" prompt
     *
     * @param confirm Whether to confirm the prompt or cancel it
     */
    async function resetLayout(confirm: boolean) {
      await page.getByTestId('app-main-panels-button').click();
      await page.getByLabel('Reset Layout').click();

      const modal = await waitForModalSettled(page);
      if (confirm) {
        await modal.locator('.btn-danger').filter({ hasText: 'Reset' }).click();
      } else {
        await modal
          .locator('[data-dismiss=modal]')
          .filter({ hasText: 'Cancel' })
          .click();
      }

      await expect(page.locator('.modal')).toHaveCount(0);
    }

    // Reset layout cancelled by user
    await resetLayout(false);

    await expect(
      page.locator('.lm_tab').filter({ has: page.getByText('test-a') })
    ).toHaveCount(1);

    // Reset layout confirmed by user
    await resetLayout(true);

    await expect(
      page.locator('.lm_tab').filter({ has: page.getByText('test-a') })
    ).toHaveCount(0);
  });
});

test.describe('default layout', () => {
  test('golden-layout can import a layout', async ({ page }) => {
    await gotoPage(page, '');

    // the import replaces the default dashboard, which has to be up first
    await expect(page.locator('.lm_tab').first()).toBeVisible();

    await page.getByTestId('app-main-panels-button').click();
    // start listener before click
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('button:has-text("Import Layout")').click();
    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles({
      name: 'deephaven-app-layout.test.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(testLayout)),
    });

    // expect a tab "test-a" to have been successfully loaded
    await expect(
      page.locator('.lm_tab').filter({ has: page.getByText('test-a') })
    ).toHaveCount(1);
  });

  test('reopen last closed panel', async ({ page }) => {
    /**
     * Closes the 4th panel and 2nd panel, in that order
     */
    const closePanelCopies = async () =>
      test.step('Close panel copies', async () => {
        await expect(page.getByLabel('Close tab')).toHaveCount(4);
        await page.getByLabel('Close tab').nth(3).click();
        await expect(page.getByLabel('Close tab')).toHaveCount(3);
        await page.getByLabel('Close tab').nth(1).click();
        await expect(page.getByLabel('Close tab')).toHaveCount(2);
      });

    /**
     * Clicks on a menu option of a panel
     * @param panelName Name of the panel to right-click
     * @param menuName Name of the option in the context menu
     */
    const clickPanelContextMenu = async (panelName: string, menuName: string) =>
      test.step(`Run ${panelName} context menu - ${menuName}`, async () => {
        await page
          .getByText(panelName, { exact: true })
          .click({ button: 'right' });
        await page.getByRole('button', { name: menuName, exact: true }).click();
      });

    await gotoPage(page, '');

    await test.step('Open panels', async () => {
      await openTable(page, 'all_types');
      await openPlot(page, 'simple_plot');
    });

    await clickPanelContextMenu('all_types', 'Copy Panel');
    await clickPanelContextMenu('simple_plot', 'Copy Panel');

    await test.step('Reopen through shortcut', async () => {
      await closePanelCopies();

      await page.keyboard.press('Alt+Shift+T');
      await expect(page.getByText('all_types Copy')).toHaveCount(1);
      await expect(page.getByText('simple_plot Copy')).toHaveCount(0);

      await page.keyboard.press('Alt+Shift+T');
      await expect(page.getByText('all_types Copy')).toHaveCount(1);
      await expect(page.getByText('simple_plot Copy')).toHaveCount(1);
    });

    await test.step('Reopen through context menu', async () => {
      await closePanelCopies();

      await clickPanelContextMenu('simple_plot', 'Re-open closed panel');
      await expect(page.getByText('all_types Copy')).toHaveCount(0);
      await expect(page.getByText('simple_plot Copy')).toHaveCount(1);

      await clickPanelContextMenu('all_types', 'Re-open closed panel');
      await expect(page.getByText('all_types Copy')).toHaveCount(1);
      await expect(page.getByText('simple_plot Copy')).toHaveCount(1);
    });
  });
});
