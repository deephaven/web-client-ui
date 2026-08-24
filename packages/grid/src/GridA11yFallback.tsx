import React from 'react';
import {
  formatGridA11yRect,
  GRID_A11Y_ATTRIBUTES,
  type GridA11ySnapshot,
} from './GridA11yUtils';

export type GridA11yFallbackProps = {
  /** A sentence describing the grid size and selection */
  summary: string;

  /** The viewport to describe, or null if the user has not asked for one */
  snapshot: GridA11ySnapshot | null;

  /** Called when the user asks for the grid contents to be described */
  onDescribe: () => void;
};

/**
 * The fallback content of the grid canvas. Never painted, but assistive
 * technology and browser automation read it in place of the pixels.
 *
 * The snapshot is a plain table rather than divs with ARIA roles, as fallback
 * content is never laid out and native table semantics come with the column
 * associations for free. It is a `table` and not a `grid` because `grid`
 * promises the cell by cell keyboard navigation that only the canvas
 * implements.
 */
export function GridA11yFallback({
  summary,
  snapshot,
  onDescribe,
}: GridA11yFallbackProps): JSX.Element {
  return (
    <>
      <p>{summary}</p>
      {/* Kept out of the tab order so sighted keyboard users are not sent to an element they cannot see */}
      <button
        type="button"
        tabIndex={-1}
        onClick={onDescribe}
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
                {snapshot.columns.map(({ column, text, rect }, columnIndex) => (
                  <th
                    key={column}
                    scope="col"
                    aria-colindex={columnIndex + 1}
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
                  {cells.map(({ column, text, rect }, columnIndex) => (
                    <td
                      key={column}
                      aria-colindex={columnIndex + 1}
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
