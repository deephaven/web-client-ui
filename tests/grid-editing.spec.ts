import { expect, test, type Locator, type Page } from '@playwright/test';

// Isolated styleguide section (see packages/code-studio/src/styleguide/Grids.tsx)
// that renders an editable grid and lists every cell save and error.
const sectionId = 'sample-section-grids-edit-save-log';

// Matches the theme in EditSaveLogExample.tsx
const COLUMN_WIDTH = 100;
const ROW_HEIGHT = 30;
const COLUMN_HEADER_HEIGHT = 30;

function cellPosition(column: number, row: number): { x: number; y: number } {
  return {
    x: column * COLUMN_WIDTH + COLUMN_WIDTH / 2,
    y: COLUMN_HEADER_HEIGHT + row * ROW_HEIGHT + ROW_HEIGHT / 2,
  };
}

let grid: Locator;
let saves: Locator;
let errors: Locator;
let editor: Locator;

async function startEditing(
  page: Page,
  column: number,
  row: number,
  value: string
): Promise<void> {
  await grid.dblclick({ position: cellPosition(column, row) });
  await expect(editor).toBeFocused();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type(value);
}

test.beforeEach(async ({ page }) => {
  await page.goto(`/ide/styleguide?isolateSection=true#${sectionId}`);

  const section = page.locator(`#${sectionId}`);
  grid = section.locator('canvas.grid-canvas');
  saves = section.getByTestId('edit-save-log-saves').locator('li');
  errors = section.getByTestId('edit-save-log-errors').locator('li');
  editor = section.locator('.grid-cell-input-field');

  await expect(grid).toBeVisible({ timeout: 45000 });
});

['Enter', 'Shift+Enter', 'Tab', 'Shift+Tab'].forEach(key => {
  test(`saves an edit once when committed with ${key}`, async ({ page }) => {
    await startEditing(page, 1, 1, 'Edited');
    await page.keyboard.press(key);

    await expect(editor).toHaveCount(0);
    await expect(grid).toBeFocused();
    await expect(saves).toHaveText(['1,1=Edited']);
  });
});

['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].forEach(key => {
  test(`saves a quick edit once when committed with ${key}`, async ({
    page,
  }) => {
    await grid.click({ position: cellPosition(1, 1) });
    await page.keyboard.type('Q');
    await expect(editor).toBeFocused();
    await page.keyboard.press(key);

    await expect(editor).toHaveCount(0);
    await expect(grid).toBeFocused();
    await expect(saves).toHaveText(['1,1=Q']);
  });
});

test('saves an edit once when the editor loses focus', async ({ page }) => {
  await startEditing(page, 1, 1, 'Edited');
  await grid.click({ position: cellPosition(3, 3) });

  await expect(editor).toHaveCount(0);
  await expect(saves).toHaveText(['1,1=Edited']);
});

test('fills only the selected cells when committed with Ctrl+Enter', async ({
  page,
}) => {
  await grid.click({ position: cellPosition(1, 1) });
  await grid.click({ position: cellPosition(1, 2), modifiers: ['Shift'] });
  await page.keyboard.type('Filled');
  await expect(editor).toBeFocused();
  await page.keyboard.press('ControlOrMeta+Enter');

  await expect(editor).toHaveCount(0);
  await expect(saves).toHaveText(['1,1=Filled', '1,2=Filled']);
});

test('does not save a cancelled edit', async ({ page }) => {
  await startEditing(page, 1, 1, 'Edited');
  await page.keyboard.press('Escape');

  await expect(editor).toHaveCount(0);
  await expect(grid).toBeFocused();
  await expect(saves).toHaveCount(0);
});

test('reports a failed save once', async ({ page }) => {
  await startEditing(page, 1, 1, 'fail');
  await page.keyboard.press('Enter');

  await expect(errors).toHaveText(['Failed to save fail']);
  await expect(saves).toHaveText(['1,1=fail']);
});
