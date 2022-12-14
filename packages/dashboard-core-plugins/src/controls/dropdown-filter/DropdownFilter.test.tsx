import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IrisGridTestUtils } from '@deephaven/iris-grid';
import DropdownFilter, { DropdownFilterProps } from './DropdownFilter';
import { LinkPoint } from '../../linker/LinkerUtils';

function makeContainer({
  column,
  columns = [],
  isLoaded = true,
  onChange = jest.fn(),
  source,
}: Partial<DropdownFilterProps> = {}) {
  return render(
    <DropdownFilter
      column={column}
      columns={columns}
      isLoaded={isLoaded}
      onChange={onChange}
      source={source}
    />
  );
}

async function getSourceButton() {
  return screen.getByLabelText('Source Column');
}

async function getFilterSelect() {
  return screen.getByLabelText('Filter Column');
}

function makeSource({
  panelId = 'TEST_PANEL_ID',
  columnName = 'TEST_COLUMN_NAME',
  columnType = 'TEST_COLUMN_TYPE',
}: Partial<LinkPoint>): LinkPoint {
  return { panelId, columnName, columnType };
}

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

it('mounts properly with no columns correctly', async () => {
  makeContainer();

  const sourceBtn = await getSourceButton();
  expect(sourceBtn.textContent).toBe(DropdownFilter.SOURCE_BUTTON_PLACEHOLDER);

  const filterSelect = await getFilterSelect();
  expect(filterSelect.textContent).toBe(
    DropdownFilter.SOURCE_BUTTON_PLACEHOLDER
  );
  expect(filterSelect).toBeDisabled();
});

describe('options when source is selected', () => {
  const columns = IrisGridTestUtils.makeColumns();
  const column = columns[1];
  const source = makeSource({
    columnName: columns[0].name,
    columnType: columns[0].type,
  });
  const onChange = jest.fn();

  beforeEach(() => {
    makeContainer({ column, columns, onChange, source });
    onChange.mockClear();
  });

  it('has the initial state correct', async () => {
    const sourceBtn = await getSourceButton();
    expect(sourceBtn.textContent).toBe(source.columnName);

    const filterSelect = await getFilterSelect();
    expect(filterSelect).not.toBeDisabled();
    expect(
      ((await screen.getByRole('option', {
        name: column.name,
      })) as HTMLOptionElement).selected
    ).toBe(true);
  });

  it('fires a change event when column changed and saved', async () => {
    const filterSelect = await getFilterSelect();
    await userEvent.selectOptions(
      filterSelect,
      await screen.getByRole('option', { name: columns[2].name })
    );
    expect(
      ((await screen.getByRole('option', {
        name: columns[2].name,
      })) as HTMLOptionElement).selected
    ).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.click(await screen.getByRole('button', { name: 'Save' }));
    jest.runOnlyPendingTimers();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        column: columns[2],
        isValueShown: true,
        value: '',
      })
    );
  });
});
