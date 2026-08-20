import React, { type ReactNode } from 'react';
import type {
  BoxAlignmentStyleProps,
  Key,
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
      minWidth={0}
    >
      <Text>{label}</Text>
      {children}
    </Flex>
  );
}

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

const rows: SampleRow[] = [
  { name: 'Dashboard 1', owner: 'Alice' },
  { name: 'Dashboard 2', owner: 'Bob' },
  { name: 'Dashboard 3', owner: 'Carol' },
  { name: 'Dashboard 4', owner: 'Alice' },
  { name: 'Dashboard 5', owner: 'Bob' },
  { name: 'Dashboard 6', owner: 'Carol' },
];

function renderCell(item: SampleRow, columnKey: Key): React.ReactNode {
  return item[columnKey as keyof SampleRow];
}

export function TableViews(): JSX.Element {
  return (
    <SampleSection name="table-views">
      <h2 className="ui-title">Table View</h2>
      <Grid gap={14} height="size-6000" columns="1fr 1fr" rows="1fr">
        <LabeledFlexContainer label="Resizable columns" height="100%">
          <TableView
            aria-label="Resizable columns"
            columns={columns}
            items={rows}
            itemCount={rows.length}
            renderCell={renderCell}
          />
        </LabeledFlexContainer>

        <LabeledFlexContainer label="Windowed rows" height="100%">
          <TableView
            aria-label="Windowed rows"
            columns={columns}
            items={rows.slice(3)}
            itemCount={12}
            offset={3}
            renderCell={renderCell}
          />
        </LabeledFlexContainer>
      </Grid>
    </SampleSection>
  );
}

export default TableViews;
