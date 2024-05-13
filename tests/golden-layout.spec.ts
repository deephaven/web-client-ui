import { test, expect, Page } from '@playwright/test';
import { gotoPage, openPlot, openTable } from './utils';

// Run tests serially
test.describe.configure({ mode: 'serial' });

test.describe('tests golden-layout operations', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('');

    // load a custom layout for the tests
    await page.getByTestId('app-main-panels-button').click();
    // start listener before click
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('button:has-text("Import Layout")').click();
    const fileChooser = await fileChooserPromise;
    // load a test layout that uses the panel placeholder
    await fileChooser.setFiles('tests/deephaven-app-layout.test.json');

    // expect a tab "test-a" to have been successfully loaded
    await expect(
      page.locator('.lm_tab').filter({ has: page.getByText('test-a') })
    ).toHaveCount(1);
  });

  test.afterAll(async () => {
    /**
     * Open panels menu, reset layout, confirm or cancel "Reset Layout" prompt
     */
    async function resetLayout(confirm: boolean) {
      await page.getByTestId('app-main-panels-button').click();
      await page.getByLabel('Reset Layout').click();

      if (confirm) {
        await page
          .locator('.modal .btn-danger')
          .filter({ hasText: 'Reset' })
          .click();
      } else {
        await page
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

  test('golden-layout can import a layout', async () => {
    // general overall visual check of layout
    await expect(page.locator('.lm_root')).toHaveScreenshot();
  });

  test('golden-layout can maximize the first stack', async () => {
    await page.getByTitle('Maximize').first().click();
    // visual check for maximized tab
    await expect(page.locator('.lm_root')).toHaveScreenshot();

    // minimize it again for next test
    await page.getByTitle('Minimize').first().click();
    await expect(page.getByTitle('Minimize')).toHaveCount(0);
  });

  test('golden-layout can use additional tabs menu', async () => {
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

  test('golden-layout can close a tab', async () => {
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

  test('golden-layout can drag tab to left edge', async () => {
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
});

test('reopen last closed panel', async ({ page }) => {
  /**
   * Closes the 4th panel and 2nd panel, in that order
   */
  const closePanelCopies = async () =>
    test.step('Close panel copies', async () => {
      await expect(page.getByLabel('Close tab')).toHaveCount(4);
      await page.getByLabel('Close tab').nth(3).click();
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
