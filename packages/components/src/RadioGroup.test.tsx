import React from 'react';
import { render, screen } from '@testing-library/react';
import RadioGroup from './RadioGroup';
import RadioItem from './RadioItem';

it('shows no markup with no children', () => {
  const { container } = render(<RadioGroup onChange={jest.fn()} />);
  expect(container.childElementCount).toBe(0);
  expect(container.innerHTML).toBe('');
});

it('shows the appropriate children', () => {
  render(
    <RadioGroup onChange={jest.fn()}>
      <RadioItem value="1">1</RadioItem>
      <RadioItem value="2">2</RadioItem>
      <RadioItem value="3">3</RadioItem>
    </RadioGroup>
  );

  expect(screen.getAllByRole('radio').length).toEqual(3);
  expect(screen.getAllByLabelText(/[1,2,3]/).length).toBe(3);
});
