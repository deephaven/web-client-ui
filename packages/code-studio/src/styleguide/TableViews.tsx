import React, { useCallback, useState } from 'react';
import type { Key } from '@react-types/shared';
import {
  Flex,
  Grid,
  TableView,
  Text,
  type TableViewColumn,
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
    showDivider: true,
  },
  {
    key: 'owner',
    name: 'Owner',
    defaultWidth: '1fr',
    minWidth: 100,
    allowsResizing: true,
  },
];

const owners = ['Alice', 'Bob', 'Carol'];
const rows: SampleRow[] = Array.from({ length: 52 }, (_, index) => ({
  name: `Dashboard ${index + 1}`,
  owner: owners[index % owners.length],
}));

function renderCell(item: SampleRow, columnKey: Key): React.ReactNode {
  return item[columnKey as keyof SampleRow];
}

export function TableViews(): JSX.Element {
  const [lastOpenedName, setLastOpenedName] = useState('');
  const handleAction = useCallback((item: SampleRow): void => {
    setLastOpenedName(item.name);
  }, []);

  return (
    <SampleSection name="table-views">
      <h2 className="ui-title">Table View</h2>
      <Grid
        gap={14}
        height="size-6000"
        columns="1fr 1fr"
        rows="minmax(0, 1fr) auto"
      >
        <LabeledFlexContainer
          label="Resizable columns"
          height="100%"
          minHeight={0}
          minWidth={0}
        >
          <TableView
            aria-label="Resizable columns"
            columns={columns}
            items={rows.slice(0, 6)}
            itemCount={6}
            onAction={handleAction}
            renderCell={renderCell}
          />
        </LabeledFlexContainer>

        <LabeledFlexContainer
          label="Many rows"
          height="100%"
          minHeight={0}
          minWidth={0}
        >
          <TableView
            aria-label="Many rows"
            columns={columns}
            items={rows}
            itemCount={rows.length}
            onAction={handleAction}
            renderCell={renderCell}
          />
        </LabeledFlexContainer>
        <Flex gridColumn="span 2">
          <Text>Last opened: {lastOpenedName}</Text>
        </Flex>
      </Grid>
    </SampleSection>
  );
}

export default TableViews;
