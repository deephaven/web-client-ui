import { test, expect, Page } from '@playwright/test';
import { gotoPage, openTable } from './utils';

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
  setInputValueTo?: { value: string; expectedRowNumber: string };
  toggleGoToRow?: boolean;
  setColumnNameTo: string;
  expectInputValueToBe: string;
}) {
  // get the input value and set it
  if (setInputValueTo !== undefined) {
    const inputValue = page.locator('input[aria-label="Value Input"]');
    await expect(inputValue).toHaveCount(1);
    await inputValue.fill(setInputValueTo.value);
    // Typing a value triggers a debounced, server-side seek that moves the
    // grid cursor. The column change below reads the value from the cursor
    // row, so wait for the seek to land (the row input tracks the cursor).
    await expect(page.getByTestId('goto-row-input')).toHaveValue(
      setInputValueTo.expectedRowNumber
    );
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
    await gotoPage(page, '');
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
      setInputValueTo: { value: 'str5', expectedRowNumber: '6' },
      setColumnNameTo: 'MyInt1',
      expectInputValueToBe: '105',
    });
    await setColumnAndExpectInputValue({
      page,
      setInputValueTo: { value: '110', expectedRowNumber: '11' },
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
      setInputValueTo: { value: '115', expectedRowNumber: '16' },
      setColumnNameTo: 'MyInt2',
      expectInputValueToBe: '115',
    });
    await setColumnAndExpectInputValue({
      page,
      setInputValueTo: { value: '216', expectedRowNumber: '17' },
      setColumnNameTo: 'MyInt1',
      expectInputValueToBe: '216',
    });
  });

  test('modified set value, same column type, toggled GoToRow > change value', async () => {
    await setColumnAndExpectInputValue({
      page,
      setInputValueTo: { value: '110', expectedRowNumber: '11' },
      toggleGoToRow: true,
      setColumnNameTo: 'MyInt2',
      expectInputValueToBe: '210',
    });
    await setColumnAndExpectInputValue({
      page,
      setInputValueTo: { value: '212', expectedRowNumber: '13' },
      toggleGoToRow: true,
      setColumnNameTo: 'MyInt1',
      expectInputValueToBe: '112',
    });
  });
});
