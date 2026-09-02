import React, { useEffect, useMemo, useState } from 'react';
import { type GridRenderState } from './GridRendererTypes';
import {
  createGridA11ySnapshot,
  formatGridA11yRect,
  GRID_A11Y_ATTRIBUTES,
} from './GridA11yUtils';

/** Called with the state the grid just drew */
export type GridDrawListener = (renderState: GridRenderState) => void;

export type GridA11yFallbackProps = {
  /** Listen for the grid drawing its canvas. Returns a function to stop listening */
  registerDrawListener: (listener: GridDrawListener) => () => void;
};

/**
 * The fallback content of the grid canvas. Never painted, but assistive
 * technology and browser automation read it in place of the pixels.
 *
 * Everything here describes the most recent draw, so it only updates when the
 * grid draws. Describing the contents walks every visible cell, which is far
 * too expensive to do on every frame for a grid nobody is inspecting, so the
 * snapshot is toggled on and off by a button and only tracks the viewport while
 * it is on.
 *
 * The snapshot is a plain table rather than divs with ARIA roles, as fallback
 * content is never laid out and native table semantics come with the column
 * associations for free. It is a `table` and not a `grid` because `grid`
 * promises the cell by cell keyboard navigation that only the canvas
 * implements.
 */
export function GridA11yFallback({
  registerDrawListener,
}: GridA11yFallbackProps): JSX.Element {
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [renderState, setRenderState] = useState<GridRenderState | null>(null);

  useEffect(() => registerDrawListener(setRenderState), [registerDrawListener]);

  const snapshot = useMemo(() => {
    if (!showSnapshot || renderState == null) {
      return null;
    }
    const { model, metrics, selectedRanges } = renderState;
    return createGridA11ySnapshot(model, metrics, selectedRanges);
  }, [renderState, showSnapshot]);

  return (
    <>
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
    </>
  );
}

export default GridA11yFallback;
