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
  isValueShown = false,
  onChange = jest.fn(),
  source,
  value,
  values,
}: Partial<DropdownFilterProps> = {}) {
  return (
    <DropdownFilter
      column={column}
      columns={columns}
      isLoaded={isLoaded}
      isValueShown={isValueShown}
      onChange={onChange}
      source={source}
      value={value}
      values={values}
    />
  );
}

function renderContainer(props: Partial<DropdownFilterProps> = {}) {
  return render(makeContainer(props));
}

function getSourceButton() {
  return screen.getByLabelText('Source Column');
}

function getFilterSelect() {
  return screen.getByLabelText('Filter Column');
}

function getValueSelect() {
  return screen.getByRole('combobox', { name: 'Select Value' });
}

function getOption(name?: string) {
  return screen.getByRole('option', {
    name,
  }) as HTMLOptionElement;
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
  renderContainer();

  const sourceBtn = getSourceButton();
  expect(sourceBtn.textContent).toBe(DropdownFilter.SOURCE_BUTTON_PLACEHOLDER);

  const filterSelect = getFilterSelect();
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

  describe('state updates correctly', () => {
    beforeEach(() => {
      renderContainer({ column, columns, onChange, source });
      onChange.mockClear();
    });

    it('has the initial state correct', async () => {
      const sourceBtn = getSourceButton();
      expect(sourceBtn.textContent).toBe(source.columnName);

      const filterSelect = getFilterSelect();
      expect(filterSelect).not.toBeDisabled();
      expect(getOption(column.name).selected).toBe(true);
    });

    it('fires a change event when column changed and saved', async () => {
      const filterSelect = getFilterSelect();
      userEvent.selectOptions(filterSelect, getOption(columns[2].name));
      expect(getOption(columns[2].name).selected).toBe(true);
      expect(onChange).not.toHaveBeenCalled();
      userEvent.click(screen.getByRole('button', { name: 'Save' }));
      jest.runOnlyPendingTimers();
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          column: columns[2],
          isValueShown: true,
          value: '',
        })
      );
    });

    it('fires a change event when column changed and saved', async () => {
      const filterSelect = getFilterSelect();
      userEvent.selectOptions(filterSelect, getOption(columns[2].name));
      expect(getOption(columns[2].name).selected).toBe(true);
      expect(onChange).not.toHaveBeenCalled();
      userEvent.click(screen.getByRole('button', { name: 'Save' }));
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

  describe('selecting a value', () => {
    const values = ['X', 'Y', 'Z'];
    const value = values[0];
    let container;

    beforeEach(() => {
      container = renderContainer({
        column,
        columns,
        isValueShown: true,
        onChange,
        source,
        value,
        values,
      });
      onChange.mockClear();
    });

    it('shows the value correctly', async () => {
      expect(getOption(value).selected).toBe(true);
    });

    it('resets the value when no longer in list', () => {
      const newValues = ['M', 'N', 'O'];
      container.rerender(
        makeContainer({
          values: newValues,
        })
      );
      newValues.forEach(v => {
        expect(getOption(v).selected).toBe(false);
      });
    });

    it('fires a change when selecting a new value', () => {
      const newValue = values[1];
      userEvent.selectOptions(getValueSelect(), getOption(newValue));
      jest.runOnlyPendingTimers();
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isValueShown: true,
          value: newValue,
        })
      );
    });
  });
});
