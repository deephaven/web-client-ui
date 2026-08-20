import { useMemo, type ReactNode } from 'react';
import type { SpectrumTableProps } from '@adobe/react-spectrum';
import type { Key } from '@react-types/shared';
import type { KeyedItem } from '@deephaven/utils';
import { TableViewNormalized } from './TableViewNormalized';

export interface TableViewColumn {
  key: string;
  name: string;
  width?: number;
  defaultWidth?: number | `${number}fr`;
  minWidth?: number;
  maxWidth?: number;
  align?: 'start' | 'center' | 'end';
  allowsResizing?: boolean;
  allowsSorting?: boolean;
  showDivider?: boolean;
  hideHeader?: boolean;
}

type WindowedItem<T> = KeyedItem<T, number>;

export type TableViewProps<T> = Pick<
  SpectrumTableProps<WindowedItem<T>>,
  | 'sortDescriptor'
  | 'onSortChange'
  | 'renderEmptyState'
  | 'aria-label'
  | 'UNSAFE_className'
> & {
  columns: TableViewColumn[];
  items: readonly T[];
  itemCount: number;
  offset?: number;
  onAction?: (item: T) => void;
  onViewportChange?: (top: number, bottom: number) => void;
  renderCell: (item: T, columnKey: Key) => ReactNode;
  getTextValue?: (item: T) => string;
};

/**
 * A resizable Spectrum table for small, potentially windowed data sets.
 * The supplied items are placed at their absolute offset among itemCount rows.
 */
export function TableView<T>({
  columns,
  items,
  itemCount,
  offset = 0,
  sortDescriptor,
  onAction,
  onSortChange,
  onViewportChange,
  renderCell,
  getTextValue,
  renderEmptyState,
  'aria-label': ariaLabel = 'Table',
  UNSAFE_className,
}: TableViewProps<T>): JSX.Element {
  const rowCount = Math.max(0, itemCount);
  const tableItems = useMemo<WindowedItem<T>[]>(() => {
    const windowedItems = Array.from<unknown, WindowedItem<T>>(
      { length: rowCount },
      (_, key) => ({ key })
    );

    items.forEach((item, index) => {
      const key = offset + index;
      if (key >= 0 && key < windowedItems.length) {
        windowedItems[key] = { key, item };
      }
    });

    return windowedItems;
  }, [items, offset, rowCount]);

  return (
    <TableViewNormalized
      aria-label={ariaLabel}
      columns={columns}
      normalizedItems={tableItems}
      sortDescriptor={sortDescriptor}
      onSortChange={onSortChange}
      onAction={onAction}
      renderEmptyState={renderEmptyState}
      onViewportChange={onViewportChange}
      renderCell={renderCell}
      getTextValue={getTextValue}
      UNSAFE_className={UNSAFE_className}
    />
  );
}

export default TableView;
