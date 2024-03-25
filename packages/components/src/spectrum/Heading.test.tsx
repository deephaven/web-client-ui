import React from 'react';
import { render } from '@testing-library/react';
import { Heading } from './Heading';

describe('Heading', () => {
  it('mounts and unmounts', () => {
    render(<Heading>{null}</Heading>);
  });

  it('renders without color', () => {
    const { getByTestId } = render(<Heading data-testid="Heading" />);
    const HeadingElement = getByTestId('Heading');
    expect(HeadingElement).toBeInTheDocument();
  });

  it('renders with color', () => {
    const color = 'red';
    const { getByTestId } = render(
      <Heading data-testid="Heading" color={color} />
    );
    const HeadingElement = getByTestId('Heading');
    expect(HeadingElement).toBeInTheDocument();
    expect(HeadingElement).toHaveStyle(`color: ${color}`);
  });
});
