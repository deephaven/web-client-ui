import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventShimCustomEvent } from '@deephaven/utils';
import dh from '@deephaven/jsapi-shim';
import CustomColumnBuilder, {
  CustomColumnBuilderProps,
} from './CustomColumnBuilder';
import IrisGridTestUtils from '../IrisGridTestUtils';
import IrisGridModel from '../IrisGridModel';

function Builder({
  model = IrisGridTestUtils.makeModel(dh),
  customColumns = [],
  onSave = jest.fn(),
  onCancel = jest.fn(),
}: Partial<CustomColumnBuilderProps>) {
  return (
    <CustomColumnBuilder
      model={model}
      customColumns={customColumns}
      onSave={onSave}
      onCancel={onCancel}
    />
  );
}

test('Renders the default state', async () => {
  render(<Builder />);
  expect(screen.getByPlaceholderText('Column Name')).toBeInTheDocument();
  expect(screen.getByText('Column Formula')).toBeInTheDocument();
});

test('Calls on save', async () => {
  const user = userEvent.setup();
  const customColumns = ['abc=def', 'foo=bar'];
  const mockSave = jest.fn();
  render(<Builder onSave={mockSave} customColumns={customColumns} />);

  await user.type(screen.getByDisplayValue('abc'), 'cba');
  await user.click(screen.getByText(/Save/));
  expect(mockSave).toHaveBeenLastCalledWith(['abccba=def', 'foo=bar']);
});

test('Switches to loader button while saving', async () => {
  jest.useFakeTimers();
  const user = userEvent.setup({ delay: null });
  const model = IrisGridTestUtils.makeModel(dh);
  const mockSave = jest.fn(() =>
    setTimeout(() => {
      model.dispatchEvent(
        new EventShimCustomEvent(IrisGridModel.EVENT.COLUMNS_CHANGED)
      );
    }, 50)
  );

  render(
    <Builder model={model} onSave={mockSave} customColumns={['foo=bar']} />
  );

  await user.click(screen.getByText(/Save/));
  expect(screen.getByText('Applying')).toBeInTheDocument();
  jest.advanceTimersByTime(50);
  expect(screen.getByText('Success')).toBeInTheDocument();
  jest.advanceTimersByTime(CustomColumnBuilder.SUCCESS_SHOW_DURATION);
  expect(screen.getByText(/Save/)).toBeInTheDocument();

  // Component should ignore this event and not change the save button
  model.dispatchEvent(
    new EventShimCustomEvent(IrisGridModel.EVENT.COLUMNS_CHANGED)
  );
  expect(screen.getByText(/Save/)).toBeInTheDocument();
  jest.useRealTimers();
});

test('Adds a column', async () => {
  const user = userEvent.setup();
  render(<Builder />);

  await user.click(screen.getByText('Add Another Column'));
  expect(screen.getAllByPlaceholderText('Column Name').length).toBe(2);
  expect(screen.getAllByText('Column Formula').length).toBe(2);
});

test('Ignores empty names or formulas on save', async () => {
  const user = userEvent.setup();
  const customColumns = ['foo=bar'];
  const mockSave = jest.fn();
  render(<Builder customColumns={customColumns} onSave={mockSave} />);

  await user.click(screen.getByText('Add Another Column'));
  await user.type(screen.getAllByPlaceholderText('Column Name')[1], 'test');
  await user.click(screen.getByText(/Save/));
  expect(mockSave).toBeCalledWith(customColumns);
});

test('Ignores deleted formulas on save', async () => {
  // There is an issue with populating the custom columns and then editing the existing column
  // RTL/monaco aren't playing nicely and it won't edit the existing text
  // This test instead creates the new text, saves, then removes it to test the same behavior
  jest.useFakeTimers();
  const user = userEvent.setup({ delay: null });
  const model = IrisGridTestUtils.makeModel(dh);
  const mockSave = jest.fn(() =>
    setTimeout(() => {
      model.dispatchEvent(
        new EventShimCustomEvent(IrisGridModel.EVENT.COLUMNS_CHANGED)
      );
    }, 50)
  );

  const { container } = render(<Builder model={model} onSave={mockSave} />);

  await user.type(screen.getByPlaceholderText('Column Name'), 'foo');
  await user.click(container.querySelectorAll('.input-editor-wrapper')[0]);
  await user.keyboard('bar');

  await user.click(screen.getByText(/Save/));
  jest.advanceTimersByTime(50); // Applying duration
  jest.advanceTimersByTime(CustomColumnBuilder.SUCCESS_SHOW_DURATION);

  expect(mockSave).toBeCalledWith(['foo=bar']);

  mockSave.mockClear();

  await user.click(container.querySelectorAll('.input-editor-wrapper')[0]);
  await user.keyboard('{Control>}a{/Control}{Backspace}');
  await user.click(screen.getByText(/Save/));
  expect(mockSave).toBeCalledWith([]);

  jest.useRealTimers();
});

test('Deletes columns', async () => {
  const user = userEvent.setup();
  const customColumns = ['abc=def', 'foo=bar'];
  render(<Builder customColumns={customColumns} />);

  await user.click(screen.getAllByLabelText(/Delete/)[0]);
  expect(screen.queryByDisplayValue('abc')).toBeNull();
  expect(screen.queryByDisplayValue('def')).toBeNull();
  expect(screen.getByDisplayValue('foo')).toBeInTheDocument();
  expect(screen.getByDisplayValue('bar')).toBeInTheDocument();

  await user.click(screen.getByLabelText(/Delete/));
  expect(screen.queryByDisplayValue('foo')).toBeNull();
  expect(screen.queryByDisplayValue('bar')).toBeNull();
  expect(screen.getByPlaceholderText('Column Name')).toBeInTheDocument();
  expect(screen.getByText('Column Formula')).toBeInTheDocument();
});

test('Displays request failure message', async () => {
  const user = userEvent.setup();
  const model = IrisGridTestUtils.makeModel(dh);
  render(<Builder model={model} customColumns={['foo=bar']} />);

  // Should ignore this since not in saving state
  model.dispatchEvent(
    new EventShimCustomEvent(IrisGridModel.EVENT.REQUEST_FAILED, {
      detail: { errorMessage: 'Error message' },
    })
  );
  expect(screen.queryByText(/Error message/)).toBeNull();

  await user.click(screen.getByText(/Save/));
  model.dispatchEvent(
    new EventShimCustomEvent(IrisGridModel.EVENT.REQUEST_FAILED, {
      detail: { errorMessage: 'Error message' },
    })
  );

  expect(screen.getByText(/Error message/)).toBeInTheDocument();

  const input = screen.getByDisplayValue('foo');
  await user.click(input);
  expect(input).not.toHaveClass('is-invalid');
});

test('Handles focus changes via keyboard', async () => {
  const user = userEvent.setup();
  const { container } = render(
    <Builder customColumns={['abc=bar', 'foo=bar']} />
  );

  const nameInputs = screen.getAllByPlaceholderText('Column Name');
  const formulaInputs = container.querySelectorAll(
    '.input-editor-wrapper textarea'
  );
  const deleteButtons = screen.getAllByLabelText(/Delete/);
  const dragHandles = screen.getAllByLabelText(/Drag/);
  await user.click(nameInputs[0]);

  await user.keyboard('{Tab}');
  expect(deleteButtons[0]).toHaveFocus();
  await user.keyboard('{Tab}');
  expect(dragHandles[0]).toHaveFocus();
  await user.keyboard('{Tab}');
  expect(formulaInputs[0]).toHaveFocus();

  await user.keyboard('{Tab}');
  expect(nameInputs[1]).toHaveFocus();
  await user.keyboard('{Tab}');
  expect(deleteButtons[1]).toHaveFocus();
  await user.keyboard('{Tab}');
  expect(dragHandles[1]).toHaveFocus();
  await user.keyboard('{Tab}');
  expect(formulaInputs[1]).toHaveFocus();

  await user.keyboard('{Tab}');
  expect(screen.getByText('Add Another Column')).toHaveFocus();

  await user.keyboard('{Shift>}{Tab}{/Shift}');
  expect(formulaInputs[1]).toHaveFocus();
  await user.keyboard('{Shift>}{Tab}{/Shift}');
  expect(dragHandles[1]).toHaveFocus();
});
