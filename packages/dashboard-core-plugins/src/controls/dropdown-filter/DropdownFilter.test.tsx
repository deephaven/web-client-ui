import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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

function getCancelButton() {
  return screen.getByRole('button', { name: 'Cancel' });
}

function getSaveButton() {
  return screen.getByRole('button', { name: 'Save' });
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

it('mounts properly with no columns correctly', () => {
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

    it('has the initial state correct', () => {
      const sourceBtn = getSourceButton();
      expect(sourceBtn.textContent).toBe(source.columnName);

      const filterSelect = getFilterSelect();
      expect(filterSelect).not.toBeDisabled();
      expect(getOption(column.name).selected).toBe(true);
    });

    it('fires a change event when column changed and saved', () => {
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

    it('fires a change event when column changed and saved', () => {
      const filterSelect = getFilterSelect();
      userEvent.selectOptions(filterSelect, getOption(columns[2].name));
      expect(getOption(columns[2].name).selected).toBe(true);
      expect(onChange).not.toHaveBeenCalled();
      userEvent.click(getSaveButton());
      jest.runOnlyPendingTimers();
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          column: columns[2],
          isValueShown: true,
          value: '',
        })
      );
    });

    it('disables save button when column deselected', () => {
      const filterSelect = getFilterSelect();
      userEvent.selectOptions(
        filterSelect,
        getOption(DropdownFilter.SOURCE_BUTTON_PLACEHOLDER)
      );
      jest.runOnlyPendingTimers();
      expect(getOption(DropdownFilter.SOURCE_BUTTON_PLACEHOLDER).selected).toBe(
        true
      );
      expect(onChange).not.toHaveBeenCalled();
      expect(getSaveButton()).toBeDisabled();
    });

    it('cancels a change in selected column correctly', () => {
      const filterSelect = getFilterSelect();
      userEvent.selectOptions(filterSelect, getOption(columns[2].name));
      jest.runOnlyPendingTimers();
      expect(getOption(columns[2].name).selected).toBe(true);
      userEvent.click(getCancelButton());
      expect(getOption(column.name).selected).toBe(true);
      expect(getOption(columns[2].name).selected).not.toBe(true);
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

    it('shows the value correctly', () => {
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
        expect.objectContaining({ value: newValue })
      );

      onChange.mockClear();

      // Enter key should send event immediately
      fireEvent.keyPress(getValueSelect(), {
        key: 'Enter',
        code: 'Enter',
        charCode: 13,
      });

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ value: newValue })
      );

      onChange.mockClear();

      userEvent.selectOptions(
        getValueSelect(),
        getOption(DropdownFilter.PLACEHOLDER)
      );

      jest.runOnlyPendingTimers();

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ value: '' })
      );
    });
  });
});
