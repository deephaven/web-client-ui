import { Locator, expect, Page } from '@playwright/test';
import shortid from 'shortid';

export enum TableTypes {
  Number,
  StringAndNumber,
  AllTypes,
}

/**
 * Generate a unique python variable name
 * @param prefix Prefix to give the variable name
 * @returns A unique string that is a valid python variable name
 */
export function generateVarName(prefix = 'v'): string {
  // Don't allow a `-` in variable names
  let id: string;
  do {
    id = shortid();
  } while (id.includes('-'));
  return `${prefix}_${id}`;
}

/**
 * Create a command that creates a table with three columns, x/y/z
 * @param tableName Name of the variable to assign the table to
 * @returns String of the command to create a table
 */
export function makeTableCommand(
  tableName = generateVarName('t'),
  type = TableTypes.Number
): string {
  switch (type) {
    case TableTypes.AllTypes:
      return (
        `from deephaven import empty_table, time_table
size = 20
scale = 999
${tableName} = empty_table(size).update([
"String=(i%11==0? null : ` +
        '`a`' +
        `+(int)(scale*(i%2==0? i+1 : 1)))",
"Int=(i%12==0 ? null : (int)(scale*(i*2-1)))",
"Long=(i%13==0 ? null : (long)(scale*(i*2-1)))",
"Float=(float)(i%14==0 ? null : i%10==0 ? 1.0F/0.0F: i%5==0 ? -1.0F/0.0F : (float) scale*(i*2-1))",
"Double=(double)(i%16==0 ? null : i%10==0 ? 1.0D/0.0D: i%5==0 ? -1.0D/0.0D : (double) scale*(i*2-1))",
"Bool = (i%17==0 ? null : (int)(i)%2==0)",
"Char = (i%18==0 ? null : new Character((char) (((26+i*i)%26)+97)) )",
"Short=(short)(i%19==0 ? null : (int)(scale*(i*2-1)))",
"BigDec=(i%21==0 ? null : new java.math.BigDecimal(scale*(i*2-1)))",
"BigInt=(i%22==0 ? null : new java.math.BigInteger(Integer.toString((int)(scale*(i*2-1)))))",
"Byte=(Byte)(i%19==0 ? null : new Byte( Integer.toString((int)(i))))",
])`
      );
    case TableTypes.StringAndNumber:
      return `from deephaven import new_table
from deephaven.column import string_col, double_col

${tableName} = new_table([
double_col("Doubles", [3.1, 5.45, -1.0, 1.0, 3.0, 4.20]),
string_col("Strings", ["Creating", "New", "Tables", "Tables", "New", "Creating"])
])`;
    case TableTypes.Number:
    default:
      return `from deephaven import empty_table
${tableName} = empty_table(100).update(["x=i", "y=Math.sin(i)", "z=Math.cos(i)"])`;
  }
}

/**
 * Types into monaco input and avoids autocomplete suggestions.
 * Clicks the monaco input provided to give it focus to start.
 * @param locator Locator to use for monaco editor
 * @param text Text to be typed, with carriage returns
 */
export async function typeInMonaco(
  locator: Locator,
  text: string
): Promise<void> {
  const page = locator.page();
  const splitByLine = text.split('\n');

  // Give the monaco editor focus so we can start typing
  await locator.click();
  for (let i = 0; i < splitByLine.length; i += 1) {
    /* eslint-disable no-await-in-loop */
    await page.keyboard.type(splitByLine[i]);
    // Pressing space and then backspace escapes any autocomplete suggestions that may appear
    // Pressing shift+Enter moves the cursor to a new line
    await page.keyboard.press(' ', { delay: 50 });
    await page.keyboard.press('Backspace', { delay: 50 });
    await page.keyboard.press('Shift+Enter', { delay: 50 });

    // Automatic indenting can screw up some of our commands, so delete any automatic indent - we'll put our own indent there with the copied command
    await page.keyboard.press('Shift+Home', { delay: 50 });
    await page.keyboard.press('Delete', { delay: 50 });
    /* eslint-enable no-await-in-loop */
  }
}

/**
 * Pastes text into a monaco input
 * @param locator Locator to use for monaco editor
 * @param text Text to be pasted
 */
export async function pasteInMonaco(
  locator: Locator,
  text: string
): Promise<void> {
  const browserName = locator.page().context().browser()?.browserType().name();
  if (browserName === 'firefox') {
    await typeInMonaco(locator, text);
  } else {
    await locator.locator('textarea').evaluate(async (element, evalText) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', evalText);
      const clipboardEvent = new ClipboardEvent('paste', {
        clipboardData,
      });
      element.dispatchEvent(clipboardEvent);
    }, text);
  }

  if (text.length) {
    await expect(locator.locator('textarea')).not.toBeEmpty();
  }
}

/**
 * Wait for loading status of iris grid to disappear
 * @param page
 */

export async function waitForLoadingDone(page: Page, tableNumber = 0) {
  await expect(
    page
      .locator('.iris-grid')
      .nth(tableNumber)
      .locator('.iris-grid-loading-status')
  ).toHaveCount(0);
}

/**
 * Drags element to target and waits for drop indicator to show before releasing. Origin is the top-left of the page.
 *
 * Note: Can slow down drag by increasing the # of steps. Webkit is especially finicky if the drag happens too quick
 * Not too sure why but if this is no longer the case the steps param can be removed
 *
 * @param element Locator for element to be dragged
 * @param target Locator for element to drag to
 * @param targetIndicator Locator for droppable area that shows a dropping state
 * @param offsetY Vertical adjustment from destination element
 * @param steps Intermediate mouse move events on the way to destination
 */
export async function dragComponent(
  element: Locator,
  target: Locator,
  targetIndicator: Locator,
  offsetY = 0,
  steps = 100
) {
  const page = element.page();
  const destinationPos = await target.boundingBox();
  if (destinationPos === null) throw new Error('element not found');

  await expect(targetIndicator).toHaveCount(0);

  await element.hover();
  await page.mouse.down();
  await page.mouse.move(
    destinationPos.x + destinationPos.width / 2,
    destinationPos.y + destinationPos.height / 2 + offsetY,
    {
      steps,
    }
  );

  await expect(targetIndicator).not.toHaveCount(0);
  await page.mouse.up();
  await expect(targetIndicator).toHaveCount(0);

  await waitForLoadingDone(page);
}

/**
 * Open the specified table option in the table sidebar
 * @param page Test page to execute on
 * @param tableOption Name of the table option to open.
 */
export async function openTableOption(
  page: Page,
  tableOption: string
): Promise<void> {
  await expect(page.getByText('Table Options')).toHaveCount(1);
  await page.locator(`data-testid=menu-item-${tableOption}`).click();

  // Wait until the table option has fully appeared, by checking that the top level menu is no longer visible
  await expect(page.getByText('Table Options')).toHaveCount(0);
}

export default {
  generateVarName,
  pasteInMonaco,
  typeInMonaco,
  waitForLoadingDone,
  dragComponent,
  openTableOption,
};
