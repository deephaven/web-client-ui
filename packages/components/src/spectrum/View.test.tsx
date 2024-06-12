import React from 'react';
import { render } from '@testing-library/react';
import { View } from './View';

describe('View', () => {
  it('mounts and unmounts', () => {
    expect(render(<View>{null}</View>)).toBeDefined();
  });

  it('renders without backgroundColor', () => {
    const { getByTestId } = render(<View data-testid="view" />);
    const viewElement = getByTestId('view');
    expect(viewElement).toBeInTheDocument();
  });

  it('renders with backgroundColor', () => {
    const backgroundColor = 'red';
    const { getByTestId } = render(
      <View data-testid="view" backgroundColor={backgroundColor} />
    );
    const viewElement = getByTestId('view');
    expect(viewElement).toBeInTheDocument();
    expect(viewElement).toHaveStyle(`background-color: ${backgroundColor}`);
  });
});
