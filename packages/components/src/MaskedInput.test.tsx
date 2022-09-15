import React from 'react';
import { render } from '@testing-library/react';
import MaskedInput, { fillToLength, trimTrailingMask } from './MaskedInput';

const TIME_PATTERN = '([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]';

function makeMaskedInput({
  value = '00:00:00',
  pattern = TIME_PATTERN,
  example = '12:34:56',
} = {}) {
  return render(
    <MaskedInput value={value} pattern={pattern} example={example} />
  );
}

it('mounts and unmounts properly', () => {
  const { unmount } = makeMaskedInput();
  unmount();
});

describe('fillToLength', () => {
  it('fills empty string with example value', () => {
    expect(fillToLength('te', 'TEST', 0)).toBe('te');
    expect(fillToLength('te', 'TEST', 2)).toBe('te');
    expect(fillToLength('te', 'TEST', 4)).toBe('teST');
    expect(fillToLength('te', 'TEST', 10)).toBe('teST');
  });
});

describe('trimTrailingMask', () => {
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
