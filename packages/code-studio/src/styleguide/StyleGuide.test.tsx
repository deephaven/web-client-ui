import React from 'react';
import { render } from '@testing-library/react';
import { ChartThemeProvider } from '@deephaven/chart';
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

    // React Spectrum `useVirtualizerItem` depends on `scrollWidth` and `scrollHeight`.
    // Mocking these to avoid React "Maximum update depth exceeded" errors.
    // https://github.com/adobe/react-spectrum/blob/0b2a838b36ad6d86eee13abaf68b7e4d2b4ada6c/packages/%40react-aria/virtualizer/src/useVirtualizerItem.ts#L49C3-L49C60

    // From preview docs: https://reactspectrum.blob.core.windows.net/reactspectrum/726a5e8f0ed50fc8d98e39c74bd6dfeb3660fbdf/docs/react-spectrum/testing.html#virtualized-components
    // The virtualizer will now think it has a visible area of 1000px x 1000px and that the items within it are 40px x 40px
    jest
      .spyOn(window.HTMLElement.prototype, 'clientWidth', 'get')
      .mockImplementation(() => 1000);
    jest
      .spyOn(window.HTMLElement.prototype, 'clientHeight', 'get')
      .mockImplementation(() => 1000);
    jest
      .spyOn(window.HTMLElement.prototype, 'scrollHeight', 'get')
      .mockImplementation(() => 40);
    jest
      .spyOn(window.HTMLElement.prototype, 'scrollWidth', 'get')
      .mockImplementation(() => 40);

    expect(() =>
      render(
        <ApiContext.Provider value={dh}>
          <ThemeProvider themes={customThemes}>
            <ChartThemeProvider>
              <StyleGuide />
            </ChartThemeProvider>
          </ThemeProvider>
        </ApiContext.Provider>
      )
    ).not.toThrow();
  });
});
