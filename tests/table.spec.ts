import { test, expect, Page } from '@playwright/test';
import { generateVarName } from './utils';

// Run tests serially since they all use the same table
test.describe.configure({ mode: 'serial' });

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await page.goto('http://localhost:4000/');
});

test.afterAll(async () => {
  await page.close();
});

test('can open a simple table', async () => {
  const consoleInput = page.locator('.console-input');
  await consoleInput.click();

  // Enter a command that creates a table with three columns, showing x/y/z
  const tableName = generateVarName();
  await page.keyboard.type(
    `from deephaven import empty_table\n${tableName} = empty_table(100).update(["x=i", "y=Math.sin(i)", "z=Math.cos(i)"])`
  );
  await page.keyboard.press('Enter');

  // Wait for the panel to show
  await expect(page.locator('.iris-grid-panel')).toHaveCount(1);

  // Wait until it's done loading
  await expect(page.locator('.iris-grid-panel .loading-spinner')).toHaveCount(
    0
  );

  // Model is loaded, need to make sure table data is also loaded
  await expect(
    page.locator('.iris-grid .iris-grid-loading-status')
  ).toHaveCount(0);

  // Now we should be able to check the snapshot
  await expect(page.locator('.iris-grid-panel .iris-grid')).toHaveScreenshot();
});

test.describe('tests table operations', () => {
  test.beforeEach(async () => {
    const tableOperationsMenu = page.locator(
      'data-testid=btn-iris-grid-settings-button-table'
    );
    await tableOperationsMenu.click();

    // Wait for Table Options menu to show
    await expect(page.locator('.table-sidebar')).toHaveCount(1);
  });

  test('can download table successfully', async () => {
    // open Download CSV panel
    await page.locator('data-testid=menu-item-Download CSV').click();

    const downloadButton = page.locator(
      'data-testid=btn-csv-exporter-download'
    );
    expect(downloadButton).toHaveCount(1);

    // try renaming file before downloading
    await page.locator('data-testid=input-csv-exporter-file-name').click();
    await page.keyboard.press('Control+a');
    await page.keyboard.type('sin-and-cos.csv');

    downloadButton.click();

    // Wait for download to complete
    await expect(
      page.locator('.progress.progress-bar-striped.progress-bar-animated')
    ).toHaveCount(0);

    await expect(
      page.locator('.progress .progress-bar.bg-success')
    ).toHaveCount(1);

    // Check snapshot
    await expect(
      page.locator('.iris-grid .navigation-page')
    ).toHaveScreenshot();

    // Close the download panel
    await page.locator('data-testid=btn-page-close').click();
    await expect(page.locator('.table-sidebar')).toHaveCount(0);
  });

  // test('quick filters', async () => {
  //   // turn quick filters on
  //   const quickFiltersItem = page.locator(
  //     'data-testid=menu-item-Quick Filters'
  //   );
  //   await quickFiltersItem.click();

  //   // wait for toggle to switch to 'on'
  //   await expect(
  //     quickFiltersItem.locator('.btn.btn-switch.active')
  //   ).toHaveCount(1);

  //   // Open the quick filters panel from the table (pick the 'y' column)
  //   // This does not work at the moment, likely due to HTML canvas testing issues
  //   await page.click('.iris-grid-column .grid-wrapper > div:nth-child(4)', {
  //     force: true,
  //   });

  //   // wait for the panel to open
  //   await expect(quickFiltersItem.locator('button')).toHaveCount(1);

  //   // Apply filter (greater than 0)
  //   await page.locator('.advanced-filter-creator .form-control').click();
  //   await page.locator('text=greater than').click();
  //   await page.locator('placeholder=Enter value').click();
  //   await page.keyboard.type('0');

  //   // wait for filter adding to appear
  //   await expect(
  //     page.locator('.advanced-filter-creator .add-filter-item')
  //   ).toHaveCount(1);

  //   // Apply additional filter (OR equal to 0)
  //   await page.locator('button:has-text("OR")').click();
  //   await page.locator('.advanced-filter-creator .form-control').click();
  //   await page.locator('text=is equal to').click();
  //   await page.locator('placeholder=Enter value').click();
  //   await page.keyboard.type('0');

  //   await page.locator('button:has-text("Done")').click();

  //   // Check snapshot
  //   await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

  //   // Close the download panel
  //   await page.locator('data-testid=btn-page-close').click();
  // });
});
