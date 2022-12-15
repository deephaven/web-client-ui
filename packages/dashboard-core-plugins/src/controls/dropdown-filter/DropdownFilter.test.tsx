import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IrisGridTestUtils } from '@deephaven/iris-grid';
import DropdownFilter, { DropdownFilterProps } from './DropdownFilter';
import { LinkPoint } from '../../linker/LinkerUtils';

type MakeContainerProps = Partial<DropdownFilterProps> & {
  ref?: React.RefObject<DropdownFilter>;
};

function makeContainer({
  column,
  columns = [],
  isLinkerActive = false,
  isLoaded = true,
  isValueShown = false,
  onChange = jest.fn(),
  ref,
  settingsError,
  source,
  value,
  values,
}: MakeContainerProps = {}) {
  return (
    <DropdownFilter
      column={column}
      columns={columns}
      isLinkerActive={isLinkerActive}
      isLoaded={isLoaded}
      isValueShown={isValueShown}
      onChange={onChange}
      ref={ref}
      settingsError={settingsError}
      source={source}
      value={value}
      values={values}
    />
  );
}

function renderContainer(props: MakeContainerProps = {}) {
  return render(makeContainer(props));
}

function getCancelButton() {
  return screen.getByRole('button', { name: 'Cancel' });
}

function getSettingsButton() {
  return screen.getByRole('button', { name: 'Dropdown Filter Settings' });
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

function queryOption(name?: string) {
  return screen.queryByRole('option', {
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
  expect(sourceBtn).toHaveTextContent(DropdownFilter.SOURCE_BUTTON_PLACEHOLDER);

  const filterSelect = getFilterSelect();
  expect(filterSelect).toHaveTextContent(
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

  it('handles loading and updating when `isLoaded` is false', () => {
    const container = renderContainer({
      columns: [],
      isLoaded: false,
      onChange,
      source,
    });

    container.rerender(
      makeContainer({ column, columns, isLoaded: false, onChange, source })
    );
  });

  it('shows a settings error when presented', () => {
    const settingsError = 'TEST_SETTINGS_ERROR';
    renderContainer({
      column,
      columns,
      isLoaded: true,
      onChange,
      source,
      settingsError,
    });
    // One error for each side of the card
    expect(screen.queryAllByText(settingsError).length).toBe(2);
  });

  it('disables buttons when linker is active', () => {
    renderContainer({
      column,
      columns,
      isLinkerActive: true,
      onChange,
      source,
    });
    expect(getCancelButton()).toBeDisabled();
    expect(getSaveButton()).toBeDisabled();
  });

  describe('state updates correctly', () => {
    beforeEach(() => {
      renderContainer({ column, columns, onChange, source });
      onChange.mockClear();
    });

    it('triggers all default handlers without error', () => {
      userEvent.click(getSourceButton());
      fireEvent.mouseEnter(getSourceButton());
      fireEvent.mouseLeave(getSourceButton());
    });

    it('has the initial state correct', () => {
      const sourceBtn = getSourceButton();
      expect(sourceBtn).toHaveTextContent(source.columnName);

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
      expect(getValueSelect()).toHaveFocus();
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
  });

  describe('selecting a value', () => {
    const values = ['X', 'Y', 'Z'];
    const value = values[0];
    let container;
    const containerRef = React.createRef<DropdownFilter>();

    beforeEach(() => {
      container = renderContainer({
        column,
        columns,
        isValueShown: true,
        onChange,
        ref: containerRef,
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

    it('handles selecting `null` value', () => {
      const newValues = [...values, null];
      container.rerender(
        makeContainer({
          column,
          columns,
          isValueShown: true,
          onChange,
          ref: containerRef,
          source,
          value,
          values: newValues,
        })
      );
      userEvent.selectOptions(getValueSelect(), getOption('(null)'));
      expect(getOption('(null)').selected).toBe(true);
      jest.runOnlyPendingTimers();
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          value: undefined,
        })
      );
    });

    it('resets value fires a change event when column changed and saved', () => {
      userEvent.click(getSettingsButton());
      onChange.mockClear();
      const filterSelect = getFilterSelect();
      userEvent.selectOptions(filterSelect, getOption(columns[2].name));
      expect(getOption(columns[2].name).selected).toBe(true);
      expect(onChange).not.toHaveBeenCalled();
      userEvent.click(getSaveButton());
      jest.runOnlyPendingTimers();
      expect(getOption(DropdownFilter.PLACEHOLDER).selected).toBe(true);
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          column: columns[2],
          isValueShown: true,
          value: '',
        })
      );
    });

    it('does not reset value but fires a change event when column not changed and saved', () => {
      userEvent.click(getSettingsButton());
      onChange.mockClear();
      const filterSelect = getFilterSelect();
      userEvent.selectOptions(filterSelect, getOption(column.name));
      expect(getOption(column.name).selected).toBe(true);
      expect(onChange).not.toHaveBeenCalled();
      userEvent.click(getSaveButton());
      jest.runOnlyPendingTimers();
      expect(getOption(DropdownFilter.PLACEHOLDER).selected).not.toBe(true);
      expect(getOption(value).selected).toBe(true);
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          column,
          isValueShown: true,
          value,
        })
      );
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

    it('doesnt fire an event when a key other than `Enter` is pressed', () => {
      fireEvent.keyPress(getValueSelect(), {
        key: 'a',
        code: 'KeyA',
        charCode: 97,
      });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('cancels a change in selected column correctly', () => {
      userEvent.click(getSettingsButton());

      const filterSelect = getFilterSelect();
      userEvent.selectOptions(filterSelect, getOption(columns[2].name));

      jest.runOnlyPendingTimers();
      expect(getOption(columns[2].name).selected).toBe(true);
      userEvent.click(getCancelButton());

      expect(getOption(column.name).selected).toBe(true);
      expect(getOption(columns[2].name).selected).not.toBe(true);
    });

    it('focuses the dropdown when clicking the background', () => {
      expect(getValueSelect()).not.toHaveFocus();
      userEvent.click(screen.getByTestId('dropdown-filter-value-background'));
      expect(getValueSelect()).toHaveFocus();
    });

    it('handles call to `clearFilter()` from parent', () => {
      expect(getOption(value).selected).toBe(true);

      containerRef.current?.clearFilter();

      values.forEach(v => {
        expect(getOption(v).selected).toBe(false);
      });
    });

    it('handles call to `setFilterState` from parent', () => {
      expect(getOption(value).selected).toBe(true);

      containerRef.current?.setFilterState({
        name: columns[2].name,
        type: columns[2].type,
        value: values[2],
        isValueShown: false,
      });

      jest.runOnlyPendingTimers();

      expect(getOption(values[2]).selected).toBe(true);
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          column: { name: columns[2].name, type: columns[2].type },
          value: values[2],
          isValueShown: false,
        })
      );
    });

    it('handles call to `setFilterState` with undefined values from parent', () => {
      expect(getOption(value).selected).toBe(true);

      containerRef.current?.setFilterState({
        name: 'FilterSource',
        type: undefined,
        value: undefined,
        isValueShown: undefined,
      });

      jest.runOnlyPendingTimers();

      expect(getOption(value).selected).toBe(true);
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          column: null,
          value,
          isValueShown: true,
        })
      );
    });
  });
});

it('differentiates between columns with the same name by adding type', () => {
  const columns = [
    IrisGridTestUtils.makeColumn('C0', 'java.lang.Double'),
    IrisGridTestUtils.makeColumn('C1', 'java.lang.Double'),
    IrisGridTestUtils.makeColumn('C1', 'java.lang.Float'),
  ];
  const source = makeSource({
    columnName: columns[0].name,
    columnType: columns[0].type,
  });

  renderContainer({ columns, source });

  expect(queryOption('C0')).not.toBeNull();
  expect(queryOption('C1')).toBeNull();
  expect(queryOption('C1 (Double)')).not.toBeNull();
  expect(queryOption('C1 (Float)')).not.toBeNull();
});
