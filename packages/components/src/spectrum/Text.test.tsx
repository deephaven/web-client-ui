import React from 'react';
import { render } from '@testing-library/react';
import { Text } from './Text';

describe('Text', () => {
  it('mounts and unmounts', () => {
    expect(render(<Text>test</Text>)).toBeDefined();
  });

  it('renders without color', () => {
    const { getByTestId } = render(<Text data-testid="Text">test</Text>);
    const TextElement = getByTestId('Text');
    expect(TextElement).toBeInTheDocument();
  });

  it('renders with color', () => {
    const color = 'red';
    const { getByTestId } = render(
      <Text data-testid="Text" color={color}>
        test
      </Text>
    );
    const TextElement = getByTestId('Text');
    expect(TextElement).toBeInTheDocument();
    expect(TextElement).toHaveStyle(`color: ${color}`);
  });
});
