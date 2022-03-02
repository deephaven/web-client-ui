import React from 'react';
import { render } from '@testing-library/react';
import StyleGuide from './StyleGuide';

class MockPath2D {}

window.Path2D = MockPath2D;

describe('<StyleGuide /> mounts', () => {
  test('h1 text of StyleGuide renders', () => {
    expect(() => render(<StyleGuide />)).not.toThrow();
  });
});
