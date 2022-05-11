import React from 'react';
import { render } from '@testing-library/react';
import MaskedInput from './MaskedInput';

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
  makeMaskedInput();
});
