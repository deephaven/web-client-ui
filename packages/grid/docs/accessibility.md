# Accessibility

Grid draws its contents to an [HTML canvas](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas) rather than to DOM elements. This is what allows it to display quadrillions of rows at 60fps, but it also means there are no per-cell elements for screen readers, browser automation, or other external tooling to inspect.

To bridge that gap, Grid describes its contents in its canvas fallback content. The description is generated from the model and the metrics of the most recent canvas draw, so it always reflects what is actually on screen.

## Canvas fallback content

The children of a `<canvas>` element are its fallback content: they are never painted, but assistive technology reads them in place of the pixels. Grid renders a toggle button there, which turns a **snapshot** on and off: a description of the grid size, selection, and viewport, plus a table of the visible cells and column headers.

```text
Grid with 100 rows and 3 columns. 2 rows selected. Showing rows 1 to 20, columns x, y, z.
```

Reconciling an element per cell on every frame would be far too slow for a grid nobody is inspecting, so the snapshot is off by default and nothing is described until it is turned on. While it is on, it is regenerated on every draw and tracks the viewport as the grid scrolls. The button reads "Describe the grid contents" when off and "Hide the grid contents" when on, carries `aria-pressed`, and is kept out of the tab order so sighted keyboard users are not sent to an element they cannot see.

The snapshot is a plain `<table>` rather than a set of `div`s with ARIA roles. Fallback content is never laid out, so native table semantics are the most reliable thing to hand a screen reader, and `<th scope="col">` associates each cell with its column for free. It is a `table` and not a `grid`, because `grid` promises cell-by-cell keyboard navigation that only the canvas implements. `aria-rowcount` and `aria-colcount` describe the whole grid, while the table only holds the viewport.

## Snapshot markup

```html
<canvas class="grid-canvas">
  <div>
    <button
      type="button"
      tabindex="-1"
      aria-pressed="true"
      data-grid-a11y-describe
    >
      Hide the grid contents
    </button>
    <div data-grid-a11y-snapshot>
      <p role="status">
        Grid with 100 rows and 3 columns. Showing rows 1 to 20, columns x, y, z.
      </p>
      <table aria-rowcount="101" aria-colcount="3">
        <thead>
          <tr aria-rowindex="1">
            <th
              scope="col"
              aria-colindex="1"
              data-grid-column="0"
              data-grid-header="x"
              data-grid-rect="30,0,100,30"
            >
              x
            </th>
          </tr>
        </thead>
        <tbody>
          <tr aria-rowindex="2">
            <td
              aria-colindex="1"
              data-grid-column="0"
              data-grid-row="0"
              data-grid-rect="30,30,100,19"
            >
              0
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</canvas>
```

The attribute names are exported as `GRID_A11Y_ATTRIBUTES` and typed as `GridA11yAttributes`, so external tooling can declare them without importing the grid runtime:

| Attribute                 | On                | Description                                                              |
| ------------------------- | ----------------- | ------------------------------------------------------------------------ |
| `data-grid-a11y-describe` | button            | The button that toggles the snapshot on and off                          |
| `data-grid-a11y-snapshot` | snapshot root     | Present only while the snapshot is on                                    |
| `data-grid-column`        | headers and cells | Visible column index                                                     |
| `data-grid-row`           | cells             | Visible row index                                                        |
| `data-grid-header`        | headers           | Header text, for looking a column up by name                             |
| `data-grid-rect`          | headers and cells | `x,y,width,height` relative to the top left of the canvas, in CSS pixels |

Rows and columns that are collapsed to nothing on screen are left out, and the column header rect covers the bottom level of the header, which is the row that handles sorting. For a grid with column groups, higher level headers are not in the snapshot.

## Locating a cell on screen

The snapshot elements are never laid out, so they have no geometry of their own. Giving each cell a real box would mean styling and laying out an element per cell on every frame, which is exactly the cost the canvas exists to avoid, so each element carries the bounds the grid already computed as a `data-grid-rect` attribute instead.

`data-grid-rect` is relative to the top left of the canvas. Add the canvas position to convert to page coordinates, for example to dispatch a click at the centre of a cell:

```ts
const [x, y, width, height] = cell
  .getAttribute('data-grid-rect')
  .split(',')
  .map(Number);
const box = canvas.getBoundingClientRect();

const clientX = box.x + x + width / 2;
const clientY = box.y + y + height / 2;
```

## Testing with Playwright

[@deephaven/playwright-grid](https://www.npmjs.com/package/@deephaven/playwright-grid) wraps the snapshot in helpers for end-to-end tests, so tests can address cells by column name instead of by pixel offset. Each helper turns the snapshot on before it reads, so it never sees a stale viewport:

```ts
import { test } from '@playwright/test';
import {
  clickCell,
  clickColumnHeader,
  expectCellText,
  waitForGrid,
} from '@deephaven/playwright-grid';

test('sorts by clicking a column header', async ({ page }) => {
  const grid = page.locator('.iris-grid');

  await waitForGrid(grid);
  await expectCellText(grid, 'x', 0, '0');

  // Two clicks toggles the sort to descending
  await clickColumnHeader(grid, 'x');
  await clickColumnHeader(grid, 'x');

  await expectCellText(grid, 'x', 0, '99');
});

test('shift clicks a cell to extend a selection', async ({ page }) => {
  const grid = page.locator('.iris-grid');

  await clickCell(grid, 'x', 0);
  await clickCell(grid, 'x', 5, { modifiers: ['Shift'] });
});
```

Each helper accepts a locator for the grid canvas or for any element containing it, so a panel locator such as `.iris-grid` works. Columns can be given as a header name or a visible index, and click options are passed through to Playwright.

## Generating a snapshot in code

The fallback content is rendered from two functions, which are also useful on their own in unit tests:

| Function                                                 | Description                                                         |
| -------------------------------------------------------- | ------------------------------------------------------------------- |
| `getGridA11ySummary(model, selectedRanges)`              | The one line summary of the grid size and selection                 |
| `createGridA11ySnapshot(model, metrics, selectedRanges)` | The text and bounds of every column header and cell in the viewport |
