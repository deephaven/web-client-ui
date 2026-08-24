import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GridA11yFallback from './GridA11yFallback';
import { type GridA11ySnapshot } from './GridA11yUtils';

const SUMMARY = 'Grid with 100 rows and 3 columns.';

const SNAPSHOT: GridA11ySnapshot = {
  description: `${SUMMARY} Showing rows 1 to 2, columns x, y.`,
  rowCount: 100,
  columnCount: 3,
  columns: [
    { column: 0, text: 'x', rect: { x: 30, y: 0, width: 100, height: 30 } },
    { column: 1, text: 'y', rect: { x: 130, y: 0, width: 100, height: 30 } },
  ],
  rows: [
    {
      row: 0,
      cells: [
        {
          column: 0,
          text: '0',
          rect: { x: 30, y: 30, width: 100, height: 20 },
        },
        {
          column: 1,
          text: '0.0000',
          rect: { x: 130, y: 30, width: 100, height: 20 },
        },
      ],
    },
  ],
};

it('renders the summary without describing the contents', () => {
  render(
    <GridA11yFallback
      summary={SUMMARY}
      snapshot={null}
      onDescribe={jest.fn()}
    />
  );

  expect(screen.getByText(SUMMARY)).toBeInTheDocument();
  expect(screen.queryByRole('table')).toBeNull();
});

it('keeps the describe button out of the tab order', () => {
  render(
    <GridA11yFallback
      summary={SUMMARY}
      snapshot={null}
      onDescribe={jest.fn()}
    />
  );

  expect(
    screen.getByRole('button', { name: 'Describe the grid contents' })
  ).toHaveAttribute('tabindex', '-1');
});

it('describes the contents when the button is pressed', async () => {
  const user = userEvent.setup();
  const onDescribe = jest.fn();
  render(
    <GridA11yFallback
      summary={SUMMARY}
      snapshot={null}
      onDescribe={onDescribe}
    />
  );

  await user.click(
    screen.getByRole('button', { name: 'Describe the grid contents' })
  );

  expect(onDescribe).toHaveBeenCalled();
});

it('renders the snapshot as a table of headers and cells', () => {
  render(
    <GridA11yFallback
      summary={SUMMARY}
      snapshot={SNAPSHOT}
      onDescribe={jest.fn()}
    />
  );

  const table = screen.getByRole('table');

  // The counts describe the whole grid, while the table only holds the viewport
  expect(table).toHaveAttribute('aria-rowcount', '101');
  expect(table).toHaveAttribute('aria-colcount', '3');

  expect(
    within(table)
      .getAllByRole('columnheader')
      .map(header => header.textContent)
  ).toEqual(['x', 'y']);
  expect(within(table).getAllByRole('columnheader')[0]).toHaveAttribute(
    'scope',
    'col'
  );
});

it('locates each cell by its column, row, and position on screen', () => {
  render(
    <GridA11yFallback
      summary={SUMMARY}
      snapshot={SNAPSHOT}
      onDescribe={jest.fn()}
    />
  );

  const cell = screen.getByText('0.0000');
  expect(cell).toHaveAttribute('data-grid-column', '1');
  expect(cell).toHaveAttribute('data-grid-row', '0');
  expect(cell).toHaveAttribute('data-grid-rect', '130,30,100,20');
});

it('announces the description of the viewport', () => {
  render(
    <GridA11yFallback
      summary={SUMMARY}
      snapshot={SNAPSHOT}
      onDescribe={jest.fn()}
    />
  );

  expect(screen.getByRole('status')).toHaveTextContent(SNAPSHOT.description);
});
