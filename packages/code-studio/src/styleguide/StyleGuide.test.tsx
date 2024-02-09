import React from 'react';
import { render } from '@testing-library/react';
import { ThemeData, ThemeProvider } from '@deephaven/components';
import { dh } from '@deephaven/jsapi-shim';
import { ApiContext } from '@deephaven/jsapi-bootstrap';
import StyleGuide from './StyleGuide';

window.HTMLElement.prototype.scroll = jest.fn();
window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe('<StyleGuide /> mounts', () => {
  test('h1 text of StyleGuide renders', () => {
    // Provide a non-null array to ThemeProvider to tell it to initialize
    const customThemes: ThemeData[] = [];

    expect(() =>
      render(
        <ApiContext.Provider value={dh}>
          <ThemeProvider themes={customThemes}>
            <StyleGuide />
          </ThemeProvider>
        </ApiContext.Provider>
      )
    ).not.toThrow();
  });
});

describe('StyleGuide test mode', () => {
  beforeEach(() => {
    window.HTMLElement.prototype.scroll = jest.fn();
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  test('default does not activate the isolate input box', () => {
    const { container } = render(
      <ApiContext.Provider value={dh}>
        <ThemeProvider themes={[]}>
          <StyleGuide />
        </ThemeProvider>
      </ApiContext.Provider>
    );

    expect(container.querySelector('input[placeholder="Isolate"]')).toBeNull();
  });
});
