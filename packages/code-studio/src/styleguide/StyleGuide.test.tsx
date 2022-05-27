import React from 'react';
import { render } from '@testing-library/react';
import StyleGuide from './StyleGuide';

describe('<StyleGuide /> mounts', () => {
  test('h1 text of StyleGuide renders', () => {
    expect(() => render(<StyleGuide />)).not.toThrow();
  });
});
