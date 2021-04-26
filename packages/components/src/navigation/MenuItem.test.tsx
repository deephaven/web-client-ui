import React from 'react';
import { mount } from 'enzyme';
import MenuItem from './MenuItem';

it('renders no switch when isOn not defined', () => {
  const item = { title: 'TEST' };
  const menuItem = mount(<MenuItem item={item} />);
  expect(menuItem.find('.btn-switch').length).toBe(0);
  menuItem.unmount();
});

it('renders switch when isOn defined', () => {
  const item = { title: 'TEST', isOn: false };
  const menuItem = mount(<MenuItem item={item} />);
  expect(menuItem.find('.btn-switch').length).toBe(1);
  menuItem.unmount();
});
