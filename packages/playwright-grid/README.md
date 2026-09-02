# @deephaven/playwright-grid

Playwright helpers for testing the Deephaven grid.

The grid renders to a canvas, so its contents are not in the DOM. `@deephaven/grid`
can describe its viewport on request, rendering an element per visible cell into
its canvas fallback content. This package drives that on demand snapshot, which
lets tests look up cells by column header name and click them by their real
on-screen position.

## Usage

```ts
import { test } from '@playwright/test';
import {
  clickCell,
  clickColumnHeader,
  expectCellText,
  waitForGrid,
} from '@deephaven/playwright-grid';

test('sorts by timestamp', async ({ page }) => {
  const grid = page.locator('.iris-grid');

  await waitForGrid(grid);
  await expectCellText(grid, 'Timestamp', 0, '2021-01-01T00:00:00.000 UTC');

  // Columns can be referenced by header text or by visible index
  await clickCell(grid, 'Timestamp', 5, { modifiers: ['Shift'] });
  await clickColumnHeader(grid, 'Timestamp');
});
```

Every helper accepts a locator for the grid canvas or any element containing it.

Columns and rows are addressed by _visible_ index, i.e. what is currently on
screen. Anything outside of the viewport is not addressable, so scroll it into
view first.

Each helper turns the grid's accessibility snapshot on before it reads. Once on,
the grid keeps the snapshot in sync with the viewport, so a helper never reports
a viewport the grid has already scrolled away from.

## API

| Function                                    | Description                                                        |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `waitForGrid(grid)`                         | Wait until the grid has rendered and its contents can be read      |
| `getGridDescription(grid)`                  | The grid's description of its size, selection, and viewport        |
| `getColumnHeaderNames(grid)`                | The text of every column header in the viewport                    |
| `getVisibleRows(grid)`                      | The visible row indexes in the viewport                            |
| `getCellText(grid, column, row)`            | The text rendered in a cell                                        |
| `getCellRect(grid, column, row)`            | The bounds of a cell, relative to the top left of the canvas       |
| `getCellLocation(grid, column, row)`        | The centre of a cell in page coordinates, for `page.mouse` actions |
| `clickCell(grid, column, row, options?)`    | Click the centre of a cell                                         |
| `getColumnHeaderText(grid, column)`         | The text of a column header                                        |
| `clickColumnHeader(grid, column, options?)` | Click the centre of a column header                                |
| `expectCellText(grid, column, row, text)`   | Assert a cell's text, retrying until it matches                    |
| `expectColumnHeaderNames(grid, names)`      | Assert the visible column headers, retrying until they match       |
