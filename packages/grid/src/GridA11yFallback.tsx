import React, { useCallback, useState } from 'react';
import { EMPTY_ARRAY } from '@deephaven/utils';
import type GridMetrics from './GridMetrics';
import { type VisibleIndex } from './GridMetrics';
import type GridModel from './GridModel';
import type GridRange from './GridRange';
import {
  createGridA11ySnapshot,
  formatGridA11yRect,
  getGridA11ySummary,
  GRID_A11Y_ATTRIBUTES,
  type GridA11ySnapshot,
} from './GridA11yUtils';

/** Where the grid is scrolled to */
export type GridA11yViewport = {
  top: VisibleIndex;
  left: VisibleIndex;
  topOffset: number;
  leftOffset: number;
};

export type GridA11yFallbackProps = {
  /** The model being displayed */
  model: GridModel;

  /**
   * Metrics of the most recent render, or null if the grid has not drawn yet.
   * Read through a callback rather than taken as a prop, as the grid
   * recalculates its metrics after rendering.
   */
  getMetrics: () => GridMetrics | null;

  /** Where the grid is scrolled to */
  viewport: GridA11yViewport;

  /** The currently selected ranges */
  selectedRanges?: readonly GridRange[];
};

/** Identifies the viewport a snapshot describes */
function getViewportKey({
  top,
  left,
  topOffset,
  leftOffset,
}: GridA11yViewport): string {
  return `${top},${left},${topOffset},${leftOffset}`;
}

/**
 * The fallback content of the grid canvas. Never painted, but assistive
 * technology and browser automation read it in place of the pixels.
 *
 * The summary only reads values the grid already has on hand, so it is
 * regenerated on every render. The snapshot walks every visible cell, so it is
 * generated on request and discarded as soon as the grid scrolls away from it.
 *
 * The snapshot is a plain table rather than divs with ARIA roles, as fallback
 * content is never laid out and native table semantics come with the column
 * associations for free. It is a `table` and not a `grid` because `grid`
 * promises the cell by cell keyboard navigation that only the canvas
 * implements.
 */
export function GridA11yFallback({
  model,
  getMetrics,
  viewport,
  selectedRanges = EMPTY_ARRAY,
}: GridA11yFallbackProps): JSX.Element {
  const [held, setHeld] = useState<{
    viewportKey: string;
    snapshot: GridA11ySnapshot;
  } | null>(null);
  const [revision, setRevision] = useState(0);

  const viewportKey = getViewportKey(viewport);

  const handleDescribe = useCallback(() => {
    const metrics = getMetrics();
    setHeld(
      metrics != null
        ? {
            viewportKey,
            snapshot: createGridA11ySnapshot(model, metrics, selectedRanges),
          }
        : null
    );
    setRevision(current => current + 1);
  }, [getMetrics, model, selectedRanges, viewportKey]);

  const snapshot =
    held != null && held.viewportKey === viewportKey ? held.snapshot : null;

  return (
    <div {...{ [GRID_A11Y_ATTRIBUTES.revision]: revision }}>
      <p>{getGridA11ySummary(model, selectedRanges)}</p>
      {/* Kept out of the tab order so sighted keyboard users are not sent to an element they cannot see */}
      <button
        type="button"
        tabIndex={-1}
        onClick={handleDescribe}
        {...{ [GRID_A11Y_ATTRIBUTES.describe]: '' }}
      >
        Describe the grid contents
      </button>
      {snapshot != null && (
        <div {...{ [GRID_A11Y_ATTRIBUTES.snapshot]: '' }}>
          <p role="status">{snapshot.description}</p>
          <table
            aria-rowcount={snapshot.rowCount + 1}
            aria-colcount={snapshot.columnCount}
          >
            <thead>
              <tr aria-rowindex={1}>
                {snapshot.columns.map(({ column, text, rect }) => (
                  <th
                    key={column}
                    scope="col"
                    aria-colindex={column + 1}
                    {...{
                      [GRID_A11Y_ATTRIBUTES.column]: column,
                      [GRID_A11Y_ATTRIBUTES.header]: text,
                      [GRID_A11Y_ATTRIBUTES.rect]: formatGridA11yRect(rect),
                    }}
                  >
                    {text}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {snapshot.rows.map(({ row, cells }) => (
                <tr key={row} aria-rowindex={row + 2}>
                  {cells.map(({ column, text, rect }) => (
                    <td
                      key={column}
                      aria-colindex={column + 1}
                      {...{
                        [GRID_A11Y_ATTRIBUTES.column]: column,
                        [GRID_A11Y_ATTRIBUTES.row]: row,
                        [GRID_A11Y_ATTRIBUTES.rect]: formatGridA11yRect(rect),
                      }}
                    >
                      {text}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default GridA11yFallback;
