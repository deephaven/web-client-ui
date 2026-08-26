import React, { useEffect, useRef, useState } from 'react';
import { EMPTY_ARRAY } from '@deephaven/utils';
import type GridMetrics from './GridMetrics';
import type GridModel from './GridModel';
import type GridRange from './GridRange';
import {
  createGridA11ySnapshot,
  formatGridA11yRect,
  getGridA11ySummary,
  GRID_A11Y_ATTRIBUTES,
  type GridA11ySnapshot,
} from './GridA11yUtils';

export type GridA11yFallbackProps = {
  /** The model being displayed */
  model: GridModel;

  /** Get the metrics of the most recent draw, or null if the grid has not drawn yet */
  getMetrics: () => GridMetrics | null;

  /** The currently selected ranges */
  selectedRanges?: readonly GridRange[];

  revision: number;
};

/**
 * The fallback content of the grid canvas. Never painted, but assistive
 * technology and browser automation read it in place of the pixels.
 *
 * The summary only reads values the grid already has on hand, so it is
 * regenerated on every render. The snapshot walks every visible cell, so it is
 * toggled on and off by a button and only tracks the viewport while it is on.
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
  selectedRanges = EMPTY_ARRAY,
  revision,
}: GridA11yFallbackProps): JSX.Element {
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [snapshot, setSnapshot] = useState<GridA11ySnapshot | null>(null);
  const snapshotInputs =
    useRef<[GridMetrics | null, GridModel, readonly GridRange[]]>();

  // The grid draws in its own `componentDidUpdate`, so a passive effect is the
  // first point the metrics of the draw that just happened are available. It has
  // to run after every render, as a draw changes the metrics without changing
  // any prop, so it bails unless the inputs changed to avoid updating forever.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const metrics = showSnapshot ? getMetrics() : null;
    const [prevMetrics, prevModel, prevSelectedRanges] =
      snapshotInputs.current ?? [];
    if (
      metrics === prevMetrics &&
      model === prevModel &&
      selectedRanges === prevSelectedRanges
    ) {
      return;
    }

    snapshotInputs.current = [metrics, model, selectedRanges];
    setSnapshot(
      metrics == null
        ? null
        : createGridA11ySnapshot(model, metrics, selectedRanges)
    );
  });

  return (
    <div {...{ [GRID_A11Y_ATTRIBUTES.revision]: revision }}>
      <p>{getGridA11ySummary(model, selectedRanges)}</p>
      {/* Kept out of the tab order so sighted keyboard users are not sent to an element they cannot see */}
      <button
        type="button"
        tabIndex={-1}
        aria-pressed={showSnapshot}
        onClick={() => setShowSnapshot(prevShowSnapshot => !prevShowSnapshot)}
        {...{ [GRID_A11Y_ATTRIBUTES.describe]: '' }}
      >
        {showSnapshot ? 'Hide the grid contents' : 'Describe the grid contents'}
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
