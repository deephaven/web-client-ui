import React from 'react';
import { render, screen } from '@testing-library/react';
import MenuItem from './MenuItem';

it('renders no switch when isOn not defined', () => {
  const item = { title: 'TEST' };
  render(<MenuItem item={item} />);
  expect(screen.queryAllByRole('button').length).toBe(0);
});

it('renders switch when isOn defined', () => {
  const item = { title: 'TEST', isOn: false };
  render(<MenuItem item={item} />);
  expect(screen.queryAllByRole('button').length).toBe(1);
});
