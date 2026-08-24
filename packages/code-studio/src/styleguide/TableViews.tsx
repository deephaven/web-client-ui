import React, { useCallback, useMemo, useState } from 'react';
import type { Key, SortDescriptor } from '@react-types/shared';
import {
  Flex,
  Radio,
  RadioGroup,
  TableView,
  Text,
  type TableViewColumn,
  type TableViewProps,
} from '@deephaven/components';
import SampleSection from './SampleSection';
import { LabeledFlexContainer } from './LabeledFlexContainer';

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

export function TableViews(): JSX.Element {
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'name',
    direction: 'ascending',
  });
  const [lastAction, setLastAction] = useState('None');
  const [viewport, setViewport] = useState('0–0');
  const [density, setDensity] =
    useState<TableViewProps<SampleRow>['density']>('compact');

  const onDensityChange = useCallback((value: string) => {
    setDensity(value as TableViewProps<SampleRow>['density']);
  }, []);

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
      <Flex gap={14} direction="column">
        <LabeledFlexContainer
          alignItems="center"
          direction="row"
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
        <LabeledFlexContainer label="Resizable and sortable" height="size-3600">
          <TableView
            aria-label="Resizable and sortable table"
            columns={columns}
            items={sortedRows}
            itemCount={sortedRows.length}
            density={density}
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
        <LabeledFlexContainer
          label="Windowed (offset 3 of 12 rows)"
          height="size-3600"
        >
          <TableView
            aria-label="Windowed data table"
            columns={columns}
            density={density}
            items={rows.slice(3, 9)}
            itemCount={12}
            offset={3}
            renderCell={renderCell}
            getTextValue={item => item.name}
          />
        </LabeledFlexContainer>
      </Flex>
    </SampleSection>
  );
}

export default TableViews;
