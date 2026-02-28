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
 * The layer renders:
 * - Data cells with `data-testid="grid-cell-{column}-{row}"`
 * - Column headers with `data-testid="grid-column-header-{column}-{depth}"`
 * - Row headers with `data-testid="grid-row-header-{row}"`
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

  const dataCells: JSX.Element[] = [];
  const columnHeaders: JSX.Element[] = [];
  const rowHeaders: JSX.Element[] = [];

  // Render data cells
  for (const column of allColumns) {
    const x = allColumnXs.get(column);
    const width = allColumnWidths.get(column);
    const modelColumn = modelColumns.get(column);

    if (x === undefined || width === undefined || modelColumn === undefined) {
      continue;
    }

    for (const row of allRows) {
      const y = allRowYs.get(row);
      const height = allRowHeights.get(row);
      const modelRow = modelRows.get(row);

      if (y === undefined || height === undefined || modelRow === undefined) {
        continue;
      }

      const text = model.textForCell(modelColumn, modelRow);

      dataCells.push(
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
  }

  // Render column headers for all depths
  for (let depth = 0; depth < columnHeaderMaxDepth; depth += 1) {
    const headerY = depth * columnHeaderHeight;

    for (const column of allColumns) {
      const x = allColumnXs.get(column);
      const width = allColumnWidths.get(column);
      const modelColumn = modelColumns.get(column);

      if (x === undefined || width === undefined || modelColumn === undefined) {
        continue;
      }

      const text = model.textForColumnHeader(modelColumn, depth);

      columnHeaders.push(
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
  }

  // Render row headers
  if (rowHeaderWidth > 0) {
    for (const row of allRows) {
      const y = allRowYs.get(row);
      const height = allRowHeights.get(row);
      const modelRow = modelRows.get(row);

      if (y === undefined || height === undefined || modelRow === undefined) {
        continue;
      }

      const text = model.textForRowHeader(modelRow);

      rowHeaders.push(
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
          {text}
        </div>
      );
    }
  }

  return (
    <div
      role="grid"
      aria-rowcount={model.rowCount}
      aria-colcount={model.columnCount}
      style={containerStyle}
      data-testid="grid-accessibility-layer"
    >
      {columnHeaders}
      {rowHeaders}
      {dataCells}
    </div>
  );
}

export default memo(GridAccessibilityLayer);
