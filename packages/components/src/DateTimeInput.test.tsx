import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DateTimeInput from './DateTimeInput';
import { addSeparators } from './DateTimeInputUtils';

const DEFAULT_DATE_TIME = '2022-02-22 00:00:00.000000000';
// Zero width space
const Z = '\u200B';
// Fixed width space
const F = '\u2007';

function makeDateTimeInput({
  value = DEFAULT_DATE_TIME,
  onChange = jest.fn(),
} = {}) {
  return render(<DateTimeInput defaultValue={value} onChange={onChange} />);
}

it('mounts and unmounts properly', () => {
  const { unmount } = makeDateTimeInput();
  unmount();
});

it('trims trailing mask and spaces in the input', async () => {
  const user = userEvent.setup();
  const onChange = jest.fn();
  const { unmount } = makeDateTimeInput({ onChange });
  const input: HTMLInputElement = screen.getByRole('textbox');

  input.focus();
  await user.type(input, '{Backspace}', {
    skipClick: true,
    initialSelectionStart: 20,
    initialSelectionEnd: 23,
  });

  await user.type(input, '{Backspace}', {
    initialSelectionStart: 24,
    initialSelectionEnd: 27,
  });
  expect(input.value).toEqual(
    `2022-02-22 00:00:00.${F}${F}${F}${Z}${F}${F}${F}${Z}000`
  );

  await user.type(input, '{Backspace}', {
    initialSelectionStart: 28,
    initialSelectionEnd: 31,
  });
  expect(input.value).toEqual(`2022-02-22 00:00:00`);

  unmount();
});

it('adds missing trailing zeros', async () => {
  const user = userEvent.setup();
  const onChange = jest.fn();
  const { unmount } = makeDateTimeInput({
    onChange,
    value: '2022-02-22 00:00:00.000',
  });
  const input: HTMLInputElement = screen.getByRole('textbox');

  input.focus();
  await user.type(input, '1', {
    initialSelectionStart: 21,
    initialSelectionEnd: 21,
  });
  expect(input.value).toEqual(`2022-02-22 00:00:00.100`);
  expect(onChange).toBeCalledWith(`2022-02-22 00:00:00.100000000`);

  await user.keyboard('{Backspace}');
  expect(input.value).toEqual(`2022-02-22 00:00:00.${F}00`);
  expect(onChange).toBeCalledWith(`2022-02-22 00:00:00.000000000`);

  unmount();
});

it('fills missing time digits with zeros, strips zero-width spaces in onChange', async () => {
  const user = userEvent.setup();
  const onChange = jest.fn();
  const { unmount } = makeDateTimeInput({
    onChange,
    value: '2022-02-22 11:11:11.111111111',
  });
  const input: HTMLInputElement = screen.getByRole('textbox');

  input.focus();
  await user.type(input, '{Backspace}', {
    skipClick: true,
    initialSelectionStart: 20,
    initialSelectionEnd: 23,
  });
  onChange.mockClear();
  await user.type(input, '{Backspace}', {
    initialSelectionStart: 14,
    initialSelectionEnd: 16,
  });
  expect(input.value).toEqual(
    `2022-02-22 11:${F}${F}:11.${F}${F}${F}${Z}111${Z}111`
  );
  expect(onChange).toBeCalledWith(`2022-02-22 11:00:11.000111111`);

  unmount();
});

it('does not fill in missing date digits', async () => {
  const user = userEvent.setup();
  const onChange = jest.fn();
  const { unmount } = makeDateTimeInput({
    onChange,
    value: '2022-02-22 00:00:00.000',
  });
  const input: HTMLInputElement = screen.getByRole('textbox');

  input.focus();
  await user.type(input, '{Backspace}', {
    skipClick: true,
    initialSelectionStart: 5,
    initialSelectionEnd: 7,
  });
  expect(input.value).toEqual(`2022-${F}${F}-22 00:00:00.000`);
  expect(onChange).toBeCalledWith(`2022-${F}${F}-22 00:00:00.000000000`);

  unmount();
});

describe('addSeparators', () => {
  it('adds separators between nano/micro/milliseconds', () => {
    expect(addSeparators(DEFAULT_DATE_TIME)).toBe(
      `2022-02-22 00:00:00.000${Z}000${Z}000`
    );
  });

  it('adds only necessary separators', () => {
    expect(addSeparators('2022-02-22 00:00:00.000000')).toBe(
      `2022-02-22 00:00:00.000${Z}000`
    );
    expect(addSeparators('2022-02-22')).toBe(`2022-02-22`);
  });
});
