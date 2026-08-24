import React from 'react';
import { defaultTheme, Provider } from '@adobe/react-spectrum';
import { fireEvent, render, screen } from '@testing-library/react';
import { TABLE_VIEW_ROW_HEIGHTS } from '../../UIConstants';
import { type TableViewColumn, TableView } from './TableView';

type TestItem = {
  name: string;
};

const columns: TableViewColumn[] = [
  {
    key: 'name',
    name: 'Name',
    allowsResizing: true,
    defaultWidth: 280,
  },
];

function renderTable({
  items = [{ name: 'Dashboard B' }],
  itemCount = 4,
  offset = 2,
  onViewportChange = jest.fn(),
}: {
  items?: TestItem[];
  itemCount?: number;
  offset?: number;
  onViewportChange?: jest.Mock;
} = {}) {
  const result = render(
    <Provider theme={defaultTheme} scale="medium">
      <TableView
        aria-label="Dashboards"
        columns={columns}
        items={items}
        itemCount={itemCount}
        offset={offset}
        onViewportChange={onViewportChange}
        renderCell={(item, columnKey) =>
          columnKey === 'name' ? item.name : null
        }
      />
    </Provider>
  );

  return { ...result, onViewportChange };
}

describe('TableView', () => {
  it('renders loaded rows at their absolute viewport offset', () => {
    const { container } = renderTable();

    expect(screen.getByText('Dashboard B')).toBeInTheDocument();
    expect(
      container.querySelector('[data-table-view-key="0"]')
    ).not.toBeInTheDocument();
  });

  it('matches the persistent resizer selector for resizable columns', () => {
    const { container } = renderTable();

    const resizer = screen.getByLabelText('Column resizer').parentElement;
    expect(
      container.querySelector(
        ".dh-table-view-wrapper [class*='spectrum-Table-columnResizer']:not([class*='spectrum-Table-columnResizerPlaceholder'])"
      )
    ).toBe(resizer);
  });

  it('reports the visible row range when the table scrolls', () => {
    const onViewportChange = jest.fn();
    renderTable({ itemCount: 10, offset: 0, onViewportChange });
    onViewportChange.mockClear();

    const scrollElement = screen.getByRole('grid').lastElementChild;
    expect(scrollElement).toBeInstanceOf(HTMLElement);
    Object.defineProperties(scrollElement, {
      clientHeight: {
        configurable: true,
        value: TABLE_VIEW_ROW_HEIGHTS.compact.medium * 3,
      },
      scrollTop: {
        configurable: true,
        value: TABLE_VIEW_ROW_HEIGHTS.compact.medium * 2,
      },
    });

    fireEvent.scroll(scrollElement as Element);

    expect(onViewportChange).toHaveBeenLastCalledWith(2, 5);
  });

  it('clamps the inclusive viewport range to the final row', () => {
    const onViewportChange = jest.fn();
    renderTable({ itemCount: 10, offset: 0, onViewportChange });
    onViewportChange.mockClear();

    const scrollElement = screen.getByRole('grid').lastElementChild;
    expect(scrollElement).toBeInstanceOf(HTMLElement);
    Object.defineProperties(scrollElement, {
      clientHeight: {
        configurable: true,
        value: TABLE_VIEW_ROW_HEIGHTS.compact.medium * 3,
      },
      scrollTop: {
        configurable: true,
        value: TABLE_VIEW_ROW_HEIGHTS.compact.medium * 9,
      },
    });

    fireEvent.scroll(scrollElement as Element);

    expect(onViewportChange).toHaveBeenLastCalledWith(9, 9);
  });
});
