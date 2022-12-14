import React from 'react';
import { render, screen } from '@testing-library/react';
import type { Container, EventHub } from '@deephaven/golden-layout';
import {
  DropdownFilterPanel,
  DropdownFilterPanelProps,
} from './DropdownFilterPanel';
import DropdownFilter from '../controls/dropdown-filter/DropdownFilter';

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

it('mounts properly with no columns correctly', async () => {
  makeContainer();

  const comboBoxes = await screen.findAllByRole('combobox');
  expect(comboBoxes).toHaveLength(2);

  const sourceBtn = await screen.getByLabelText('Source Column');
  expect(sourceBtn.textContent).toBe(DropdownFilter.SOURCE_BUTTON_PLACEHOLDER);

  const filterSelect = await screen.getByLabelText('Filter Column');
  expect(filterSelect.textContent).toBe(
    DropdownFilter.SOURCE_BUTTON_PLACEHOLDER
  );
  expect(filterSelect).toBeDisabled();
});
