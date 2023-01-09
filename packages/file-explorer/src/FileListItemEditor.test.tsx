import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  FileListItemEditor,
  FileListItemEditorProps,
} from './FileListItemEditor';
import { FileStorageItem } from './FileStorage';

function makeItem(name = 'DEFAULT_NAME'): FileStorageItem {
  return {
    id: `id-${name}`,
    type: 'file',
    filename: name,
    basename: name,
  };
}

function makeWrapper({
  item = makeItem(),
  onCancel = jest.fn(),
  onSubmit = jest.fn(),
  validate,
}: Partial<FileListItemEditorProps> = {}) {
  return render(
    <FileListItemEditor
      item={item}
      onCancel={onCancel}
      onSubmit={onSubmit}
      validate={validate}
    />
  );
}

describe('FileListItemEditor', () => {
  it('mounts and unmounts without failing', () => {
    const { unmount } = makeWrapper();
    unmount();
  });

  it('validates on mount', async () => {
    const validate = jest.fn(() => Promise.resolve());
    const itemName = 'test';
    makeWrapper({ item: makeItem(itemName), validate });
    await waitFor(() => expect(validate).toBeCalledWith(itemName));
  });

  it('validates on input changes', async () => {
    const validate = jest.fn(() => Promise.resolve());
    const itemName = 'test';
    makeWrapper({ item: makeItem(itemName), validate });
    const input: HTMLInputElement = screen.getByRole('textbox');
    userEvent.type(input, '123');
    await waitFor(() => expect(validate).toBeCalledWith(`${itemName}1`));
    await waitFor(() => expect(validate).toBeCalledWith(`${itemName}12`));
    await waitFor(() => expect(validate).toBeCalledWith(`${itemName}123`));
  });

  it('validates and submits on enter', async () => {
    const itemName = 'test';
    const validate = jest.fn();
    const onSubmit = jest.fn();
    const onCancel = jest.fn();
    makeWrapper({
      item: makeItem(itemName),
      onCancel,
      onSubmit,
      validate,
    });
    const input: HTMLInputElement = screen.getByRole('textbox');
    userEvent.type(input, '123{enter}');
    await waitFor(() => expect(validate).toBeCalled());
    expect(onSubmit).toBeCalledWith(`${itemName}123`);
    expect(onSubmit).toBeCalledTimes(1);
    expect(onCancel).not.toBeCalled();
  });

  it('validates and submits on blur', async () => {
    const itemName = 'test';
    const validate = jest.fn(() => Promise.resolve());
    const onSubmit = jest.fn();
    const onCancel = jest.fn();
    makeWrapper({
      item: makeItem(itemName),
      onCancel,
      onSubmit,
      validate,
    });
    const input: HTMLInputElement = screen.getByRole('textbox');
    userEvent.type(input, '123');
    expect(input).toHaveFocus();
    userEvent.tab();
    await waitFor(() => expect(validate).toBeCalled());
    expect(onSubmit).toBeCalledWith(`${itemName}123`);
  });

  it('cancels on esc', async () => {
    const validate = jest.fn(() => Promise.resolve());
    const onSubmit = jest.fn();
    const onCancel = jest.fn();
    makeWrapper({
      onCancel,
      onSubmit,
      validate,
    });
    const input: HTMLInputElement = screen.getByRole('textbox');
    userEvent.type(input, '123{esc}');
    await waitFor(() => expect(onCancel).toBeCalled());
    expect(onSubmit).not.toBeCalled();
  });

  it('displays validation error, blocks submit', async () => {
    const errorMessage = 'error message';
    const validate = jest.fn(() => Promise.reject(new Error(errorMessage)));
    const onSubmit = jest.fn();
    const onCancel = jest.fn();
    makeWrapper({
      onCancel,
      onSubmit,
      validate,
    });
    const input: HTMLInputElement = screen.getByRole('textbox');
    userEvent.type(input, '{enter}');
    await waitFor(() =>
      expect(screen.getByText(errorMessage, { exact: false })).not.toBeNull()
    );
    expect(onSubmit).not.toBeCalled();
  });
});
