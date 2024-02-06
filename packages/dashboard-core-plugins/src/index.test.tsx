import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import Dashboard from '@deephaven/dashboard';
import { createMockStore } from '@deephaven/redux';
import { dh } from '@deephaven/jsapi-shim';
import { ApiContext, ObjectFetcherContext } from '@deephaven/jsapi-bootstrap';
import { PluginsContext } from '@deephaven/plugin';
import {
  ConsolePlugin,
  FilterPlugin,
  LinkerPlugin,
  MarkdownPlugin,
  WidgetLoaderPlugin,
} from '.';

it('handles mounting and unmount core plugins properly', () => {
  const store = createMockStore();
  const fetchObject = jest.fn();
  render(
    <ApiContext.Provider value={dh}>
      <ObjectFetcherContext.Provider value={fetchObject}>
        <PluginsContext.Provider value={new Map()}>
          <Provider store={store}>
            <Dashboard>
              <FilterPlugin />
              <ConsolePlugin />
              <LinkerPlugin />
              <MarkdownPlugin />
              <WidgetLoaderPlugin />
            </Dashboard>
          </Provider>
        </PluginsContext.Provider>
      </ObjectFetcherContext.Provider>
    </ApiContext.Provider>
  );
});
