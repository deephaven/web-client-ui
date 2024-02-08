import { test, expect, Page } from '@playwright/test';
import { openTable } from './utils';

// relies on previous
test.describe.configure({ mode: 'serial' });

async function setColumnAndExpectInputValue({
  page,
  setInputValueTo,
  toggleGoToRow = false,
  setColumnNameTo,
  expectInputValueToBe,
}: {
  page: Page;
  setInputValueTo?: string;
  toggleGoToRow?: boolean;
  setColumnNameTo: string;
  expectInputValueToBe: string;
}) {
  // get the input value and set it
  if (setInputValueTo !== undefined) {
    const inputValue = page.locator('input[aria-label="Value Input"]');
    await expect(inputValue).toHaveCount(1);
    await inputValue.fill(setInputValueTo);
    await page.waitForTimeout(300);
  }

  if (toggleGoToRow) {
    await page.keyboard.down('Control');
    await page.keyboard.press('g');
    await page.keyboard.press('g');
    await page.keyboard.up('Control');
  }

  // change the column select to the target
  const columnSelect = page.locator('#column-name-select');
  await expect(columnSelect).toHaveCount(1);
  await columnSelect.selectOption(setColumnNameTo);

  // check the input value
  const inputValue = page.locator('input[aria-label="Value Input"]');
  await expect(inputValue).toHaveCount(1);
  await expect(inputValue).toHaveValue(expectInputValueToBe);
}

async function waitForLoadingDone(page: Page) {
  await expect(
    page.locator('.iris-grid .iris-grid-loading-status')
  ).toHaveCount(0);
}

test.describe('GoToRow change column', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await openTable(page, 'ordered_int_and_offset');

    // get the grid
    const grid = await page.locator('.iris-grid-panel .iris-grid');
    await waitForLoadingDone(page);
    const gridLocation = await grid.boundingBox();
    expect(gridLocation).not.toBeNull();
    if (gridLocation === null) return;
    // activate GoToRow
    const columnHeaderHeight = 30;
    await page.mouse.click(
      gridLocation.x + 1,
      gridLocation.y + 1 + columnHeaderHeight
    );
    await page.keyboard.down('Control');
    await page.keyboard.press('g');
    await page.keyboard.up('Control');

    // wait for GoToRow bar to show
    await expect(page.locator('.iris-grid-bottom-bar')).toHaveCount(1);
  });

  test('unmodified set value, different column type > change value', async () => {
    await setColumnAndExpectInputValue({
      page,
      setColumnNameTo: 'MyInt1',
      expectInputValueToBe: '100',
    });
    await setColumnAndExpectInputValue({
      page,
      setColumnNameTo: 'MyString',
      expectInputValueToBe: 'str0',
    });
  });

  test('modified set value, different column type > change value', async () => {
    await setColumnAndExpectInputValue({
      page,
      setInputValueTo: 'str5',
      setColumnNameTo: 'MyInt1',
      expectInputValueToBe: '105',
    });
    await setColumnAndExpectInputValue({
      page,
      setInputValueTo: '110',
      setColumnNameTo: 'MyString',
      expectInputValueToBe: 'str10',
    });
  });

  test('unmodified set value, same column type > change value', async () => {
    // set to int1 first (from string)
    await setColumnAndExpectInputValue({
      page,
      setColumnNameTo: 'MyInt1',
      expectInputValueToBe: '110',
    });
    await setColumnAndExpectInputValue({
      page,
      setColumnNameTo: 'MyInt2',
      expectInputValueToBe: '210',
    });
    await setColumnAndExpectInputValue({
      page,
      setColumnNameTo: 'MyInt1',
      expectInputValueToBe: '110',
    });
  });

  test('modified set value, same column type > keep value', async () => {
    await setColumnAndExpectInputValue({
      page,
      setInputValueTo: '115',
      setColumnNameTo: 'MyInt2',
      expectInputValueToBe: '115',
    });
    await setColumnAndExpectInputValue({
      page,
      setInputValueTo: '216',
      setColumnNameTo: 'MyInt1',
      expectInputValueToBe: '216',
    });
  });

  test('modified set value, same column type, toggled GoToRow > change value', async () => {
    await setColumnAndExpectInputValue({
      page,
      setInputValueTo: '110',
      toggleGoToRow: true,
      setColumnNameTo: 'MyInt2',
      expectInputValueToBe: '210',
    });
    await setColumnAndExpectInputValue({
      page,
      setInputValueTo: '212',
      toggleGoToRow: true,
      setColumnNameTo: 'MyInt1',
      expectInputValueToBe: '112',
    });
  });
});
