import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MaskedInput from './MaskedInput';
import { fillToLength, trimTrailingMask } from './MaskedInputUtils';

const TIME_PATTERN = '([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]';

function makeMaskedInput({
  value = '00:00:00',
  pattern = TIME_PATTERN,
  example = '12:34:56',
  onSubmit = jest.fn(),
} = {}) {
  return render(
    <MaskedInput
      value={value}
      pattern={pattern}
      example={example}
      onSubmit={onSubmit}
    />
  );
}

it('mounts and unmounts properly', () => {
  const { unmount } = makeMaskedInput();
  unmount();
});

it('onSubmit works properly', async () => {
  const onSubmit = jest.fn();
  const { unmount } = makeMaskedInput({ onSubmit });
  const input: HTMLInputElement = screen.getByRole('textbox');
  const user = userEvent.setup();
  await user.type(input, '{enter}');
  expect(onSubmit).toBeCalledTimes(1);
  unmount();
});

describe('fillToLength', () => {
  it('fills empty string with the example value', () => {
    expect(fillToLength('te', 'TEST', 0)).toBe('te');
    expect(fillToLength('te', 'TEST', 2)).toBe('te');
    expect(fillToLength('te', 'TEST', 4)).toBe('teST');
    expect(fillToLength('te', 'TEST', 10)).toBe('teST');
  });
});

describe('trimTrailingMask', () => {
  it('trims characters matching the empty mask on the right', () => {
    expect(trimTrailingMask('00:00:00', '  :  :  ')).toBe('00:00:00');
    expect(trimTrailingMask('00:00:00', '  :  ')).toBe('00:00:00');
    expect(trimTrailingMask('00:00', '  :  :  ')).toBe('00:00');
    expect(trimTrailingMask('00:00:  ', '  :  :  ')).toBe('00:00');
    expect(trimTrailingMask('0 :  :  ', '  :  :  ')).toBe('0');
    expect(trimTrailingMask('  :  :  ', '  :  :  ')).toBe('');
    expect(trimTrailingMask('', '  :  :  ')).toBe('');
    expect(trimTrailingMask('00:00:00', '')).toBe('00:00:00');
    expect(trimTrailingMask('', '')).toBe('');
  });
});
