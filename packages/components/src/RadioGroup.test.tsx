import React from 'react';
import { mount } from 'enzyme';
import RadioGroup from './RadioGroup';
import RadioItem from './RadioItem';

it('shows no markup with no children', () => {
  const radio = mount(<RadioGroup onChange={jest.fn()} />);
  expect(radio.html()).toBe(null);
  radio.unmount();
});

it('shows the appropriate children', () => {
  const radio = mount(
    <RadioGroup onChange={jest.fn()}>
      <RadioItem value="1">1</RadioItem>
      <RadioItem value="2">2</RadioItem>
      <RadioItem value="3">3</RadioItem>
    </RadioGroup>
  );

  expect(radio.find('.custom-radio').length).toEqual(3);
  expect(radio.find('.custom-radio .custom-control-input').length).toEqual(3);
  expect(radio.find('.custom-radio .custom-control-label').length).toEqual(3);

  radio.unmount();
});
