import React from 'react';
import { mount } from 'enzyme';
import ComboBox from './ComboBox';

function makeWrapper(options = []) {
  return mount(<ComboBox options={options} />);
}

it('mounts and unmounts without failing', () => {
  const wrapper = makeWrapper();
  wrapper.unmount();
});
