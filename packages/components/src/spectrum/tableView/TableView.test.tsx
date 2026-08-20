import React from 'react';
import { defaultTheme, Provider } from '@adobe/react-spectrum';
import { fireEvent, render, screen } from '@testing-library/react';
import { TABLE_ROW_HEIGHT } from '../../UIConstants';
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
  onAction,
  onViewportChange = jest.fn(),
}: {
  items?: TestItem[];
  itemCount?: number;
  offset?: number;
  onAction?: (item: TestItem) => void;
  onViewportChange?: jest.Mock;
} = {}) {
  const result = render(
    <Provider theme={defaultTheme}>
      <TableView
        aria-label="Dashboards"
        columns={columns}
        items={items}
        itemCount={itemCount}
        offset={offset}
        onAction={onAction}
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
    renderTable();

    expect(screen.getByRole('row', { name: 'Dashboard B' })).toHaveAttribute(
      'aria-rowindex',
      '4'
    );
  });

  it('fills its parent by default', () => {
    renderTable();

    expect(screen.getByRole('grid')).toHaveStyle({
      width: '100%',
      height: '100%',
    });
  });

  it('calls onAction with the activated item', () => {
    const onAction = jest.fn();
    renderTable({ onAction });

    fireEvent.click(screen.getByRole('row', { name: 'Dashboard B' }));

    expect(onAction).toHaveBeenCalledWith({ name: 'Dashboard B' });
  });

  it('reports the visible row range when the table scrolls', () => {
    const onViewportChange = jest.fn();
    renderTable({ itemCount: 10, offset: 0, onViewportChange });
    onViewportChange.mockClear();

    const scrollElement = screen.getByRole('grid').lastElementChild;
    expect(scrollElement).toBeInstanceOf(HTMLElement);
    Object.defineProperties(scrollElement, {
      clientHeight: { configurable: true, value: TABLE_ROW_HEIGHT * 3 },
      scrollTop: { configurable: true, value: TABLE_ROW_HEIGHT * 2 },
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
      clientHeight: { configurable: true, value: TABLE_ROW_HEIGHT * 3 },
      scrollTop: { configurable: true, value: TABLE_ROW_HEIGHT * 9 },
    });

    fireEvent.scroll(scrollElement as Element);

    expect(onViewportChange).toHaveBeenLastCalledWith(9, 9);
  });
});
