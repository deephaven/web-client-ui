import React, { type ReactNode, useCallback, useMemo, useState } from 'react';
import type {
  BoxAlignmentStyleProps,
  Key,
  SortDescriptor,
  StyleProps,
} from '@react-types/shared';
import {
  Flex,
  Grid,
  TableView,
  Text,
  type TableViewColumn,
} from '@deephaven/components';
import SampleSection from './SampleSection';

interface SampleRow {
  id: number;
  name: string;
  owner: string;
  modified: string;
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
  {
    key: 'modified',
    name: 'Modified',
    width: 120,
    allowsSorting: true,
  },
];

const rows: SampleRow[] = Array.from({ length: 24 }, (_, index) => ({
  id: index,
  name: `Dashboard ${index + 1}`,
  owner: ['Alice', 'Bob', 'Carol'][index % 3],
  modified: `2026-08-${String((index % 17) + 1).padStart(2, '0')}`,
}));

function renderCell(item: SampleRow, columnKey: Key): React.ReactNode {
  return item[columnKey as keyof Omit<SampleRow, 'id'>];
}

interface LabeledProps extends BoxAlignmentStyleProps, StyleProps {
  label: string;
  children: ReactNode;
}

function LabeledFlexContainer({
  label,
  children,
  ...styleProps
}: LabeledProps): JSX.Element {
  return (
    <Flex
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...styleProps}
      direction="column"
      gap={10}
    >
      <Text>{label}</Text>
      {children}
    </Flex>
  );
}

export function TableViews(): JSX.Element {
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'name',
    direction: 'ascending',
  });
  const [lastAction, setLastAction] = useState('None');
  const [viewport, setViewport] = useState('0–0');

  const sortedRows = useMemo(() => {
    const { column, direction } = sortDescriptor;
    return [...rows].sort((first, second) => {
      const firstValue = first[column as keyof Omit<SampleRow, 'id'>];
      const secondValue = second[column as keyof Omit<SampleRow, 'id'>];
      const comparison = String(firstValue).localeCompare(String(secondValue));
      return direction === 'descending' ? -comparison : comparison;
    });
  }, [sortDescriptor]);

  const handleViewportChange = useCallback((top: number, bottom: number) => {
    setViewport(`${top}–${bottom}`);
  }, []);

  return (
    <SampleSection name="table-views">
      <h2 className="ui-title">Table View</h2>
      <Grid gap={14} columns="1fr 1fr">
        <LabeledFlexContainer label="Resizable and sortable">
          <TableView
            aria-label="Resizable and sortable table"
            columns={columns}
            items={sortedRows}
            itemCount={sortedRows.length}
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
            onAction={item => setLastAction(item.name)}
            onViewportChange={handleViewportChange}
            renderCell={renderCell}
            getTextValue={item => item.name}
          />
          <Text>
            Last action: {lastAction} | Visible rows: {viewport}
          </Text>
        </LabeledFlexContainer>
        <LabeledFlexContainer label="Windowed (offset 3 of 12 rows)">
          <TableView
            aria-label="Windowed data table"
            columns={columns}
            items={rows.slice(3, 9)}
            itemCount={12}
            offset={3}
            renderCell={renderCell}
            getTextValue={item => item.name}
          />
        </LabeledFlexContainer>
      </Grid>
    </SampleSection>
  );
}

export default TableViews;
