import React from 'react';
import { render, screen } from '@testing-library/react';
import { ExampleComponent } from './index';

describe('<ExampleComponent />', () => {
  test('Rendered text', () => {
    render(<ExampleComponent />);
    expect(screen.getByText('Hello World!')).toBeDefined();
  });
});
