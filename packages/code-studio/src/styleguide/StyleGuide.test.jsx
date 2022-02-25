import React from 'react';
import { render, screen } from '@testing-library/react';
import StyleGuide from './StyleGuide';

class MockPath2D {}

window.Path2D = MockPath2D;

describe('<StyleGuide /> mounts', () => {
  test('h1 text of StyleGuide renders', () => {
    render(<StyleGuide />);
    expect(screen.getByText('Deephaven UI Components')).toBeDefined();
  });
});
