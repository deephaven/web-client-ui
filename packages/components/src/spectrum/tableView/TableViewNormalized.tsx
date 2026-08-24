import { useCallback, type ReactNode } from 'react';
import {
  Cell,
  Column,
  Row,
  TableBody,
  TableHeader,
  type SpectrumTableProps,
} from '@adobe/react-spectrum';
import type { Key } from '@react-types/shared';
import type { KeyedItem } from '@deephaven/utils';
import { TABLE_ROW_HEIGHT } from '../../UIConstants';
import type { TableViewColumn } from './TableView';
import { TableViewWrapper } from './TableViewWrapper';

export interface TableViewNormalizedProps<T>
  extends Omit<
    SpectrumTableProps<T>,
    | 'children'
    | 'items'
    | 'onAction'
    | 'selectionMode'
    | 'selectedKeys'
    | 'defaultSelectedKeys'
    | 'disabledKeys'
    | 'onSelectionChange'
  > {
  columns: TableViewColumn[];
  normalizedItems: readonly KeyedItem<T, Key>[];
  onAction?: (item: T) => void;
  onScroll?: (event: Event) => void;
  onViewportChange?: (top: number, bottom: number) => void;
  renderCell: (item: T, columnKey: Key) => ReactNode;
  getTextValue?: (item: T) => string;
}

/** Renders normalized, keyed row data in a resizable Spectrum TableView. */
export function TableViewNormalized<T>({
  columns,
  normalizedItems,
  onAction,
  onScroll,
  onViewportChange,
  renderCell,
  getTextValue,
  'aria-label': ariaLabel = 'Table',
  density = 'compact',
  ...spectrumProps
}: TableViewNormalizedProps<T>): JSX.Element {
  const handleAction = useCallback(
    (key: Key) => {
      // Spectrum stringifies numeric keys before calling onAction
      const item = normalizedItems.find(
        candidate => String(candidate.key) === String(key)
      )?.item;
      if (item != null) {
        onAction?.(item);
      }
    },
    [normalizedItems, onAction]
  );

  return (
    <TableViewWrapper
      aria-label={ariaLabel}
      density={density}
      selectionMode="none"
      onAction={onAction != null ? handleAction : undefined}
      onScroll={onScroll}
      itemCount={normalizedItems.length}
      rowHeight={TABLE_ROW_HEIGHT}
      onViewportChange={onViewportChange}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...spectrumProps}
    >
      <TableHeader columns={columns}>
        {column => (
          <Column
            key={column.key}
            width={column.width}
            defaultWidth={column.defaultWidth}
            minWidth={column.minWidth}
            maxWidth={column.maxWidth}
            align={column.align}
            allowsResizing={column.allowsResizing}
            allowsSorting={column.allowsSorting}
            showDivider={column.showDivider}
            hideHeader={column.hideHeader}
          >
            {column.name}
          </Column>
        )}
      </TableHeader>
      <TableBody items={normalizedItems}>
        {({ key, item }) => (
          <Row
            key={key}
            textValue={item == null ? '' : getTextValue?.(item) ?? ''}
          >
            {columnKey => (
              <Cell>{item == null ? null : renderCell(item, columnKey)}</Cell>
            )}
          </Row>
        )}
      </TableBody>
    </TableViewWrapper>
  );
}

export default TableViewNormalized;
