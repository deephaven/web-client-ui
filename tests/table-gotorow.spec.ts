import { test, expect, Page } from '@playwright/test';
import { pasteInMonaco } from './utils';

const customTableCommand = `
from deephaven import empty_table

size = 20

ordered_int_and_offset = empty_table(20).update([
    "MyString=(\`str\`+i)",
    "MyInt1=(i+100)",
    "MyInt2=(i+200)",
])`;

async function setColumnAndExpectInputValue({
  page,
  setInputValueTo,
  setColumnNameTo,
  expectInputValueToBe,
}: {
  page: Page;
  setInputValueTo?: string;
  setColumnNameTo: string;
  expectInputValueToBe: string;
}) {
  console.log({ setInputValueTo, setColumnNameTo, expectInputValueToBe });
  if (setInputValueTo !== undefined) {
    const inputValue = await page.locator('input[aria-label="Value Input"]');
    await expect(inputValue).toHaveCount(1);
    await inputValue.fill(setInputValueTo);
  }

  const columnSelect = await page.locator('#column-name-select');
  await expect(columnSelect).toHaveCount(1);
  await columnSelect.selectOption(setColumnNameTo);

  const inputValue = await page.locator('input[aria-label="Value Input"]');
  await expect(inputValue).toHaveCount(1);
  await expect(inputValue).toHaveValue(expectInputValueToBe);
}

async function waitForLoadingDone(page: Page) {
  await expect(
    page.locator('.iris-grid .iris-grid-loading-status')
  ).toHaveCount(0);
}

test.describe.configure({ mode: 'serial' });

test.describe('GoToRow change column', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('');
    await waitForLoadingDone(page);

    // create the table
    const consoleInput = page.locator('.console-input');
    await pasteInMonaco(consoleInput, customTableCommand);
    await page.keyboard.press('Enter');

    // wait for panel to show and finish loading
    await expect(page.locator('.iris-grid-panel')).toHaveCount(1);
    await expect(page.locator('.iris-grid-panel .loading-spinner')).toHaveCount(
      0
    );

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

  test('unmodified value, different column type', async () => {
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

  test('modified set value, different column type', async () => {
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

  test('unmodified set value, same column type', async () => {
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

  test('modified set value, same column type', async () => {
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
});
