import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DateTimeInput, { addSeparators } from './DateTimeInput';

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

it('trims trailing mask and spaces in the input', () => {
  const onChange = jest.fn();
  const { unmount } = makeDateTimeInput({ onChange });
  const input: HTMLInputElement = screen.getByRole('textbox');

  input.setSelectionRange(22, 22);
  userEvent.type(input, '{backspace}');
  input.setSelectionRange(25, 25);
  userEvent.type(input, '{backspace}');
  expect(input.value).toEqual(
    `2022-02-22 00:00:00.${F}${F}${F}${Z}${F}${F}${F}${Z}000`
  );

  input.setSelectionRange(29, 29);
  userEvent.type(input, '{backspace}');
  expect(input.value).toEqual(`2022-02-22 00:00:00`);

  unmount();
});

it('adds missing trailing zeros', () => {
  const onChange = jest.fn();
  const { unmount } = makeDateTimeInput({
    onChange,
    value: '2022-02-22 00:00:00.000',
  });
  const input: HTMLInputElement = screen.getByRole('textbox');

  input.setSelectionRange(22, 22);
  userEvent.type(input, '1');
  expect(input.value).toEqual(`2022-02-22 00:00:00.100`);
  expect(onChange).toBeCalledWith(`2022-02-22 00:00:00.100000000`);

  userEvent.type(input, '{backspace}');
  expect(input.value).toEqual(`2022-02-22 00:00:00.${F}00`);
  expect(onChange).toBeCalledWith(`2022-02-22 00:00:00.000000000`);

  unmount();
});

it('fills missing time digits with zeros, strips zero-width spaces in onChange', () => {
  const onChange = jest.fn();
  const { unmount } = makeDateTimeInput({
    onChange,
    value: '2022-02-22 11:11:11.111111111',
  });
  const input: HTMLInputElement = screen.getByRole('textbox');

  input.setSelectionRange(22, 22);
  userEvent.type(input, '{backspace}');
  onChange.mockClear();
  input.setSelectionRange(15, 15);
  userEvent.type(input, '{backspace}');
  expect(input.value).toEqual(
    `2022-02-22 11:${F}${F}:11.${F}${F}${F}${Z}111${Z}111`
  );
  expect(onChange).toBeCalledWith(`2022-02-22 11:00:11.000111111`);

  unmount();
});

it('does not fill in missing date digits', () => {
  const onChange = jest.fn();
  const { unmount } = makeDateTimeInput({
    onChange,
    value: '2022-02-22 00:00:00.000',
  });
  const input: HTMLInputElement = screen.getByRole('textbox');

  input.setSelectionRange(5, 5);
  userEvent.type(input, '{backspace}');
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
