import React from 'react';
import { render } from '@testing-library/react';
import ComboBox from './ComboBox';

function makeWrapper(options = []) {
  return render(<ComboBox options={options} />);
}

it('mounts and unmounts without failing', () => {
  makeWrapper();
});
