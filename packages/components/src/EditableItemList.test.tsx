import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditableItemList from './EditableItemList';

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
}: {
  items?: string[];
  onAdd?: (string) => void;
  onDelete?: (string) => void;
  validate?: (string) => Error | null;
} = {}) {
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

it('adds invalid class for invalid input', () => {
  const validate = jest.fn(() => new Error());
  const { unmount } = makeWrapper({ validate });
  const input: HTMLInputElement = screen.getByRole('textbox');
  userEvent.type(input, '123');
  expect(validate).toBeCalledWith('123');
  expect(input).toHaveClass(INVALID_INPUT_CLASS);
  expectAddButton().toBeDisabled();
  unmount();
});

it('removes invalid class for empty input', () => {
  const validate = jest.fn(() => new Error());
  const { unmount } = makeWrapper({ validate });
  const input: HTMLInputElement = screen.getByRole('textbox');
  expect(input).not.toHaveClass(INVALID_INPUT_CLASS);
  userEvent.type(input, '123');
  expect(input).toHaveClass(INVALID_INPUT_CLASS);
  expectAddButton().toBeDisabled();
  userEvent.type(input, '{backspace}{backspace}{backspace}');
  expect(input.value).toBe('');
  expect(input).not.toHaveClass(INVALID_INPUT_CLASS);
  expectAddButton().toBeDisabled();
  unmount();
});

it('adds valid value on enter and clears input', () => {
  const validate = jest.fn(() => null);
  const onAdd = jest.fn();
  const { unmount } = makeWrapper({ validate, onAdd });
  const input: HTMLInputElement = screen.getByRole('textbox');
  userEvent.type(input, '123');
  expectAddButton().toBeEnabled();
  validate.mockClear();
  userEvent.type(input, '{enter}');
  expect(validate).toBeCalledWith('123');
  expect(onAdd).toBeCalledWith('123');
  expect(input.value).toBe('');
  expectAddButton().toBeDisabled();
  unmount();
});

it('ignores invalid value on enter', () => {
  const validate = jest.fn(() => new Error());
  const onAdd = jest.fn();
  const { unmount } = makeWrapper({ validate, onAdd });
  const input: HTMLInputElement = screen.getByRole('textbox');
  userEvent.type(input, '123');
  validate.mockClear();
  userEvent.type(input, '{enter}');
  expect(validate).toBeCalledWith('123');
  expect(onAdd).not.toBeCalled();
  expect(input.value).toBe('123');
  unmount();
});

it('ignores empty value on enter', () => {
  const validate = jest.fn(() => null);
  const onAdd = jest.fn();
  const { unmount } = makeWrapper({ validate, onAdd });
  const input: HTMLInputElement = screen.getByRole('textbox');
  userEvent.type(input, '{enter}');
  expect(validate).not.toBeCalled();
  expect(onAdd).not.toBeCalled();
  expectAddButton().toBeDisabled();
  unmount();
});
