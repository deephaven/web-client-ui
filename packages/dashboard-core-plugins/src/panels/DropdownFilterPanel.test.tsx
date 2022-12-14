import React from 'react';
import {
  findAllByRole,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Container, EventHub } from '@deephaven/golden-layout';
import {
  DropdownFilterPanel,
  DropdownFilterPanelProps,
} from './DropdownFilterPanel';

const eventHub = ({
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  trigger: jest.fn(),
  unbind: jest.fn(),
} as unknown) as EventHub;
const container = ({
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
} as unknown) as Container;

function makeContainer({
  columns = [],
  columnSelectionValidator,
  dashboardLinks = [],
  disableLinking = false,
  isLinkerActive = false,
  panelTableMap = new Map(),
  settings = { formatter: [] },
}: Partial<DropdownFilterPanelProps> = {}) {
  return render(
    <DropdownFilterPanel
      glContainer={container}
      glEventHub={eventHub}
      localDashboardId="TEST DASHBOARD"
      columns={columns}
      columnSelectionValidator={columnSelectionValidator}
      dashboardLinks={dashboardLinks}
      disableLinking={disableLinking}
      isLinkerActive={isLinkerActive}
      panelTableMap={panelTableMap}
      settings={settings}
      dispatch={undefined}
    />
  );
}

it('mounts properly and column selection by default', async () => {
  makeContainer();

  const comboBoxes = await screen.findAllByRole('combobox');
  expect(comboBoxes).toHaveLength(2);
});
