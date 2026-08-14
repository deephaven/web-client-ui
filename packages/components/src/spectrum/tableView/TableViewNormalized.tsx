import { useCallback, type ReactNode } from 'react';
import {
  Cell,
  Column,
  Row,
  TableBody,
  TableHeader,
} from '@adobe/react-spectrum';
import type { Key, SortDescriptor } from '@react-types/shared';
import type { KeyedItem } from '@deephaven/utils';
import { TABLE_ROW_HEIGHT } from '../../UIConstants';
import type { TableViewColumn } from './TableView';
import { TableViewWrapper } from './TableViewWrapper';

export interface TableViewNormalizedProps<T> {
  columns: TableViewColumn[];
  normalizedItems: readonly KeyedItem<T, Key>[];
  sortDescriptor?: SortDescriptor;
  onAction?: (item: T) => void;
  onScroll?: (event: Event) => void;
  onSortChange?: (descriptor: SortDescriptor) => void;
  onViewportChange?: (top: number, bottom: number) => void;
  renderCell: (item: T, columnKey: Key) => ReactNode;
  getTextValue?: (item: T) => string;
  renderEmptyState?: () => JSX.Element;
  'aria-label'?: string;
  UNSAFE_className?: string;
}

/** Renders normalized, keyed row data in a resizable Spectrum TableView. */
export function TableViewNormalized<T>({
  columns,
  normalizedItems,
  sortDescriptor,
  onAction,
  onScroll,
  onSortChange,
  onViewportChange,
  renderCell,
  getTextValue,
  renderEmptyState,
  'aria-label': ariaLabel = 'Table',
  UNSAFE_className,
}: TableViewNormalizedProps<T>): JSX.Element {
  const handleAction = useCallback(
    (key: Key) => {
      const item = normalizedItems.find(candidate => candidate.key === key)
        ?.item;
      if (item != null) {
        onAction?.(item);
      }
    },
    [normalizedItems, onAction]
  );

  return (
    <TableViewWrapper
      aria-label={ariaLabel}
      density="compact"
      selectionMode="none"
      sortDescriptor={sortDescriptor}
      onSortChange={onSortChange}
      onAction={handleAction}
      onScroll={onScroll}
      renderEmptyState={renderEmptyState}
      itemCount={normalizedItems.length}
      rowHeight={TABLE_ROW_HEIGHT}
      onViewportChange={onViewportChange}
      UNSAFE_className={UNSAFE_className}
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
              <Cell>
                {item == null ? null : (
                  <div className="dh-table-view-cell" data-table-view-key={key}>
                    {renderCell(item, columnKey)}
                  </div>
                )}
              </Cell>
            )}
          </Row>
        )}
      </TableBody>
    </TableViewWrapper>
  );
}

export default TableViewNormalized;
