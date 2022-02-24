import React from 'react';
import { render, screen } from '@testing-library/react';
import StyleGuide from './StyleGuide';

describe('<StyleGuide /> mounts', () => {
  test('h1 text of StyleGuide renders', () => {
    render(<StyleGuide />);
    expect(screen.getByText('Deephaven UI Components')).toBeDefined();
  });
});
