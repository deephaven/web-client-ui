import React, { type CSSProperties, memo } from 'react';
import type GridMetrics from './GridMetrics';
import type GridModel from './GridModel';

export interface GridAccessibilityLayerProps {
  /** The metrics for the grid, used to position cells */
  metrics: GridMetrics | null;
  /** The model providing cell data */
  model: GridModel;
}

const containerStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
  pointerEvents: 'none',
};

const rowStyle: CSSProperties = {
  display: 'contents',
};

const cellStyle: CSSProperties = {
  position: 'absolute',
  opacity: 0,
  overflow: 'hidden',
  pointerEvents: 'none',
};

/**
 * An invisible accessibility layer that renders DOM elements overlaid on the canvas grid.
 * This enables e2e testing frameworks like Playwright to inspect grid contents and interact
 * with cells via data-testid attributes, as well as providing ARIA semantics for screen readers.
 *
 * The layer follows the WAI-ARIA grid pattern (https://www.w3.org/WAI/ARIA/apg/patterns/grid/):
 * - Container has `role="grid"` with `aria-rowcount` and `aria-colcount`
 * - Column headers are grouped in `role="rowgroup"` rows
 * - Data cells are grouped in `role="row"` elements
 * - Cells have appropriate roles and aria-colindex/aria-rowindex attributes
 *
 * Data-testid attributes:
 * - Data cells: `data-testid="grid-cell-{column}-{row}"`
 * - Column headers: `data-testid="grid-column-header-{column}-{depth}"`
 * - Row headers: `data-testid="grid-row-header-{row}"`
 *
 * All elements have pointer-events: none so clicks pass through to the underlying canvas.
 */
function GridAccessibilityLayer({
  metrics,
  model,
}: GridAccessibilityLayerProps): JSX.Element | null {
  if (!metrics) {
    return null;
  }

  const {
    gridX,
    gridY,
    allColumns,
    allRows,
    allColumnXs,
    allRowYs,
    allColumnWidths,
    allRowHeights,
    modelColumns,
    modelRows,
    rowHeaderWidth,
    columnHeaderHeight,
  } = metrics;

  const { columnHeaderMaxDepth } = model;

  // Build column header rows (one row per depth level)
  const columnHeaderRows: JSX.Element[] = [];
  for (let depth = 0; depth < columnHeaderMaxDepth; depth += 1) {
    const headerY = depth * columnHeaderHeight;
    const headerCells: JSX.Element[] = [];

    for (const column of allColumns) {
      const x = allColumnXs.get(column);
      const width = allColumnWidths.get(column);
      const modelColumn = modelColumns.get(column);

      if (x === undefined || width === undefined || modelColumn === undefined) {
        continue;
      }

      const text = model.textForColumnHeader(modelColumn, depth);

      headerCells.push(
        <div
          key={`col-header-${column}-${depth}`}
          data-testid={`grid-column-header-${column}-${depth}`}
          role="columnheader"
          aria-colindex={column + 1}
          style={{
            ...cellStyle,
            left: gridX + x,
            top: headerY,
            width,
            height: columnHeaderHeight,
          }}
        >
          {text ?? ''}
        </div>
      );
    }

    columnHeaderRows.push(
      <div key={`header-row-${depth}`} role="row" style={rowStyle}>
        {headerCells}
      </div>
    );
  }

  // Build data rows (one row element per visible row)
  const dataRows: JSX.Element[] = [];
  for (const row of allRows) {
    const y = allRowYs.get(row);
    const height = allRowHeights.get(row);
    const modelRow = modelRows.get(row);

    if (y === undefined || height === undefined || modelRow === undefined) {
      continue;
    }

    const rowCells: JSX.Element[] = [];

    // Add row header if present
    if (rowHeaderWidth > 0) {
      const rowHeaderText = model.textForRowHeader(modelRow);
      rowCells.push(
        <div
          key={`row-header-${row}`}
          data-testid={`grid-row-header-${row}`}
          role="rowheader"
          aria-rowindex={row + 1}
          style={{
            ...cellStyle,
            left: 0,
            top: gridY + y,
            width: rowHeaderWidth,
            height,
          }}
        >
          {rowHeaderText}
        </div>
      );
    }

    // Add data cells for this row
    for (const column of allColumns) {
      const x = allColumnXs.get(column);
      const width = allColumnWidths.get(column);
      const modelColumn = modelColumns.get(column);

      if (x === undefined || width === undefined || modelColumn === undefined) {
        continue;
      }

      const text = model.textForCell(modelColumn, modelRow);

      rowCells.push(
        <div
          key={`cell-${column}-${row}`}
          data-testid={`grid-cell-${column}-${row}`}
          role="gridcell"
          aria-colindex={column + 1}
          aria-rowindex={row + 1}
          style={{
            ...cellStyle,
            left: gridX + x,
            top: gridY + y,
            width,
            height,
          }}
        >
          {text}
        </div>
      );
    }

    dataRows.push(
      <div
        key={`row-${row}`}
        role="row"
        aria-rowindex={row + 1}
        style={rowStyle}
      >
        {rowCells}
      </div>
    );
  }

  return (
    <div
      role="grid"
      aria-rowcount={model.rowCount}
      aria-colcount={model.columnCount}
      style={containerStyle}
      data-testid="grid-accessibility-layer"
    >
      {columnHeaderMaxDepth > 0 && (
        <div role="rowgroup">{columnHeaderRows}</div>
      )}
      <div role="rowgroup">{dataRows}</div>
    </div>
  );
}

export default memo(GridAccessibilityLayer);
