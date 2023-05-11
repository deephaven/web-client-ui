import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import dh from '@deephaven/jsapi-shim';
import {
  Type as FilterType,
  TypeValue as FilterTypeValue,
} from '@deephaven/filters';
import { TableUtils } from '@deephaven/jsapi-utils';
import GotoRow from './GotoRow';
import IrisGridTestUtils from './IrisGridTestUtils';

function makeGotoRow({
  gotoRow = '',
  gotoRowError = '',
  gotoValueError = '',
  onGotoRowSubmit = jest.fn(),
  model = new IrisGridTestUtils(dh).makeModel(),
  onGotoRowNumberChanged = jest.fn(),
  onClose = jest.fn(),
  isShown = true,
  onEntering = jest.fn(),
  onEntered = jest.fn(),
  onExiting = jest.fn(),
  onExited = jest.fn(),
  gotoValueSelectedColumnName = '',
  gotoValue = '',
  gotoValueFilter = FilterType.eq,
  onGotoValueSelectedColumnNameChanged = jest.fn(),
  onGotoValueSelectedFilterChanged = jest.fn(),
  onGotoValueChanged = jest.fn(),
  onGotoValueSubmit = jest.fn(),
} = {}) {
  return render(
    <GotoRow
      dh={dh}
      gotoRow={gotoRow}
      gotoRowError={gotoRowError}
      gotoValueError={gotoValueError}
      onGotoRowSubmit={onGotoRowSubmit}
      model={model}
      onGotoRowNumberChanged={onGotoRowNumberChanged}
      onClose={onClose}
      isShown={isShown}
      onEntering={onEntering}
      onEntered={onEntered}
      onExiting={onExiting}
      onExited={onExited}
      gotoValueSelectedColumnName={gotoValueSelectedColumnName}
      gotoValue={gotoValue}
      gotoValueFilter={gotoValueFilter as FilterTypeValue}
      onGotoValueSelectedColumnNameChanged={
        onGotoValueSelectedColumnNameChanged
      }
      onGotoValueSelectedFilterChanged={onGotoValueSelectedFilterChanged}
      onGotoValueChanged={onGotoValueChanged}
      onGotoValueSubmit={onGotoValueSubmit}
    />
  );
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('mounts and unmounts properly', () => {
  makeGotoRow();
});

describe('Go to row', () => {
  it('calls onGotoRowSubmit on Enter key press', async () => {
    const user = userEvent.setup({ delay: null });
    const onGotoRowSubmitMock = jest.fn();
    const component = makeGotoRow({ onGotoRowSubmit: onGotoRowSubmitMock });

    const inputElement = screen.getByRole('spinbutton');
    await user.type(inputElement, '{Enter}');

    expect(onGotoRowSubmitMock).toHaveBeenCalledTimes(1);

    component.unmount();
  });

  it('does not call onGotoRowSubmit on non-Enter key press', async () => {
    const user = userEvent.setup({ delay: null });
    const onGotoRowSubmitMock = jest.fn();
    const component = makeGotoRow({ onGotoRowSubmit: onGotoRowSubmitMock });

    const inputElement = screen.getByRole('spinbutton');
    await user.type(inputElement, 'a1`');

    expect(onGotoRowSubmitMock).not.toHaveBeenCalled();

    component.unmount();
  });

  it('calls onGotoRowNumberChanged on number key press', async () => {
    const user = userEvent.setup({ delay: null });
    const onGotoRowNumberChangedMock = jest.fn();
    const component = makeGotoRow({
      onGotoRowNumberChanged: onGotoRowNumberChangedMock,
    });

    const inputElement = screen.getByRole('spinbutton');
    await user.type(inputElement, '1');

    expect(onGotoRowNumberChangedMock).toHaveBeenCalledTimes(1);

    component.unmount();
  });
});

describe('Go to value', () => {
  it('calls onGotoValueInputChanged when input value changes', async () => {
    const user = userEvent.setup({ delay: null });
    const onGotoValueInputChangedMock = jest.fn();
    const component = makeGotoRow({
      onGotoValueChanged: onGotoValueInputChangedMock,
    });

    const inputElement = screen.getByPlaceholderText('value');
    await user.type(inputElement, 'a');

    expect(onGotoValueInputChangedMock).toHaveBeenCalledTimes(1);

    component.unmount();
  });

  it('calls onGotoValueSelectedFilterChanged when select value changes', async () => {
    const user = userEvent.setup({ delay: null });
    const onGotoValueSelectedFilterChangedMock = jest.fn();

    jest
      .spyOn(TableUtils, 'getNormalizedType')
      .mockImplementation(() => TableUtils.dataType.STRING);

    const component = makeGotoRow({
      onGotoValueSelectedFilterChanged: onGotoValueSelectedFilterChangedMock,
    });

    const inputElement = screen.getByLabelText('filter-type-select');
    await user.selectOptions(inputElement, [FilterType.contains]);

    expect(onGotoValueSelectedFilterChangedMock).toHaveBeenCalledTimes(1);

    component.unmount();
  });

  it('calls onGotoValueSelectedColumnNameChanged when select value changes', async () => {
    const user = userEvent.setup({ delay: null });
    const onGotoValueSelectedColumnNameChangedMock = jest.fn();
    const component = makeGotoRow({
      onGotoValueSelectedColumnNameChanged: onGotoValueSelectedColumnNameChangedMock,
    });

    const inputElement = screen.getByLabelText('column-name-select');
    await user.selectOptions(inputElement, ['1']);

    expect(onGotoValueSelectedColumnNameChangedMock).toHaveBeenCalledTimes(1);

    component.unmount();
  });
});
