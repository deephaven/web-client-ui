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
import { TABLE_VIEW_ROW_HEIGHTS } from '../../UIConstants';
import { useSpectrumThemeProvider } from '../../theme';
import type { TableViewColumn } from './TableView';
import { TableViewWrapper } from './TableViewWrapper';

export interface TableViewNormalizedProps<T>
  extends Omit<SpectrumTableProps<T>, 'children' | 'items' | 'overflowMode'> {
  columns: TableViewColumn[];
  normalizedItems: readonly KeyedItem<T, Key>[];
  onScroll?: (event: Event) => void;
  onViewportChange?: (top: number, bottom: number) => void;
  renderCell: (item: T, columnKey: Key) => ReactNode;
  getTextValue?: (item: T) => string;
}

/** Renders normalized, keyed row data in a resizable Spectrum TableView. */
export function TableViewNormalized<T>({
  columns,
  normalizedItems,
  onScroll,
  onViewportChange,
  renderCell,
  getTextValue,
  'aria-label': ariaLabel = 'Table',
  density = 'compact',
  selectedKeys,
  defaultSelectedKeys,
  disabledKeys,
  onSelectionChange,
  ...spectrumProps
}: TableViewNormalizedProps<T>): JSX.Element {
  const { scale } = useSpectrumThemeProvider();

  // Row keys are numeric indices; Spectrum stringifies JSX keys, so we must
  // convert selection props to strings and convert results back to numbers.
  const toStringSet = (
    keys: 'all' | Iterable<Key> | undefined
  ): 'all' | Set<string> | undefined => {
    if (keys == null) return undefined;
    if (keys === 'all') return 'all';
    return new Set([...keys].map(String));
  };

  const handleSelectionChange = useCallback(
    (keys: 'all' | Set<Key>): void => {
      if (onSelectionChange == null) return;
      if (keys === 'all') {
        onSelectionChange('all');
        return;
      }
      // Recover numeric type where possible; keep strings for non-numeric keys
      onSelectionChange(
        new Set(
          [...keys].map(k => {
            const n = Number(k);
            return Number.isNaN(n) ? k : n;
          })
        )
      );
    },
    [onSelectionChange]
  );

  return (
    <TableViewWrapper
      aria-label={ariaLabel}
      density={density}
      selectionMode="none"
      selectedKeys={toStringSet(selectedKeys)}
      defaultSelectedKeys={toStringSet(defaultSelectedKeys)}
      disabledKeys={toStringSet(disabledKeys)}
      onSelectionChange={
        onSelectionChange != null ? handleSelectionChange : undefined
      }
      onScroll={onScroll}
      itemCount={normalizedItems.length}
      rowHeight={TABLE_VIEW_ROW_HEIGHTS[density ?? 'compact'][scale]}
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
