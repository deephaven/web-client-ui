import React from 'react';
import { render, screen } from '@testing-library/react';
import RadioGroup from './RadioGroup';
import RadioItem from './RadioItem';

it('shows no markup with no children', () => {
  const radio = render(<RadioGroup onChange={jest.fn()} />);
  expect(radio.baseElement.firstChild.firstChild).toBe(null);
});

it('shows the appropriate children', () => {
  const radio = render(
    <RadioGroup onChange={jest.fn()}>
      <RadioItem value="1">1</RadioItem>
      <RadioItem value="2">2</RadioItem>
      <RadioItem value="3">3</RadioItem>
    </RadioGroup>
  );

  expect(screen.getAllByRole('radio').length).toEqual(3);
  expect(radio.baseElement.firstChild.childNodes.length).toEqual(3);
});
