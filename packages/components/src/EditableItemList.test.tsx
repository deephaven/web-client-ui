import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditableItemList, { EditableItemListProps } from './EditableItemList';

const INVALID_INPUT_CLASS = 'is-invalid';

// Button component creates a new DOM element on 'disabled' prop changes
// Have to get a new reference before each check
function expectAddButton(testId = 'add-item-button') {
  return expect(screen.getByTestId(testId));
}

function makeWrapper({
  items = [],
  onAdd = jest.fn(),
  onDelete = jest.fn(),
  validate = undefined,
}: Partial<EditableItemListProps> = {}) {
  return render(
    <EditableItemList
      items={items}
      onAdd={onAdd}
      onDelete={onDelete}
      validate={validate}
    />
  );
}

it('mounts and unmounts without failing', () => {
  const { unmount } = makeWrapper();
  unmount();
});

it('adds invalid class for invalid input', async () => {
  const user = userEvent.setup();
  const validate = jest.fn(() => new Error());
  const { unmount } = makeWrapper({ validate });
  const input: HTMLInputElement = screen.getByRole('textbox');
  await user.type(input, '123');
  expect(validate).toBeCalledWith('123');
  expect(input).toHaveClass(INVALID_INPUT_CLASS);
  expectAddButton().toBeDisabled();
  unmount();
});

it('removes invalid class for empty input', async () => {
  const user = userEvent.setup();
  const validate = jest.fn(() => new Error());
  const { unmount } = makeWrapper({ validate });
  const input: HTMLInputElement = screen.getByRole('textbox');
  expect(input).not.toHaveClass(INVALID_INPUT_CLASS);
  await user.type(input, '123');
  expect(input).toHaveClass(INVALID_INPUT_CLASS);
  expectAddButton().toBeDisabled();
  await user.type(input, '{Backspace}{Backspace}{Backspace}');
  expect(input.value).toBe('');
  expect(input).not.toHaveClass(INVALID_INPUT_CLASS);
  expectAddButton().toBeDisabled();
  unmount();
});

it('adds valid value on enter and clears input', async () => {
  const user = userEvent.setup();
  const validate = jest.fn(() => null);
  const onAdd = jest.fn();
  const { unmount } = makeWrapper({ validate, onAdd });
  const input: HTMLInputElement = screen.getByRole('textbox');
  await user.type(input, '123');
  expectAddButton().toBeEnabled();
  validate.mockClear();
  await user.type(input, '{Enter}');
  expect(validate).toBeCalledWith('123');
  expect(onAdd).toBeCalledWith('123');
  expect(input.value).toBe('');
  expectAddButton().toBeDisabled();
  unmount();
});

it('ignores invalid value on enter', async () => {
  const user = userEvent.setup();
  const validate = jest.fn(() => new Error());
  const onAdd = jest.fn();
  const { unmount } = makeWrapper({ validate, onAdd });
  const input: HTMLInputElement = screen.getByRole('textbox');
  await user.type(input, '123');
  validate.mockClear();
  await user.type(input, '{Enter}');
  expect(validate).toBeCalledWith('123');
  expect(onAdd).not.toBeCalled();
  expect(input.value).toBe('123');
  unmount();
});

it('ignores empty value on enter', async () => {
  const user = userEvent.setup();
  const validate = jest.fn(() => null);
  const onAdd = jest.fn();
  const { unmount } = makeWrapper({ validate, onAdd });
  const input: HTMLInputElement = screen.getByRole('textbox');
  await user.type(input, '{Enter}');
  expect(validate).not.toBeCalled();
  expect(onAdd).not.toBeCalled();
  expectAddButton().toBeDisabled();
  unmount();
});

describe('delete button', () => {
  const validate = jest.fn(() => null);
  const onAdd = jest.fn();
  const onDelete = jest.fn();
  let unmount;
  let items: HTMLElement[];
  beforeEach(() => {
    jest.resetAllMocks();
    ({ unmount } = makeWrapper({
      items: ['0', '1', '2'],
      validate,
      onAdd,
      onDelete,
    }));
    items = screen.getAllByRole('listitem');
  });

  afterEach(() => {
    unmount();
  });

  it('disabled by default, enabled on item select', async () => {
    const user = userEvent.setup();
    expect(screen.getByTestId('delete-item-button')).toBeDisabled();
    await user.click(items[0]);
    expect(screen.getByTestId('delete-item-button')).toBeEnabled();
    await user.click(items[0]);
    expect(screen.getByTestId('delete-item-button')).toBeDisabled();
  });

  it('enabled on item click and drag', () => {
    expect(screen.getByTestId('delete-item-button')).toBeDisabled();
    fireEvent.mouseDown(items[0]);
    fireEvent.mouseMove(items[0]);
    expect(screen.getByTestId('delete-item-button')).toBeEnabled();
    screen.getByTestId('delete-item-button').click();
    expect(onDelete).toBeCalledWith(expect.arrayContaining(['0']));
  });

  it('enabled click and drag across multiple items', () => {
    expect(screen.getByTestId('delete-item-button')).toBeDisabled();
    fireEvent.mouseDown(items[0]);
    fireEvent.mouseMove(items[0]);
    fireEvent.mouseMove(items[1]);
    fireEvent.mouseMove(items[2]);
    fireEvent.mouseUp(items[2]);
    expect(screen.getByTestId('delete-item-button')).toBeEnabled();
    screen.getByTestId('delete-item-button').click();
    expect(onDelete).toBeCalledWith(expect.arrayContaining(['0', '1', '2']));
  });
});
