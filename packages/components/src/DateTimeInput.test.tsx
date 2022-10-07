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

it('trims trailing mask and spaces, strips zero-width spaces in onChange', () => {
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
  expect(onChange).toBeCalledWith(
    `2022-02-22 00:00:00.${F}${F}${F}${F}${F}${F}000`
  );

  input.setSelectionRange(29, 29);
  userEvent.type(input, '{backspace}');
  expect(input.value).toEqual(`2022-02-22 00:00:00`);
  expect(onChange).toBeCalledWith(`2022-02-22 00:00:00`);

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
