import React, { useCallback, useMemo, useState } from 'react';
import type { Key, SortDescriptor } from '@react-types/shared';
import {
  Flex,
  Grid,
  Radio,
  RadioGroup,
  TableView,
  Text,
  type TableViewColumn,
  type TableViewProps,
} from '@deephaven/components';
import SampleSection from './SampleSection';
import LabeledFlexContainer from './LabeledFlexContainer';

interface SampleRow {
  name: string;
  owner: string;
}

const columns: TableViewColumn[] = [
  {
    key: 'name',
    name: 'Name',
    defaultWidth: '2fr',
    minWidth: 120,
    allowsResizing: true,
    allowsSorting: true,
    showDivider: true,
  },
  {
    key: 'owner',
    name: 'Owner',
    defaultWidth: '1fr',
    minWidth: 100,
    allowsResizing: true,
    allowsSorting: true,
  },
];

const NAMES = [
  'Sales Overview',
  'Revenue Tracker',
  'Inventory Status',
  'User Analytics',
  'Order Pipeline',
  'Support Queue',
  'Marketing Funnel',
  'Risk Dashboard',
  'Compliance Report',
  'Performance Monitor',
  'Trade Blotter',
  'Portfolio Summary',
  'P&L Attribution',
  'Exposure Heatmap',
];

const OWNERS = ['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank'];

const rows: SampleRow[] = Array.from({ length: 52 }, (_, index) => ({
  name: `${NAMES[index % NAMES.length]} ${
    Math.floor(index / NAMES.length) > 0
      ? Math.floor(index / NAMES.length) + 1
      : ''
  }`.trim(),
  owner: OWNERS[index % OWNERS.length],
}));

// Large dataset used by the windowed example to exercise TableView's
// onViewportChange reporting at high row counts.
const WINDOWED_ROWS: SampleRow[] = Array.from({ length: 500 }, (_, index) => ({
  name: `Row ${index + 1}`,
  owner: OWNERS[index % OWNERS.length],
}));

function renderCell(item: SampleRow, columnKey: Key): React.ReactNode {
  return item[columnKey as keyof SampleRow];
}

export function TableViews(): JSX.Element {
  const [density, setDensity] =
    useState<TableViewProps<SampleRow>['density']>('compact');
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'name',
    direction: 'ascending',
  });
  const [lastOpenedName, setLastOpenedName] = useState('');
  const [singleSelectedKeys, setSingleSelectedKeys] = useState<
    'all' | Set<Key>
  >(() => new Set(['0']));
  const [multiSelectedKeys, setMultiSelectedKeys] = useState<'all' | Set<Key>>(
    () => new Set([0, 3])
  );
  // Emulates a windowed data source: only the requested slice is "loaded" and
  // handed to TableView. Any row outside the window renders as a placeholder.
  const [windowedRange, setWindowedRange] = useState<{
    items: SampleRow[];
    offset: number;
  }>(() => ({ items: WINDOWED_ROWS.slice(0, 40), offset: 0 }));

  const onDensityChange = useCallback((value: string) => {
    setDensity(value as TableViewProps<SampleRow>['density']);
  }, []);

  const sortedRows = useMemo(() => {
    const { column, direction } = sortDescriptor;
    return [...rows].sort((first, second) => {
      const comparison = String(first[column as keyof SampleRow]).localeCompare(
        String(second[column as keyof SampleRow])
      );
      return direction === 'descending' ? -comparison : comparison;
    });
  }, [sortDescriptor]);

  const handleResizableAction = useCallback((key: Key): void => {
    setLastOpenedName(rows[Number(key)]?.name ?? '');
  }, []);

  const handleSortableAction = useCallback(
    (key: Key): void => {
      setLastOpenedName(sortedRows[Number(key)]?.name ?? '');
    },
    [sortedRows]
  );

  const handleWindowedViewportChange = useCallback(
    (top: number, bottom: number): void => {
      setWindowedRange({
        items: WINDOWED_ROWS.slice(top, bottom + 1),
        offset: top,
      });
    },
    []
  );

  return (
    <SampleSection name="table-views">
      <h2 className="ui-title">Table View</h2>
      <Grid
        gap={14}
        height="1240px"
        columns="1fr 1fr"
        rows="auto minmax(0, 1fr) auto minmax(0, 1fr) minmax(0, 1fr) auto"
      >
        <LabeledFlexContainer
          alignItems="center"
          direction="row"
          gap={10}
          label="Density"
          gridColumn="span 2"
        >
          <RadioGroup
            aria-label="Density"
            orientation="horizontal"
            value={density ?? 'compact'}
            onChange={onDensityChange}
          >
            <Radio value="compact">Compact</Radio>
            <Radio value="regular">Regular</Radio>
            <Radio value="spacious">Spacious</Radio>
          </RadioGroup>
        </LabeledFlexContainer>

        <LabeledFlexContainer
          gap={10}
          label="Resizable columns"
          height="100%"
          minHeight={0}
          minWidth={0}
        >
          <TableView
            aria-label="Resizable columns"
            columns={columns}
            density={density}
            items={rows.slice(0, 6)}
            itemCount={6}
            onAction={handleResizableAction}
            renderCell={renderCell}
            getTextValue={item => item.name}
          />
        </LabeledFlexContainer>

        <LabeledFlexContainer
          gap={10}
          label="Many rows"
          height="100%"
          minHeight={0}
          minWidth={0}
        >
          <TableView
            aria-label="Many rows"
            columns={columns}
            density={density}
            items={sortedRows}
            itemCount={sortedRows.length}
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
            onAction={handleSortableAction}
            renderCell={renderCell}
            getTextValue={item => item.name}
          />
        </LabeledFlexContainer>

        <Flex gridColumn="span 2">
          <Text>Last opened: {lastOpenedName}</Text>
        </Flex>

        <LabeledFlexContainer
          gap={10}
          label={`Windowed rows (${WINDOWED_ROWS.length} total, only the visible slice is loaded)`}
          height="100%"
          minHeight={0}
          minWidth={0}
          gridColumn="span 2"
        >
          <TableView
            aria-label="Windowed rows"
            columns={columns}
            density={density}
            items={windowedRange.items}
            itemCount={WINDOWED_ROWS.length}
            offset={windowedRange.offset}
            onViewportChange={handleWindowedViewportChange}
            renderCell={renderCell}
            getTextValue={item => item.name}
          />
        </LabeledFlexContainer>

        <LabeledFlexContainer
          gap={10}
          label="Single select (uncontrolled)"
          height="100%"
          minHeight={0}
          minWidth={0}
        >
          <TableView
            aria-label="Single select"
            columns={columns}
            density={density}
            items={rows.slice(0, 8)}
            itemCount={8}
            selectionMode="single"
            defaultSelectedKeys={[0]}
            onSelectionChange={keys => setSingleSelectedKeys(keys)}
            renderCell={renderCell}
            getTextValue={item => item.name}
          />
        </LabeledFlexContainer>

        <LabeledFlexContainer
          gap={10}
          label="Multiple select (controlled) with disabled rows"
          height="100%"
          minHeight={0}
          minWidth={0}
        >
          <TableView
            aria-label="Multiple select"
            columns={columns}
            density={density}
            items={rows}
            itemCount={rows.length}
            selectionMode="multiple"
            selectedKeys={multiSelectedKeys}
            disabledKeys={[2, 5]}
            onSelectionChange={keys => setMultiSelectedKeys(keys)}
            renderCell={renderCell}
            getTextValue={item => item.name}
          />
        </LabeledFlexContainer>

        <Flex gridColumn="span 2" gap={14}>
          <Text>
            Single selected:{' '}
            {singleSelectedKeys === 'all'
              ? 'all'
              : [...singleSelectedKeys].join(', ') || 'none'}
          </Text>
          <Text>
            Multiple selected:{' '}
            {multiSelectedKeys === 'all'
              ? 'all'
              : [...multiSelectedKeys].join(', ') || 'none'}
          </Text>
        </Flex>
      </Grid>
    </SampleSection>
  );
}

export default TableViews;
